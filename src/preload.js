const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSnippets: () => ipcRenderer.invoke('get-snippets'),
  saveSnippet: (snippet) => ipcRenderer.invoke('save-snippet', snippet),
  deleteSnippet: (id) => ipcRenderer.invoke('delete-snippet', id)
});