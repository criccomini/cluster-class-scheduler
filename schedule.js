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

  static fromPreferences(preferences) {
    const classes = preferences
      .classes()
      .map(c => new Class(c))
      .reduce((map, c) => (map[c.name] = c, map), {});

    return new Schedule(classes);
  }

  static fromHtml(tableBodyId) {
    const classRows = document.querySelectorAll(tableBodyId + " tr");
    const classes = Array.from(classRows).map(r => {
      const name = r.cells[0].innerHTML;
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
}

module.exports = {
  Class,
  Schedule
};
