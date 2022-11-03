const { dialog, ipcRenderer } = require('electron');
const { loadCsv } = require('./parser.js');
const { assign } = require('./assigner.js');

document.querySelector('#open').addEventListener('click', function() {
  ipcRenderer.send('show-open-dialog');
});

ipcRenderer.on('open-dialog-paths-selected', (event, filePaths)=> {
  // Only support one file (no multi-select) right now
  loadCsv(filePaths[0])
    .then(records => {
      console.log(assign(records));
    });
});
