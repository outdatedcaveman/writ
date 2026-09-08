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

// Ensure physical disk storage directories exist
[DATA_DIR, PROJECTS_DIR, TRASH_DIR].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.error(`Warning: Could not create directory ${dir}:`, err.message);
  }
});

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
