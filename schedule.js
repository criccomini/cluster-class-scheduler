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
      .map(c => new Class(c));

    return new Schedule(classes);
  }
}

module.exports = {
  Class,
  Schedule
};
