const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFile: () => ipcRenderer.invoke('select-file'),
    saveFile: (data) => ipcRenderer.invoke('save-file', data),
    saveFileAs: (content) => ipcRenderer.invoke('save-file-as', content),
    loadDatabase: () => ipcRenderer.invoke('load-database'),
    getCachedDatabase: () => ipcRenderer.invoke('get-cached-database'),
});
