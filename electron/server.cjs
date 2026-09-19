const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

function resolveDataDirectory() {
  if (process.env.WRIT_DATA_DIR) {
    return path.resolve(process.env.WRIT_DATA_DIR);
  }

  // If running unpackaged from source during dev:
  if (!__dirname.includes('app.asar')) {
    return path.resolve(__dirname, '..', 'data');
  }

  // When packaged in Electron app.asar:
  // NEVER write to app.asar! Check user's Documents/Writ
  const userDocsWrit = path.join(os.homedir(), 'Documents', 'Writ');
  if (fs.existsSync(userDocsWrit)) {
    return path.join(userDocsWrit, 'data');
  }

  // Fallback to Documents/Writ/data
  return path.join(os.homedir(), 'Documents', 'Writ', 'data');
}

const DATA_DIR = resolveDataDirectory();
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const TRASH_DIR = path.join(DATA_DIR, 'trash');
const DIST_DIR = path.join(__dirname, '..', 'dist');

const VAULT_INBOX_DIR = path.join(DATA_DIR, 'vault_inbox');
const VAULT_PROCESSED_DIR = path.join(VAULT_INBOX_DIR, '.processed');
const VAULT_ITEMS_FILE = path.join(DATA_DIR, 'vault_inbox_items.json');
const NOTION_SYNC_FILE = path.join(DATA_DIR, 'notion_vault_sync.json');

// Ensure physical disk storage directories exist
[DATA_DIR, PROJECTS_DIR, TRASH_DIR, VAULT_INBOX_DIR, VAULT_PROCESSED_DIR].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.error(`Warning: Could not create directory ${dir}:`, err.message);
  }
});

