const { ipcRenderer } = require('electron');
const { writeFile } = require('fs');
const { Assigner } = require('./assigner.js');
const { stringify } = require('csv-stringify/sync');
const { Schedule } = require('./schedule.js');
const { Preferences } = require('./preferences.js');
const { Controller } = require('./controller.js');

document.querySelector('#open').addEventListener('click', function() {
  ipcRenderer.send('show-open-dialog');
});

document.querySelector('#save').addEventListener('click', function() {
  ipcRenderer.send('show-save-dialog');
});

ipcRenderer.on('open-dialog-paths-selected', (event, filePaths)=> {
  // Only support one file (no multi-select) right now
  Preferences.loadFromCsv(filePaths[0])
    .then(preferences => {
      global.preferences = preferences;
      global.schedule = Schedule.fromPreferences(global.preferences);
      Controller.addClasses(global.schedule.classes);
    });
});

ipcRenderer.on('save-dialog-path-selected', (event, filePath)=> {
  global.schedule = Schedule.fromHtml('#classes-table-body');
  global.assignments = new Assigner(global.schedule, global.preferences).assign();

  writeFile(
    filePath,
    stringify(global.assignments, { header: true, quoted: true }),
    {
      encoding: "utf8"
    },
    err => {
    if (err) {
      console.log(err);
    }
  });
});
