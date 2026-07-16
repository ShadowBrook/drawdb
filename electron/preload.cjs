const { contextBridge, ipcRenderer } = require('electron');

console.log('[preload] drawDB preload script loaded');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, defaultName, filters) =>
    ipcRenderer.invoke('save-file', { content, defaultName, filters }),

  openFile: (filters) =>
    ipcRenderer.invoke('open-file', { filters }),

  onMenuAction: (callback) => {
    console.log('[preload] onMenuAction registered');
    ipcRenderer.on('menu-action', (_event, action) => {
      console.log('[preload] received menu-action:', action);
      callback(action);
    });
  },

  removeMenuActionListener: () => {
    console.log('[preload] removeMenuActionListener');
    ipcRenderer.removeAllListeners('menu-action');
  },
});
