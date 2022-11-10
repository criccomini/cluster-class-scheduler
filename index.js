const { app, BrowserWindow, dialog, ipcMain } = require('electron');

// Import is required in order to enable it for renderer process.
const log = require('electron-log');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    // https://stackoverflow.com/a/55908510
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  win.loadFile('index.html');
};

app.on('window-all-closed', () => {
  // https://www.electronjs.org/docs/latest/tutorial/quick-start#manage-your-windows-lifecycle
  if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
  createWindow();

  // https://www.electronjs.org/docs/latest/tutorial/quick-start#open-a-window-if-none-are-open-macos
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });
});

ipcMain.on('show-open-dialog', (event, arg) => {
  dialog.showOpenDialog({
    filters: [
      { name: 'csv', extensions: ['csv'] }
    ],
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled) {
      event.sender.send('open-dialog-paths-selected', result.filePaths);
    }
  }).catch(err => {
    console.log(err);
  });
});

ipcMain.on('show-save-dialog', (event, arg) => {
  dialog.showSaveDialog({
    filters: [
      { name: 'csv', extensions: ['csv'] }
    ]
  }).then(result => {
    if (!result.canceled) {
      event.sender.send('save-dialog-path-selected', result.filePath);
    }
  }).catch(err => {
    console.log(err);
  });
});
