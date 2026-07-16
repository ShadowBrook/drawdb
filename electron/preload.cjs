const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, defaultName, filters) =>
    ipcRenderer.invoke('save-file', { content, defaultName, filters }),

  openFile: (filters) =>
    ipcRenderer.invoke('open-file', { filters }),

  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (_event, action) => callback(action));
  },

  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },

  setLanguage: (lang) => {
    ipcRenderer.send('set-language', lang);
  },
});
