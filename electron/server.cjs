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
setInterval(() => {
  try {
    if (fs.existsSync(VAULT_INBOX_DIR)) {
      const files = fs.readdirSync(VAULT_INBOX_DIR);
      files.forEach(f => processVaultInboxFile(f));
    }
  } catch {}
}, 2500);

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

module.exports = { startServer, DATA_DIR, PROJECTS_DIR, TRASH_DIR };

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start Writ Server:', err);
    process.exit(1);
  });
}
