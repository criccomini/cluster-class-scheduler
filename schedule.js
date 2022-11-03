class Schedule {
  constructor() {
  }

  /**
   * Get a set of all classes. Class names are deduced from the choices
   * supplied in the records structure. If no student chooses a specific class
   * then it won't show up in the returned set.
   * 
   * @returns A set of unique class name strings
   */
  static classes(records) {
    // Put the choices into a set so we get unique class names.
    return new Set(records.flatMap(record => {
      // Returns an array of choices for the record.
      // Array.from because keys() returns an iterator and map() doesn't work.
      return Array.from(Array(99).keys())
        // Try the first 99 choices
        .map(i => record.choice(i))
        // No one picks 99 choices, so we're going to have nulls for some
        // choices. Get rid of these nulls.
        .filter(c => !!c);
    }));
  }
}

module.exports = {
  Schedule
};
