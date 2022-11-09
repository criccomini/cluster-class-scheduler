class Assigner {
  constructor(schedule, preferences) {
    this.classes = Object.keys(schedule.classes);
    this.students = Object.keys(preferences.preferences);
    this.schedule = schedule;
    this.preferences = preferences;
  }

  assign() {
    const randomAssignments = this.#assignRandomly();
    console.log(randomAssignments);

    return [
      {
        "Name": "Emily Kwok",
        "Day 1": "How to Weave A Yarn Mandala",
        "Day 2": "How to Weave A Yarn Mandala",
        "Day 3": "How to Weave A Yarn Mandala"
      }
    ];
  }

  #assignRandomly() {
    // Create a queue of students to work off of.
    const studentQueue = [...this.students];
    // {<student name>: {'day_1': <class name>, 'day_2': <class name>, ...}}
    const studentAssignments = this.students.reduce((map, name) => (map[name] = {}, map), {});
    // {<class name>: [<student 1 name>, <student 2 name>, ...]}
    const classAssignments = this.classes.reduce((map, name) => (map[name] = [], map), {});

    // Keep trying to assign while there are still students in the queue.
    while (studentQueue.length > 0) {
      // Grab a student.
      const studentName = studentQueue.shift();
      const preference = this.preferences.preferences[studentName];
      const studentAssignment = studentAssignments[studentName];

      // Find a random class
      const randomClassIdx = Math.floor(Math.random() * this.classes.length);
      const className = this.classes[randomClassIdx];
      const classAssignment = classAssignments[className];
      const clazz = this.schedule.classes[className];

      if (this.#isAssignmentAllowed(clazz, classAssignment, preference, studentAssignment)) {
        // BEGIN Critical section in a multi-threaded environment.
        // Assign the student to the class.
        classAssignments[className].push(studentName);
        // Assign the class to the student for each day that it's held.
        clazz.days.forEach(d => {
          studentAssignments[studentName][`day_${d}`] = clazz.name;
        });
        // END Critical section in a multi-threaded environment.
      }

      if (Object.keys(studentAssignments[studentName]).length < schedule.numDays()) {
        // If we haven't scheduled every day, put the student back into the
        // end of the queue.
        studentQueue.push(studentName);
      }
    }

    return classAssignments;
  }

  #isAssignmentAllowed(clazz, classAssignment, preference, studentAssignment) {
    const classIsNotFull = classAssignment.length < clazz.maxStudents;
    const studentIsNotFullyBooked = Object.keys(studentAssignment).length < this.schedule.numDays() - preference.absents.length;
    //const studentAttendingAllClassDays = clazz.days.filter(d => preference.absents.includes(d)).length == 0;

    const studentNotBookedOnClassDays = clazz
      .days
      .filter(d => {
        return `day_${d}` in studentAssignment;
      })
      .length == 0;

    console.log(preference.name);
    console.log(studentNotBookedOnClassDays);

    return classIsNotFull && studentIsNotFullyBooked && studentNotBookedOnClassDays;
  }
}

module.exports = {
  Assigner
};
