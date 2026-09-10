const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer, DATA_DIR, PROJECTS_DIR, TRASH_DIR } = require('./server.cjs');

const LOG_FILE = 'c:\\Users\\bruno\\Documents\\Writ\\main_debug.txt';
function log(msg) {
  try {
    fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] [PID ${process.pid}] ${msg}\n`);
  } catch {}
}

let mainWindow = null;
let serverInfo = null;

log('App starting');

process.on('uncaughtException', (err) => {
  log(`UncaughtException: ${err.stack || err.message}`);
  console.error('[Writ Main UncaughtException]:', err);
});
process.on('unhandledRejection', (reason) => {
  log(`UnhandledRejection: ${reason}`);
  console.error('[Writ Main UnhandledRejection]:', reason);
});
process.on('exit', (code) => {
  log(`Process exiting with code ${code}`);
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
log(`requestSingleInstanceLock result: ${gotTheLock}`);
if (!gotTheLock) {
  log('Could not obtain single instance lock. Quitting...');
  app.quit();
} else {
  app.on('second-instance', () => {
    log('Second instance attempted! Restoring main window...');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

async function createWindow() {
  log('createWindow: start');
  // Start embedded server first
  try {
    serverInfo = await startServer(4983);
    log(`createWindow: server running on port ${serverInfo.port}`);
  } catch (err) {
    log(`createWindow: server failed to start: ${err.message}`);
    console.error('Error starting embedded server:', err);
    serverInfo = { port: 4983, lanIp: '127.0.0.1', token: '' };
  }

  const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');

  log('createWindow: creating BrowserWindow');
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#080808',
    title: 'Writ — Literary Studio',
    titleBarStyle: 'default',
    show: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.webContents.on('render-process-gone', (event, detailed) => {
    log(`webContents render-process-gone: ${JSON.stringify(detailed)}`);
  });
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log(`webContents did-fail-load: code=${errorCode}, desc=${errorDescription}, url=${validatedURL}`);
  });
  mainWindow.webContents.on('did-finish-load', () => {
    log('webContents did-finish-load success');
  });

  // Remove default menu for a clean, distraction-free literary studio look
  mainWindow.setMenuBarVisibility(false);

  const appUrl = `http://127.0.0.1:${serverInfo.port}`;
  log(`createWindow: loading appUrl ${appUrl}`);

  try {
    await mainWindow.loadURL(appUrl);
    log('createWindow: loadURL completed successfully');
  } catch (err) {
    log(`createWindow: loadURL failed (${err.message}), trying localFile`);
    console.warn('[Writ Main] Could not load from server URL, falling back to local dist/index.html:', err);
    const localIndex = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(localIndex)) {
      await mainWindow.loadFile(localIndex);
      log('createWindow: loadFile completed successfully');
    }
  }

  mainWindow.show();
  mainWindow.focus();

  mainWindow.on('closed', () => {
    log('mainWindow "closed" event fired');
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-server-info', () => {
  return serverInfo;
});

ipcMain.handle('save-project', async (event, project) => {
  try {
    const projectId = project.id;
    if (!projectId) return { success: false, error: 'No project ID' };

    const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
    const backupPath = path.join(PROJECTS_DIR, `${projectId}.bak`);

    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }

    fs.writeFileSync(filePath, JSON.stringify(project, null, 2), 'utf-8');
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('load-projects', async () => {
  try {
    const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json'));
    return files.map(file => {
      try {
        return JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf-8'));
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (err) {
    return [];
  }
});

ipcMain.handle('select-directory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0] || null;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  log('app event: window-all-closed');
  if (process.platform !== 'darwin') {
    log('app event: window-all-closed -> calling app.quit()');
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
