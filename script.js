const { dialog, ipcRenderer } = require('electron');

document.querySelector('#open').addEventListener('click', function() {
  console.log("!!!");
  ipcRenderer.send('show-open-dialog');
});

ipcRenderer.on('open-dialog-paths-selected', (event, arg)=> {
  alert('user selected: ' + arg);
});
