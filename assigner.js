const log = require('electron-log');

class Assigner {
  constructor(schedule, preferences) {
    this.classes = Object.keys(schedule.classes);
    this.students = Object.keys(preferences.preferences);
    this.schedule = schedule;
    this.preferences = preferences;
  }

  assign() {
    let [classAssignments, studentAssignments] = this.#assignByPopularity();
    while (!this.#isFullyScheduled(studentAssignments)) {
      [classAssignments, studentAssignments] = this.#assignByPopularity();
    }
    log.info(classAssignments);
    log.info(studentAssignments);
    return Object.entries(studentAssignments).map(([studentName, days]) => {
      return Object.assign({'Name': studentName}, days)
    });
  }

  #assignByPopularity() {
    // {<student name>: {'Day 1': <class name>, 'Day 2': <class name>, ...}}
    const studentAssignments = this.students.reduce((map, name) => (map[name] = {}, map), {});
    // {<class name>: [<student 1 name>, <student 2 name>, ...]}
    const classAssignments = this.classes.reduce((map, name) => (map[name] = [], map), {});

    this.#assignMinimumsByChoice(classAssignments, studentAssignments);
    this.#assignByChoice(classAssignments, studentAssignments);
    this.#assignRemaining(classAssignments, studentAssignments);

    return [classAssignments, studentAssignments];
  }

  #assignMinimumsByChoice(classAssignments, studentAssignments) {
    log.debug('assigning minimums by choice');
    // [<class name>, <class name>, ...]
    const classesLeastToMostChoices = this.#classesByPopularity();
    // {<class name>: [[<student name>, <choice index>], [<student name>, <choice index>], ...]}
    const studentChoicesByClass = this.#studentChoicesByClass();

    // Assign minimums to make sure every class can be run.
    classesLeastToMostChoices.forEach(className => {
      const classAssignment = classAssignments[className];
      const clazz = this.schedule.classes[className];
      const studentChoices = studentChoicesByClass[className];

      for (let i = 0; classAssignments[className].length < clazz.minStudents; ++i) {
        const studentName = studentChoices[i][0];
        const studentAssignment = studentAssignments[studentName];

        log.debug(`looking at "${studentName} for "${className}"`)

        if (this.#isAssignmentAllowed(clazz, classAssignment, studentAssignment)) {
          // Assign the student to the class.
          classAssignments[className].push(studentName);
          // Assign the class to the student for each day that it's held.
          clazz.days.forEach(d => {
            studentAssignments[studentName][`Day ${d}`] = clazz.name;
          });
        }
      }
    });
  }

  #assignByChoice(classAssignments, studentAssignments) {
    log.debug('assigning by choice');
    // Assign remaining students that aren't yet fully assigned.
    Object.entries(this.preferences.preferences).forEach(([studentName, preference]) => {
      // Try to fully assign the student. First pass, use their sorted choices. 
      // If sorted choices don't work, shuffle the choices and try again. Do
      // this until the student is fully assigned (or we've tried 999 times).
      for (let tries = 0; tries < 1000 && !this.#isFullyAssigned(studentAssignments, studentName); ++tries) {
        // Clone the student's choices so we can shuffle then if we need to.
        const shuffledChoices = [...preference.choices];
        if (tries > 0) {
          // If we weren't able to assign the student based on their choice order,
          // then shuffle their choices and try again.
          shuffledChoices.sort(() => Math.random() - 0.5);
          // Reset the student's assignments since we're trying to assign again.
          this.#clearStudent(classAssignments, studentAssignments, studentName);
        }
        for (let i = 0; i < shuffledChoices.length && !this.#isFullyAssigned(studentAssignments, studentName); ++i) {
          const studentAssignment = studentAssignments[studentName];
          const className = shuffledChoices[i];
          const classAssignment = classAssignments[className];
          const clazz = this.schedule.classes[className];

          log.debug(`looking at "${studentName} for "${className}"`)

          if (this.#isAssignmentAllowed(clazz, classAssignment, studentAssignment)) {
            // Assign the student to the class.
            classAssignments[className].push(studentName);
            // Assign the class to the student for each day that it's held.
            clazz.days.forEach(d => {
              studentAssignments[studentName][`Day ${d}`] = clazz.name;
            });
          }
        }
      }
    });
  }

  #clearStudent(classAssignments, studentAssignments, studentName) {
    for (const className of Object.values(studentAssignments[studentName])) {
      var index = classAssignments[className].indexOf(studentName);
      classAssignments[className].splice(index, 1);
    }
    studentAssignments[studentName] = {}
  }

  #isFullyAssigned(studentAssignments, studentName) {
    return Object.keys(studentAssignments[studentName]).length >= this.schedule.numDays();
  }

  #isFullyScheduled(studentAssignments) {
    for (const studentName of Object.keys(this.preferences.preferences)) {
      if (!this.#isFullyAssigned(studentAssignments, studentName)) {
        return false;
      }
    }
    return true;
  }

  #assignRemaining(classAssignments, studentAssignments) {
    log.debug('assigning remaining');
    // Assign remaining students that aren't yet fully assigned.
    Object.entries(this.preferences.preferences).forEach(([studentName, preference]) => {
      for (let i = 0; i < this.classes.length && !this.#isFullyAssigned(studentAssignments, studentName); ++i) {
        const studentAssignment = studentAssignments[studentName];
        const className = this.classes[i];
        const classAssignment = classAssignments[className];
        const clazz = this.schedule.classes[className];

        log.debug(`looking at "${studentName} for "${className}"`)

        if (this.#isAssignmentAllowed(clazz, classAssignment, preference, studentAssignment)) {
          // Assign the student to the class.
          classAssignments[className].push(studentName);
          // Assign the class to the student for each day that it's held.
          clazz.days.forEach(d => {
            studentAssignments[studentName][`Day ${d}`] = clazz.name;
          });
        }
      }
    });
  }

  #classesByPopularity() {
    const popularityCount = Object.values(this.preferences.preferences)
      .flatMap(p => p.choices)
      .reduce((classCounts, className) => {
        classCounts[className] = (classCounts[className] || 0) + 1;
        return classCounts;
      }, {});
    return [...this.classes]
      .sort((c1, c2) => popularityCount[c1] - popularityCount[c2]);
  }

  #studentChoicesByClass() {
    const studentChoicesByClass = this.classes.reduce((map, name) => (map[name] = [], map), {});

    // Create a map from class name to an array of [<student name>, <choice number>]
    Object.values(this.preferences.preferences).forEach(p => {
      p.choices.forEach((className, idx) => {
        studentChoicesByClass[className].push([p.name, idx]);
      });
    })

    // Sort the choice arrays from first choice to last choice.
    Object.values(studentChoicesByClass).forEach(choiceArray => {
      choiceArray.sort((c1, c2) => {
        return c1[1] - c2[1];
      });
    });

    return studentChoicesByClass;
  }

  #isAssignmentAllowed(clazz, classAssignment, studentAssignment) {
    const classIsNotFull = classAssignment.length < clazz.maxStudents;
    const studentNotBookedOnClassDays = clazz
      .days
      .filter(d => {
        return `Day ${d}` in studentAssignment;
      })
      .length == 0;
    return classIsNotFull && studentNotBookedOnClassDays;
  }
}

module.exports = {
  Assigner
};
