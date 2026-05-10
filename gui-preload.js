const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ocrGui', {
  pickInputPdf: () => ipcRenderer.invoke('pick-input-pdf'),
  startOcr: (payload) => ipcRenderer.invoke('start-ocr', payload),
  cancelOcr: () => ipcRenderer.invoke('cancel-ocr'),
  onProgress: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on('ocr-progress', listener);
    return () => ipcRenderer.removeListener('ocr-progress', listener);
  },
});
