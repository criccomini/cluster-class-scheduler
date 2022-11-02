const { dialog, ipcRenderer } = require('electron');

document.querySelector('#open').addEventListener('click', function() {
  ipcRenderer.send('show-open-dialog');
});

ipcRenderer.on('open-dialog-paths-selected', (event, filePaths)=> {
  alert('user selected: ' + filePaths);
});