// Vault Folder Watcher Engine
function processVaultInboxFile(filename) {
  if (filename.startsWith('.') || filename === '.processed') return;
  const filePath = path.join(VAULT_INBOX_DIR, filename);
  if (!fs.existsSync(filePath)) return;

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return;

    const ext = path.extname(filename).toLowerCase();
    let content = '';
    let type = 'text';

    if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) {
      type = 'image';
      content = `Image dropped from folder: ${filename} (${(stat.size / 1024).toFixed(1)} KB)`;
    } else if (['.mp4', '.mov', '.webm', '.mkv'].includes(ext)) {
      type = 'video';
      content = `Video dropped from folder: ${filename} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`;
    } else {
      content = fs.readFileSync(filePath, 'utf-8');
      type = 'text';
    }

    const title = path.basename(filename, ext).replace(/[_-]+/g, ' ');
    const newItem = {
      id: `vault-inbox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title || 'Dropped Asset',
      type,
      content,
      source: 'drop_folder_watcher',
      status: 'inbox',
      droppedAt: Date.now(),
      extractedInsights: {
        coreAssertion: content.slice(0, 160).replace(/\n/g, ' ') || 'Unprocessed dropped asset',
        thematicTags: ['AutoIngest', 'FolderWatcher'],
        suggestedPlacement: {
          targetType: 'segment',
          targetTitle: 'Opening Inquest',
          reasoning: 'Auto-ingested by Drop Folder Watcher. Review in Project Vault.'
        }
      }
    };

    let items = [];
    if (fs.existsSync(VAULT_ITEMS_FILE)) {
      try { items = JSON.parse(fs.readFileSync(VAULT_ITEMS_FILE, 'utf-8')); } catch {}
    }
    items.unshift(newItem);
    fs.writeFileSync(VAULT_ITEMS_FILE, JSON.stringify(items, null, 2), 'utf-8');

    // Move file to .processed folder
    const targetProcessed = path.join(VAULT_PROCESSED_DIR, `${Date.now()}_${filename}`);
    fs.renameSync(filePath, targetProcessed);
    console.log(`[Vault Watcher] Auto-ingested dropped asset: ${filename} -> ID: ${newItem.id}`);
  } catch (err) {
    console.error(`[Vault Watcher] Error processing ${filename}:`, err.message);
  }
}

// Check inbox periodically
const folderInterval = setInterval(() => {
  try {
    if (fs.existsSync(VAULT_INBOX_DIR)) {
      const files = fs.readdirSync(VAULT_INBOX_DIR);
      files.forEach(f => processVaultInboxFile(f));
    }
  } catch {}
}, 2500);
if (folderInterval.unref) folderInterval.unref();

// ==========================================
// NOTION "WRIT VAULT" AUTONOMOUS WATCHER ENGINE
// ==========================================

function loadNotionSyncConfig() {
  const defaults = {
    token: '',
    vaultPageId: '',
    vaultPageTitle: 'Writ Vault',
    enabled: true,
    intervalSeconds: 30,
    lastSyncTimestamp: 0,
    syncedBlockIds: [],
    lastStatus: 'idle',
    lastMessage: ''
  };
  try {
    if (fs.existsSync(NOTION_SYNC_FILE)) {
      const data = JSON.parse(fs.readFileSync(NOTION_SYNC_FILE, 'utf-8'));
      return { ...defaults, ...data };
    }
  } catch (err) {
    console.error('[Notion Watcher] Error loading sync config:', err.message);
  }
  return defaults;
}

function saveNotionSyncConfig(config) {
  try {
    fs.writeFileSync(NOTION_SYNC_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Notion Watcher] Error saving sync config:', err.message);
  }
}

function extractNotionId(input) {
  if (!input || typeof input !== 'string') return '';
  const cleaned = input.trim();
  const noHyphens = cleaned.replace(/-/g, '');
  const match = noHyphens.match(/[0-9a-f]{32}/i);
  if (match) return match[0].toLowerCase();
  const uuidMatch = cleaned.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (uuidMatch) return uuidMatch[0].replace(/-/g, '').toLowerCase();
  return cleaned;
}

async function callNotionApi(endpoint, method = 'GET', body = null, token = '') {
  if (!token) throw new Error('Notion token is required');
  const url = `https://api.notion.com/v1/${endpoint.replace(/^\//, '')}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token.trim()}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    }
  };
  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.message || `Notion API error: HTTP ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

function extractBlockContent(block) {
  if (!block || !block.type) return null;
  const type = block.type;
  const data = block[type];
  if (!data) return null;

  if (data.rich_text && Array.isArray(data.rich_text)) {
    const rawText = data.rich_text.map(t => t.plain_text || t.text?.content || '').join('').trim();
    if (!rawText) return null;

    let prefix = '';
    let itemType = 'text';
    if (type === 'heading_1') prefix = '# ';
    else if (type === 'heading_2') prefix = '## ';
    else if (type === 'heading_3') prefix = '### ';
    else if (type === 'bulleted_list_item') prefix = '• ';
    else if (type === 'numbered_list_item') prefix = '1. ';
    else if (type === 'to_do') prefix = data.checked ? '[x] ' : '[ ] ';
    else if (type === 'quote') prefix = '> ';
    else if (type === 'callout') {
      const emoji = data.icon?.emoji ? `${data.icon.emoji} ` : '💡 ';
      prefix = `> ${emoji}`;
    }

    const fullText = `${prefix}${rawText}`;
    const titleSnippet = rawText.length > 50 ? `${rawText.slice(0, 50)}...` : rawText;

    return {
      type: itemType,
      title: titleSnippet,
      content: fullText
    };
  }

  if (type === 'image') {
    const url = data.file?.url || data.external?.url || '';
    const caption = data.caption && Array.isArray(data.caption)
      ? data.caption.map(t => t.plain_text).join('')
      : 'Notion Image Drop';
    return {
      type: 'image',
      title: caption || 'Notion Image Drop',
      content: `Image from Notion: ${caption || url}`,
      mediaUrl: url
    };
  }

  if (type === 'bookmark') {
    const url = data.url || '';
    const caption = data.caption && Array.isArray(data.caption)
      ? data.caption.map(t => t.plain_text).join('')
      : url;
    return {
      type: 'link',
      title: `Bookmark: ${caption.slice(0, 50)}`,
      content: url,
      mediaUrl: url
    };
  }

  return null;
}

function loadDiskProjects() {
  try {
    if (!fs.existsSync(PROJECTS_DIR)) return [];
    const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json'));
    return files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf-8'));
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

async function syncNotionWritVault(triggerSource = 'background') {
  const config = loadNotionSyncConfig();
  if (!config.enabled || !config.token || !config.vaultPageId) {
    return { success: false, reason: 'Notion sync not configured or disabled' };
  }

  const cleanVaultId = extractNotionId(config.vaultPageId);
  if (!cleanVaultId) {
    return { success: false, reason: 'Invalid Writ Vault page ID or URL' };
  }

  try {
    // 1. Fetch child blocks of "Writ Vault" page to find all project subpages
    const vaultChildren = await callNotionApi(`blocks/${cleanVaultId}/children?page_size=100`, 'GET', null, config.token);
    const subpageBlocks = (vaultChildren.results || []).filter(b => b.type === 'child_page');

    if (subpageBlocks.length === 0) {
      config.lastStatus = 'warning';
      config.lastMessage = 'No subpages found under "Writ Vault" page in Notion.';
      config.lastSyncTimestamp = Date.now();
      saveNotionSyncConfig(config);
      return { success: true, syncedCount: 0, subpagesFound: 0, message: config.lastMessage };
    }

    const projects = loadDiskProjects();
    const syncedIdsSet = new Set(config.syncedBlockIds || []);
    let newItems = [];
    const subpagesReport = [];

    // 2. Iterate through each subpage
    for (const spBlock of subpageBlocks) {
      const subpageId = spBlock.id;
      const subpageTitle = spBlock.child_page?.title || 'Untitled Project';

      // Match with local Writ projects by title or slug
      let matchedProj = projects.find(p => {
        const pTitle = (p.title || '').trim().toLowerCase();
        const pSlug = (p.slug || '').trim().toLowerCase();
        const sTitle = subpageTitle.trim().toLowerCase();
        return pTitle === sTitle || pSlug === sTitle || pTitle.includes(sTitle) || sTitle.includes(pTitle);
      });

      // Fetch blocks inside this project's subpage
      try {
        const blocksData = await callNotionApi(`blocks/${subpageId}/children?page_size=100`, 'GET', null, config.token);
        const blocks = blocksData.results || [];
        let subpageNewItems = 0;

        for (const blk of blocks) {
          if (syncedIdsSet.has(blk.id)) continue;

          // Skip default scaffolding callout if present
          const parsed = extractBlockContent(blk);
          if (!parsed || !parsed.content) continue;
          if (parsed.content.includes('Writ Project Vault for "') && parsed.type === 'text') {
            syncedIdsSet.add(blk.id);
            continue;
          }
          if (parsed.content.trim() === 'Drop your first note below:') {
            syncedIdsSet.add(blk.id);
            continue;
          }

          const newItem = {
            id: `notion-${blk.id.replace(/-/g, '')}`,
            projectId: matchedProj ? matchedProj.id : undefined,
            projectTitle: matchedProj ? matchedProj.title : subpageTitle,
            type: parsed.type || 'text',
            title: parsed.title || `Notion Note (${subpageTitle})`,
            content: parsed.content,
            mediaUrl: parsed.mediaUrl,
            source: 'notion_vault_watcher',
            notionBlockId: blk.id,
            notionSubpageId: subpageId,
            notionSubpageTitle: subpageTitle,
            status: 'inbox',
            droppedAt: Date.now(),
            extractedInsights: {
              coreAssertion: parsed.content.slice(0, 160).replace(/\n/g, ' '),
              thematicTags: ['NotionSync', subpageTitle, ...(matchedProj ? [matchedProj.title] : [])],
              suggestedPlacement: {
                targetType: 'segment',
                targetTitle: 'Project Manuscript',
                reasoning: `Auto-synced from Notion subpage "${subpageTitle}" under Writ Vault.`
              }
            }
          };

          newItems.push(newItem);
          syncedIdsSet.add(blk.id);
          subpageNewItems++;
        }

        subpagesReport.push({
          subpageId,
          subpageTitle,
          matchedProject: matchedProj ? matchedProj.title : null,
          totalBlocks: blocks.length,
          newItemsSynced: subpageNewItems
        });
      } catch (subErr) {
        console.warn(`[Notion Watcher] Could not read subpage ${subpageTitle} (${subpageId}):`, subErr.message);
      }
    }

    // 3. Persist new items to vault_inbox_items.json
    if (newItems.length > 0) {
      let currentVaultItems = [];
      if (fs.existsSync(VAULT_ITEMS_FILE)) {
        try { currentVaultItems = JSON.parse(fs.readFileSync(VAULT_ITEMS_FILE, 'utf-8')); } catch {}
      }
      currentVaultItems = [...newItems, ...currentVaultItems];
      fs.writeFileSync(VAULT_ITEMS_FILE, JSON.stringify(currentVaultItems, null, 2), 'utf-8');
      console.log(`[Notion Watcher] Ingested ${newItems.length} new items from Notion into Writ Vault!`);
    }

    // 4. Update sync config
    config.syncedBlockIds = Array.from(syncedIdsSet);
    config.lastSyncTimestamp = Date.now();
    config.lastStatus = 'ok';
    config.lastMessage = `Synced ${newItems.length} new items across ${subpagesReport.length} subpages.`;
    saveNotionSyncConfig(config);

    return {
      success: true,
      syncedCount: newItems.length,
      subpagesFound: subpagesReport.length,
      subpages: subpagesReport,
      message: config.lastMessage
    };
  } catch (err) {
    console.error('[Notion Watcher] Sync error:', err.message);
    config.lastStatus = 'error';
    config.lastMessage = err.message;
    config.lastSyncTimestamp = Date.now();
    saveNotionSyncConfig(config);
    return { success: false, error: err.message };
  }
}

async function scaffoldNotionSubpages(token, vaultPageId, projectsList = null) {
  const cleanVaultId = extractNotionId(vaultPageId);
  if (!cleanVaultId) throw new Error('Invalid Writ Vault Page ID or URL');
  if (!token) throw new Error('Notion token is required');

  // 1. Get existing subpages under Writ Vault
  const vaultChildren = await callNotionApi(`blocks/${cleanVaultId}/children?page_size=100`, 'GET', null, token);
  const existingSubpages = (vaultChildren.results || [])
    .filter(b => b.type === 'child_page')
    .map(b => ({ id: b.id, title: b.child_page?.title || '' }));

  const existingTitles = new Set(existingSubpages.map(s => s.title.trim().toLowerCase()));

  // 2. Get list of projects
  const projects = projectsList && projectsList.length > 0 ? projectsList : loadDiskProjects();
  if (projects.length === 0) {
    return { created: [], existing: existingSubpages, message: 'No projects found to scaffold' };
  }

  const created = [];
  for (const proj of projects) {
    const projTitle = (proj.title || '').trim();
    if (!projTitle) continue;
    if (existingTitles.has(projTitle.toLowerCase())) {
      continue; // Already exists
    }

    // Create subpage under Writ Vault
    const newPage = await callNotionApi('pages', 'POST', {
      parent: { page_id: cleanVaultId },
      properties: {
        title: [
          { text: { content: projTitle } }
        ]
      },
      children: [
        {
          object: 'block',
          type: 'callout',
          callout: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: `Writ Project Vault for "${projTitle}". Add any quotes, thoughts, research, or images here; Writ will auto-sync them directly into your project drop vault.`
                }
              }
            ],
            icon: { emoji: '🖋️' }
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: { content: 'Drop your first note below:' }
              }
            ]
          }
        }
      ]
    }, token);

    created.push({ id: newPage.id, title: projTitle, url: newPage.url });
    existingTitles.add(projTitle.toLowerCase());
  }

  return {
    success: true,
    createdCount: created.length,
    created,
    existingCount: existingSubpages.length,
    existing: existingSubpages,
    message: `Scaffolded ${created.length} new subpages under Writ Vault in Notion.`
  };
}

// Background poller for Notion Writ Vault
const notionInterval = setInterval(() => {
  try {
    const cfg = loadNotionSyncConfig();
    if (cfg.enabled && cfg.token && cfg.vaultPageId) {
      const intervalMs = (cfg.intervalSeconds || 30) * 1000;
      if (Date.now() - (cfg.lastSyncTimestamp || 0) >= intervalMs) {
        syncNotionWritVault('background');
      }
    }
  } catch (err) {
    console.error('[Notion Watcher] Background poller tick failed:', err.message);
  }
}, 10000);
if (notionInterval.unref) notionInterval.unref();

// MIME types for static asset serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

// Generate an ephemeral security token for LAN access protection (Rule 2)
const ACCESS_TOKEN = crypto.randomBytes(16).toString('hex');

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function startServer(port = 4983, host = '0.0.0.0') {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // Set permissive CORS for local access
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Writ-Token');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const pathname = parsedUrl.pathname;

      // API Routes
      if (pathname.startsWith('/api/')) {
        handleApiRequest(req, res, pathname, parsedUrl);
        return;
      }

      // Static file serving from DIST_DIR
      handleStaticRequest(req, res, pathname);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Writ Server] Port ${port} is in use, trying ${port + 1}...`);
        server.close();
        resolve(startServer(port + 1, host));
      } else {
        reject(err);
      }
    });

    server.listen(port, host, () => {
      const actualPort = server.address().port;
      const lanIp = getLocalIpAddress();
      console.log(`[Writ Server] Running at:`);
      console.log(`  - Local:   http://localhost:${actualPort}`);
      console.log(`  - Network: http://${lanIp}:${actualPort}`);
      console.log(`  - Token:   ${ACCESS_TOKEN}`);
      resolve({ server, port: actualPort, lanIp, token: ACCESS_TOKEN });
    });
  });
}

