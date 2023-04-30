const { readFile } = require('fs/promises');
const { parse } = require('csv-parse/sync');
const { Preferences } = require("./preferences");

class Class {
  constructor(name, days=[1, 2, 3], minStudents=6, maxStudents=30) {
    this.name = name;
    this.days = days;
    this.minStudents = minStudents;
    this.maxStudents = maxStudents;
  }
}

class Schedule {
  constructor(classes) {
    this.classes = classes;
  }

  numDays() {
    // TODO hard coded days right now
    return 3;
  }

  toSettingsArray() {
    return Object.values(this.classes).map(c => {
      // TODO hard coded days right now
      return Object.assign({
        "Class Name": c.name,
        "Day 1": c.days.includes(1),
        "Day 2": c.days.includes(2),
        "Day 3": c.days.includes(3),
        "Minimum Students": c.minStudents,
        "Maximum Students": c.maxStudents
      })
    });
  }

  static fromPreferences(preferences) {
    // Put the choices into a set so we get unique class names.
    const classes = Array.from(new Set(
      Object.values(preferences.preferences)
        .flatMap(c => c.choices)
    )).map(name => new Class(name));
    return new Schedule(classes);
  }

  static fromSettings(settings) {
    return new Schedule(settings.classes);
  }

  static fromHtml(tableBodyId) {
    const classRows = document.querySelectorAll(tableBodyId + " tr");
    const classes = Array.from(classRows).map(r => {
      const name = this.#decodeHtml(r.cells[0].innerHTML);
      const minStudents = parseInt(r.cells[4].children[0].value);
      const maxStudents = parseInt(r.cells[5].children[0].value);
      const days = [
        r.cells[1].children[0].checked ? 1 : 0,
        r.cells[2].children[0].checked ? 2 : 0,
        r.cells[3].children[0].checked ? 3 : 0
      ].filter(d => d != 0);
      return new Class(
        name,
        days,
        minStudents,
        maxStudents
      );
    }).reduce((map, c) => (map[c.name] = c, map), {});
    return new Schedule(classes);
  }

  static async fromCsv(filePath) {
    const content = await readFile(filePath);
    const classes = parse(content, {
      columns: true,
      trim: true
    }).map(r => {
      const days = Array.from(Array(99).keys())
        // Try the first 99 choices
        .map(i => r[`Day ${i}`] == "1" ? i : null)
        // No class has 99 days, so we're going to have nulls for some
        // choices. Get rid of these nulls.
        .filter(d => !!d)
        .map(d => parseInt(d));
      return new Class(
        r['Class Name'],
        days,
        parseInt(r['Minimum Students']),
        parseInt(r['Maximum Students'])
      );
    }).reduce((map, p) => (map[p.name] = p, map), {});
    return new Schedule(classes);
  }

  static #decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }
}

module.exports = {
  Class,
  Schedule
};
