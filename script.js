const { dialog, ipcRenderer } = require('electron');
const { assign } = require('./assigner.js');
const { Schedule } = require('./schedule.js');
const { Preferences } = require('./preferences.js');
const { Controller } = require('./controller.js');

document.querySelector('#open').addEventListener('click', function() {
  ipcRenderer.send('show-open-dialog');
});

ipcRenderer.on('open-dialog-paths-selected', (event, filePaths)=> {
  // Only support one file (no multi-select) right now
  Preferences.loadFromCsv(filePaths[0])
    .then(preferences => {
      const schedule = Schedule.fromPreferences(preferences);
      Controller.addClasses(schedule.classes);
    });
});
