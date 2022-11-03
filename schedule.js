class Class {
  constructor(name, days, minStudents=6, maxStudents=30) {
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
}

module.exports = {
  Class,
  Schedule
};