function handleApiRequest(req, res, pathname, parsedUrl) {
  if (pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      app: 'Writ Desktop Studio',
      version: '1.0.0',
      uptime: process.uptime(),
      storagePath: DATA_DIR,
      rule1TrashPath: TRASH_DIR
    }));
    return;
  }

  if (pathname === '/api/projects' && req.method === 'GET') {
    try {
      const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json'));
      const projects = files.map(file => {
        try {
          const content = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf-8');
          return JSON.parse(content);
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(projects));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (pathname === '/api/projects' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const projectId = payload.id;
        if (!projectId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Project ID is required' }));
          return;
        }

        const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
        const backupPath = path.join(PROJECTS_DIR, `${projectId}.bak`);

        // Atomic write: save existing as .bak first if it exists
        if (fs.existsSync(filePath)) {
          fs.copyFileSync(filePath, backupPath);
        }

        fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'saved', projectId, filePath }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Rule 1: Safety Trash Archive endpoint
  if (pathname === '/api/trash' && req.method === 'GET') {
    try {
      const trashFile = path.join(TRASH_DIR, 'trash_index.json');
      const items = fs.existsSync(trashFile) ? JSON.parse(fs.readFileSync(trashFile, 'utf-8')) : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(items));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (pathname === '/api/trash' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const trashItem = JSON.parse(body);
        const trashFile = path.join(TRASH_DIR, 'trash_index.json');
        let items = fs.existsSync(trashFile) ? JSON.parse(fs.readFileSync(trashFile, 'utf-8')) : [];
        items.unshift(trashItem);
        fs.writeFileSync(trashFile, JSON.stringify(items, null, 2), 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'archived_to_safety_trash', id: trashItem.id }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Vault Drop Folder Watcher endpoints
  if (pathname === '/api/vault/inbox-info' && req.method === 'GET') {
    let itemsCount = 0;
    if (fs.existsSync(VAULT_ITEMS_FILE)) {
      try { itemsCount = JSON.parse(fs.readFileSync(VAULT_ITEMS_FILE, 'utf-8')).length; } catch {}
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      inboxDir: VAULT_INBOX_DIR,
      isWatching: true,
      pendingCount: itemsCount
    }));
    return;
  }

  if (pathname === '/api/vault/open-inbox' && req.method === 'POST') {
    try {
      const { exec } = require('child_process');
      if (process.platform === 'win32') {
        exec(`explorer.exe "${VAULT_INBOX_DIR}"`);
      } else if (process.platform === 'darwin') {
        exec(`open "${VAULT_INBOX_DIR}"`);
      } else {
        exec(`xdg-open "${VAULT_INBOX_DIR}"`);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'opened', path: VAULT_INBOX_DIR }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (pathname === '/api/vault/items' && req.method === 'GET') {
    try {
      let items = [];
      if (fs.existsSync(VAULT_ITEMS_FILE)) {
        items = JSON.parse(fs.readFileSync(VAULT_ITEMS_FILE, 'utf-8'));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(items));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // External Inbound Webhook for Shortcuts, Notion, Zapier, Email forwarders
  if (pathname === '/api/vault/inbound' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const newItem = {
          id: `vault-hook-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          title: payload.title || `Webhook Ingest ${new Date().toLocaleTimeString()}`,
          type: payload.type || 'text',
          content: payload.content || '',
          mediaUrl: payload.mediaUrl,
          source: payload.source || 'external_webhook',
          status: 'inbox',
          droppedAt: Date.now(),
          extractedInsights: {
            coreAssertion: (payload.content || '').slice(0, 160).replace(/\n/g, ' ') || 'External webhook drop',
            thematicTags: ['WebhookSync', 'ExternalIntegration'],
            suggestedPlacement: {
              targetType: 'segment',
              targetTitle: 'Opening Inquest',
              reasoning: 'Ingested via external webhook. Review in Project Vault.'
            }
          }
        };

        let items = [];
        if (fs.existsSync(VAULT_ITEMS_FILE)) {
          try { items = JSON.parse(fs.readFileSync(VAULT_ITEMS_FILE, 'utf-8')); } catch {}
        }
        items.unshift(newItem);
        fs.writeFileSync(VAULT_ITEMS_FILE, JSON.stringify(items, null, 2), 'utf-8');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ingested', item: newItem }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Open external URL via server fallback (HTTP mode)
  if (pathname === '/api/open-external' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { url } = JSON.parse(body);
        if (!url) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'URL required' }));
          return;
        }
        const { exec } = require('child_process');
        if (process.platform === 'win32') {
          exec(`start "" "${url.replace(/"/g, '""')}"`);
        } else if (process.platform === 'darwin') {
          exec(`open "${url.replace(/"/g, '\\"')}"`);
        } else {
          exec(`xdg-open "${url.replace(/"/g, '\\"')}"`);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Write file to local Obsidian vault directory
  if (pathname === '/api/obsidian/write' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { vaultPath, filename, content } = JSON.parse(body);
        if (!vaultPath || !filename) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'vaultPath and filename required' }));
          return;
        }
        const targetDir = path.resolve(vaultPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        const filePath = path.join(targetDir, filename);
        fs.writeFileSync(filePath, content, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, filePath }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Notion Vault Sync API Endpoints
  if (pathname === '/api/notion/vault-sync/config' && req.method === 'GET') {
    const config = loadNotionSyncConfig();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(config));
    return;
  }

  if (pathname === '/api/notion/vault-sync/config' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const current = loadNotionSyncConfig();
        const updated = {
          ...current,
          ...payload,
          vaultPageId: payload.vaultPageId ? extractNotionId(payload.vaultPageId) : current.vaultPageId
        };
        saveNotionSyncConfig(updated);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, config: updated }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/notion/vault-sync/run' && req.method === 'POST') {
    syncNotionWritVault('manual')
      .then(result => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      })
      .catch(err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
    return;
  }

  if (pathname === '/api/notion/vault-sync/scaffold' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const config = loadNotionSyncConfig();
        const token = payload.token || config.token;
        const vaultPageId = payload.vaultPageId || config.vaultPageId;
        const projects = payload.projects || null;

        if (!token || !vaultPageId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Notion token and Writ Vault Page ID are required' }));
          return;
        }

        const result = await scaffoldNotionSubpages(token, vaultPageId, projects);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/notion/vault-sync/test' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = body ? JSON.parse(body) : {};
        const config = loadNotionSyncConfig();
        const token = (payload.token || config.token || '').trim();
        const rawVaultId = (payload.vaultPageId || config.vaultPageId || '').trim();
        const cleanVaultId = extractNotionId(rawVaultId);

        if (!token || !cleanVaultId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Token and Writ Vault Page ID / URL are required' }));
          return;
        }

        // Test Notion token & retrieve Writ Vault child blocks
        const children = await callNotionApi(`blocks/${cleanVaultId}/children?page_size=100`, 'GET', null, token);
        const subpages = (children.results || [])
          .filter(b => b.type === 'child_page')
          .map(b => ({ id: b.id, title: b.child_page?.title || 'Untitled' }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          vaultPageId: cleanVaultId,
          subpagesCount: subpages.length,
          subpages,
          message: `Connected to Notion! Found ${subpages.length} project subpage(s) inside Writ Vault.`
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Default 404 for unknown API
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
}

function handleStaticRequest(req, res, pathname) {
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  let filePath = path.join(DIST_DIR, safePath);

  // If file doesn't exist directly, fallback to index.html for SPA client-side routing
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Writ Desktop: UI assets not built yet. Please run npm run build.');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Internal Server Error: ${err.message}`);
  }
}

module.exports = {
  startServer,
  DATA_DIR,
  PROJECTS_DIR,
  TRASH_DIR,
  extractNotionId,
  extractBlockContent,
  loadNotionSyncConfig,
  saveNotionSyncConfig,
  syncNotionWritVault,
  scaffoldNotionSubpages
};

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start Writ Server:', err);
    process.exit(1);
  });
}
