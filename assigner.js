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

    console.log(optimizedStudentAssignments);

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
    for (let i = 0; i < 100000; i++) {
      const studentAName = this.students[Math.floor(Math.random() * this.students.length)];
      const studentBName = this.students[Math.floor(Math.random() * this.students.length)];

      console.log(`proposing swap between "${studentAName}" and "${studentBName}"`);

      const studentAPreferences = this.preferences.preferences[studentAName];
      const studentBPreferences = this.preferences.preferences[studentBName];

      console.log(`"${studentAName}" preferences ${JSON.stringify(studentAPreferences)}`);
      console.log(`"${studentBName}" preferences ${JSON.stringify(studentBPreferences)}`);

      const studentAAssignments = studentAssignments[studentAName];
      const studentBAssignments = studentAssignments[studentBName];

      console.log(`"${studentAName}" assignments ${JSON.stringify(studentAAssignments)}`);
      console.log(`"${studentBName}" assignments ${JSON.stringify(studentBAssignments)}`);

      // Score current schedules for each student.
      const currentStudentAScore = this.#scoreSchedule(studentAPreferences, studentAAssignments);
      const currentStudentBScore = this.#scoreSchedule(studentBPreferences, studentBAssignments);

      console.log(`"${studentAName}" current score ${currentStudentAScore}`);
      console.log(`"${studentBName}" current score ${currentStudentBScore}`);

      // Get scores for each student after swapping schedules.
      const swappedStudentAScore = this.#scoreSchedule(studentAPreferences, studentBAssignments);
      const swappedStudentBScore = this.#scoreSchedule(studentBPreferences, studentAAssignments);

      console.log(`"${studentAName}" swapped score ${swappedStudentAScore}`);
      console.log(`"${studentBName}" swapped score ${swappedStudentBScore}`);

      // TODO verify we aren't swapping illegally
      const studentASwapIsLegal = studentAPreferences
        .absents
        .filter(d => `day_${d}` in studentBAssignments)
        .length == 0;
      const studentBSwapIsLegal = studentBPreferences
        .absents
        .filter(d => `day_${d}` in studentAAssignments)
        .length == 0;

      console.log(`"${studentAName}" swap is legal ${studentASwapIsLegal}`);
      console.log(`"${studentBName}" swap is legal ${studentBSwapIsLegal}`);

      if (studentASwapIsLegal && studentBSwapIsLegal &&
          swappedStudentAScore + swappedStudentBScore >
          currentStudentAScore + currentStudentBScore) {
        console.log(`Swapping ${studentAName} with ${studentBName}`);

        // Then let's swap!
        const tmp = optimizedAssignments[studentAName]
        optimizedAssignments[studentAName] = optimizedAssignments[studentBName];
        optimizedAssignments[studentBName] = tmp;
      } else {
        console.log(`Not swapping ${studentAName} with ${studentBName}`);
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
        return idx > 0 ? score + choiceScore : score;
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
      const randomClassIdx = Math.floor(Math.random() * this.classes.length);
      const className = this.classes[randomClassIdx];
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
