class Assigner {
  constructor(schedule, preferences) {
    this.schedule = schedule;
    this.preferences = preferences;
  }

  assign() {
    return [
      {
        "Name": "Emily Kwok",
        "Day 1": "How to Weave A Yarn Mandala",
        "Day 2": "How to Weave A Yarn Mandala",
        "Day 3": "How to Weave A Yarn Mandala"
      }
    ];
  }

  #assignRandomly(schedule, name) {
  }

  #isAssignmentAllowed(clazz, name) {
  }
}

module.exports = {
  Assigner
};
