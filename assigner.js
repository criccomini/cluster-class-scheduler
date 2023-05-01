const log = require('electron-log');

class RerunClassAssignment {
  constructor(clazz) {
    this.clazz = clazz;
    this.days = clazz.days.reduce((map, idx) => (map[idx] = [], map), {});
  }

  isAssignmentAllowed(studentAssignment) {
    // Check if the student has already been assigned to a day of this class.
    for (const className of Object.values(studentAssignment)) {
      if (className == this.clazz.name) {
        return false;
      }
    }
    // Check if the student has an open day for this class.
    for (const [day, students] of Object.entries(this.days)) {
      const dayIsAvailable = students.length < this.clazz.maxStudents;
      const studentIsAvaialbe = !(`Day ${day}` in studentAssignment);
      if (dayIsAvailable && studentIsAvaialbe) {
        return true;
      }
    }
    return false;
  }

  assignStudent(studentName, studentAssignment) {
    for (const day of Object.keys(this.days)) {
      const studentDayIsAvailable = !(`Day ${day}` in studentAssignment);
      const dayHasSpace = this.days[day].length < this.clazz.maxStudents;
      if (studentDayIsAvailable && dayHasSpace) {
        // Set the student in the day.
        this.days[day].push(studentName);

        // Set the day in the student.
        studentAssignment[`Day ${day}`] = this.clazz.name;

        // Student is assigned, so stop trying.
        return;
      }
    }
  }

  unassignStudent(studentName, studentAssignment) {
    // Remove student from this class.
    for (const students of Object.values(this.days)) {
      var studentIdx = students.indexOf(studentName);
      if (studentIdx >= 0) {
        students.splice(studentIdx, 1);
      }
    }
    // Remove all assignments for the student.
    for (const day of Object.keys(studentAssignment)) {
      if (studentAssignment[day] == this.clazz.name) {
        delete studentAssignment[day];
      }
    }
  }

  hasMinimumStudents() {
    for (const students of Object.values(this.days)) {
      if (students.length < this.clazz.minStudents) {
        return false;
      }
    }
    return true;
  }

  hasMaximumStudents() {
    for (const students of Object.values(this.days)) {
      if (students.length < this.clazz.maxStudents) {
        return false;
      }
    }
    return true;
  }
}

class RegularClassAssignment {
  constructor(clazz) {
    this.clazz = clazz;
    this.students = [];
  }

  isAssignmentAllowed(studentAssignment) {
    const classIsNotFull = this.students.length < this.clazz.maxStudents;
    const studentNotBookedOnClassDays = this.clazz
      .days
      .filter(d => {
        return `Day ${d}` in studentAssignment;
      })
      .length == 0;
    return classIsNotFull && studentNotBookedOnClassDays;
  }

  assignStudent(studentName, studentAssignment) {
    this.students.push(studentName);
    this.clazz.days.forEach(d => {
      studentAssignment[`Day ${d}`] = this.clazz.name;
    });
  }

  unassignStudent(studentName, studentAssignment) {
    // Remove student from this class.
    var studentIdx = this.students.indexOf(studentName);
    if (studentIdx >= 0) {
      this.students.splice(studentIdx, 1);
    }
    // Remove all assignments for the student.
    for (const day of Object.keys(studentAssignment)) {
      if (studentAssignment[day] == this.clazz.name) {
        delete studentAssignment[day];
      }
    }
  }

  hasMinimumStudents() {
    return this.students.length >= this.clazz.minStudents;
  }

  hasMaximumStudents() {
    return this.students.length >= this.clazz.maxStudents;
  }
}

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
    // {<class name>: ClassAssignment}
    const classAssignments = Object.values(this.schedule.classes).reduce((map, c) => {
      map[c.name] = c.reruns ? new RerunClassAssignment(c) : new RegularClassAssignment(c);
      return map;
    }, {});

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
      const studentChoices = studentChoicesByClass[className];
      log.info(studentChoices);

      for (let i = 0; i < studentChoices.length && !classAssignment.hasMinimumStudents(); ++i) {
        const studentName = studentChoices[i][0];
        const studentAssignment = studentAssignments[studentName];

        log.debug(`looking at "${studentName} for "${className}"`)

        if (classAssignment.isAssignmentAllowed(studentAssignment)) {
          classAssignment.assignStudent(studentName, studentAssignment);
        }
      }
    });
  }

  #assignByChoice(classAssignments, studentAssignments) {
    log.debug('assigning by choice');
    // Assign remaining students that aren't yet fully assigned.
    Object.entries(this.preferences.preferences).forEach(([studentName, preference]) => {
      const studentAssignment = studentAssignments[studentName];
      // Try to fully assign the student. First pass, use their sorted choices. 
      // If sorted choices don't work, shuffle the choices and try again. Do
      // this until the student is fully assigned (or we've tried 999 times).
      for (let tries = 0; tries < 1000 && !this.#isFullyAssigned(studentAssignment); ++tries) {
        // Clone the student's choices so we can shuffle then if we need to.
        const shuffledChoices = [...preference.choices];
        if (tries > 0) {
          // If we weren't able to assign the student based on their choice order,
          // then shuffle their choices and try again.
          shuffledChoices.sort(() => Math.random() - 0.5);
          // Reset the student's assignments since we're trying to assign again.
          this.#clearStudent(classAssignments, studentAssignment, studentName);
        }
        for (let i = 0; i < shuffledChoices.length && !this.#isFullyAssigned(studentAssignment); ++i) {
          const className = shuffledChoices[i];
          const classAssignment = classAssignments[className];

          log.debug(`looking at "${studentName} for "${className}"`)

          if (classAssignment.isAssignmentAllowed(studentAssignment)) {
            classAssignment.assignStudent(studentName, studentAssignment);
          }
        }
      }
    });
  }

  #clearStudent(classAssignments, studentAssignment, studentName) {
    for (const className of Object.values(studentAssignment)) {
      classAssignments[className].unassignStudent(studentName, studentAssignment);
    }
  }

  #isFullyAssigned(studentAssignment) {
    return Object.keys(studentAssignment).length >= this.schedule.numDays();
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
      const studentAssignment = studentAssignments[studentName];
      for (let i = 0; i < this.classes.length && !this.#isFullyAssigned(studentAssignment); ++i) {
        const className = this.classes[i];
        const classAssignment = classAssignments[className];

        log.debug(`looking at "${studentName} for "${className}"`)

        if (classAssignment.isAssignmentAllowed(studentAssignment)) {
          classAssignment.assignStudent(studentName, studentAssignment);
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
}

module.exports = {
  Assigner
};
