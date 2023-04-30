const { ipcRenderer } = require('electron');
const { writeFile } = require('fs');
const { Assigner } = require('./assigner.js');
const { stringify } = require('csv-stringify/sync');
const { Schedule } = require('./schedule.js');
const { Preferences } = require('./preferences.js');
const { Controller } = require('./controller.js');

document.querySelector('#open-preferences').addEventListener('click', function() {
  ipcRenderer.send('show-open-preferences-dialog');
});

document.querySelector('#save-assignments').addEventListener('click', function() {
  ipcRenderer.send('show-save-assignments-dialog');
});

document.querySelector('#open-settings').addEventListener('click', function() {
  ipcRenderer.send('show-open-settings-dialog');
});

document.querySelector('#save-settings').addEventListener('click', function() {
  ipcRenderer.send('show-save-settings-dialog');
});

ipcRenderer.on('open-dialog-preferences-paths-selected', (event, filePaths)=> {
  // Only support one file (no multi-select) right now
  Preferences.loadFromCsv(filePaths[0])
    .then(preferences => {
      global.preferences = preferences;
      global.schedule = Schedule.fromPreferences(global.preferences);
      Controller.addClasses(global.schedule.classes);
    });
});

ipcRenderer.on('save-dialog-assignments-path-selected', (event, filePath)=> {
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

ipcRenderer.on('open-dialog-settings-paths-selected', (event, filePaths)=> {
  // Only support one file (no multi-select) right now
  Schedule.fromCsv(filePaths[0])
    .then(schedule => {
      global.schedule = schedule;
      Controller.addClasses(global.schedule.classes);
    });
});

ipcRenderer.on('save-dialog-settings-path-selected', (event, filePath)=> {
  global.schedule = Schedule.fromHtml('#classes-table-body');

  writeFile(
    filePath,
    stringify(global.schedule.toSettingsArray(), { header: true, quoted: true }),
    {
      encoding: "utf8"
    },
    err => {
    if (err) {
      console.log(err);
    }
  });
});
