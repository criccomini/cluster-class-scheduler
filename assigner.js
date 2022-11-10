const log = require('electron-log');

class Assigner {
  constructor(schedule, preferences) {
    this.classes = Object.keys(schedule.classes);
    this.students = Object.keys(preferences.preferences);
    this.schedule = schedule;
    this.preferences = preferences;
  }

  assign() {
    const randomStudentAssignments = this.#assignRandomly();
    const optimizedStudentAssignments = this.#runStochasticOptimization(randomStudentAssignments);

    log.info(optimizedStudentAssignments);

    return [
      {
        "Name": "Emily Kwok",
        "Day 1": "How to Weave A Yarn Mandala",
        "Day 2": "How to Weave A Yarn Mandala",
        "Day 3": "How to Weave A Yarn Mandala"
      }
    ];
  }

  // {<student name>: {'day_1': <class name>, 'day_2': <class name>, ...}}
  #runStochasticOptimization(studentAssignments) {
    // Hack to clone studentAssignments so we don't modify the original
    const optimizedAssignments = JSON.parse(JSON.stringify(studentAssignments));

    // Do some swaps.
    for (let i = 0; i < 1000; ++i) {
      const studentAName = this.students[Math.floor(Math.random() * this.students.length)];
      const studentBName = this.students[Math.floor(Math.random() * this.students.length)];

      log.debug(`proposing swap between "${studentAName}" and "${studentBName}"`);

      const studentAPreferences = this.preferences.preferences[studentAName];
      const studentBPreferences = this.preferences.preferences[studentBName];

      log.debug(`"${studentAName}" preferences ${JSON.stringify(studentAPreferences)}`);
      log.debug(`"${studentBName}" preferences ${JSON.stringify(studentBPreferences)}`);

      const studentAAssignments = studentAssignments[studentAName];
      const studentBAssignments = studentAssignments[studentBName];

      log.debug(`"${studentAName}" assignments ${JSON.stringify(studentAAssignments)}`);
      log.debug(`"${studentBName}" assignments ${JSON.stringify(studentBAssignments)}`);

      // Score current schedules for each student.
      const currentStudentAScore = this.#scoreSchedule(studentAPreferences, studentAAssignments);
      const currentStudentBScore = this.#scoreSchedule(studentBPreferences, studentBAssignments);

      log.debug(`"${studentAName}" current score ${currentStudentAScore}`);
      log.debug(`"${studentBName}" current score ${currentStudentBScore}`);

      // Get scores for each student after swapping schedules.
      const swappedStudentAScore = this.#scoreSchedule(studentAPreferences, studentBAssignments);
      const swappedStudentBScore = this.#scoreSchedule(studentBPreferences, studentAAssignments);

      log.debug(`"${studentAName}" swapped score ${swappedStudentAScore}`);
      log.debug(`"${studentBName}" swapped score ${swappedStudentBScore}`);

      // TODO verify we aren't swapping illegally
      const studentASwapIsLegal = studentAPreferences
        .absents
        .filter(d => `day_${d}` in studentBAssignments)
        .length == 0;
      const studentBSwapIsLegal = studentBPreferences
        .absents
        .filter(d => `day_${d}` in studentAAssignments)
        .length == 0;

      log.debug(`"${studentAName}" swap is legal ${studentASwapIsLegal}`);
      log.debug(`"${studentBName}" swap is legal ${studentBSwapIsLegal}`);

      if (studentASwapIsLegal && studentBSwapIsLegal &&
          swappedStudentAScore > currentStudentAScore &&
          swappedStudentBScore > currentStudentBScore) {
        log.debug(`Swapping ${studentAName} with ${studentBName}`);

        // Then let's swap!
        const tmp = optimizedAssignments[studentAName]
        optimizedAssignments[studentAName] = optimizedAssignments[studentBName];
        optimizedAssignments[studentBName] = tmp;
      } else {
        log.debug(`Not swapping ${studentAName} with ${studentBName}`);
      }
    }

    return optimizedAssignments;
  }

  #scoreSchedule(preference, assignments) {
    return Object
      .values(assignments)
      .reduce((score, className) => {
        const numChoices = preference.choices.length;
        const idx = preference.choices.indexOf(className);
        const choiceScore = ((numChoices - idx) / numChoices);
        return idx >= 0 ? score + choiceScore : score;
      }, 0);
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

      // Find a random class.
      const className = this.#pickClass(preference);
      const classAssignment = classAssignments[className];
      const clazz = this.schedule.classes[className];

      if (this.#isAssignmentAllowed(clazz, classAssignment, preference, studentAssignment)) {
        // Assign the student to the class.
        classAssignments[className].push(studentName);
        // Assign the class to the student for each day that it's held.
        clazz.days.forEach(d => {
          studentAssignments[studentName][`day_${d}`] = clazz.name;
        });
      }

      if (Object.keys(studentAssignments[studentName]).length < schedule.numDays()) {
        // If we haven't scheduled every day, put the student back into the
        // end of the queue.
        studentQueue.push(studentName);
      }
    }

    return studentAssignments;
  }

  #pickClass(preference) {
    // Pick a class, but heavily favor classes at the top of the choice list.
    const numChoiceslusOne = preference.choices.length + 1;
    const randomZeroToOne = Math.random();
    for (let i = 0; i < numChoiceslusOne; ++i) {
      // We don't get array out of bounds here because the extra choice
      // will always result in 0 > [0-1].
      if ((numChoiceslusOne - 1 - i) / numChoiceslusOne > randomZeroToOne) {
        return preference.choices[i];
      }
    }
    return this.classes[Math.floor(Math.random() * this.classes.length)];
  }

  #isAssignmentAllowed(clazz, classAssignment, preference, studentAssignment) {
    const classIsNotFull = classAssignment.length < clazz.maxStudents;
    const studentIsNotFullyBooked = Object.keys(studentAssignment).length < this.schedule.numDays() - preference.absents.length;
    const studentNotBookedOnClassDays = clazz
      .days
      .filter(d => {
        return `day_${d}` in studentAssignment;
      })
      .length == 0;

    return classIsNotFull && studentIsNotFullyBooked && studentNotBookedOnClassDays;
  }
}

module.exports = {
  Assigner
};
