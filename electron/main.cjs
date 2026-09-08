const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer, DATA_DIR, PROJECTS_DIR, TRASH_DIR } = require('./server.cjs');

let mainWindow = null;
let serverInfo = null;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

async function createWindow() {
  // Start embedded server first
  try {
    serverInfo = await startServer(4983);
  } catch (err) {
    console.error('Error starting embedded server:', err);
    serverInfo = { port: 4983, lanIp: '127.0.0.1', token: '' };
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#080808',
    title: 'Writ — Literary Studio',
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // Remove default menu for a clean, distraction-free literary studio look
  mainWindow.setMenuBarVisibility(false);

  const appUrl = `http://localhost:${serverInfo.port}`;
  console.log(`[Writ Main] Loading UI from: ${appUrl}`);

  await mainWindow.loadURL(appUrl);

  mainWindow.on('closed', () => {
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
