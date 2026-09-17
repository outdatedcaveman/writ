const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getServerInfo: () => ipcRenderer.invoke('get-server-info'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  saveProjectToDisk: (project) => ipcRenderer.invoke('save-project', project),
  loadProjectsFromDisk: () => ipcRenderer.invoke('load-projects'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  writeObsidianFile: (vaultPath, filename, content) => ipcRenderer.invoke('write-obsidian-file', { vaultPath, filename, content })
});
