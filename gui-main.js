const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { runOcr } = require('./ocr');

let mainWindow;
let ocrAbortController = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 760,
    height: 640,
    webPreferences: {
      preload: path.join(__dirname, 'gui-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'gui', 'index.html'));
}

app.whenReady().then(() => {
  ipcMain.handle('pick-input-pdf', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('start-ocr', async (_event, payload) => {
    const { input, outputPrefix, workers, keep } = payload;

    ocrAbortController = new AbortController();

    try {
      return await runOcr({
        input,
        outputPrefix,
        workers,
        keep,
        signal: ocrAbortController.signal,
        onProgress: (progressEvent) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('ocr-progress', progressEvent);
          }
        },
      });
    } finally {
      ocrAbortController = null;
    }
  });

  ipcMain.handle('cancel-ocr', async () => {
    if (ocrAbortController) {
      ocrAbortController.abort();
      ocrAbortController = null;
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
