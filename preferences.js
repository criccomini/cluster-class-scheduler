const { readFile } = require('fs/promises');
const { parse } = require('csv-parse/sync');

class Preferences {
  constructor(records) {
    this.records = records
  }

  /**
   * Get a set of all classes. Class names are deduced from the choices
   * supplied in the records structure. If no student chooses a specific class
   * then it won't show up in the returned set.
   * 
   * @returns A set of unique class name strings
   */
  classes() {
    // Put the choices into a set so we get unique class names.
    return new Set(this.records.flatMap(record => {
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

  /**
   * Parse a preferences CSV file (usually exported from Google docs) and
   * return a Preferences object.
   * 
   * @param {string} filePath Path to a preference CSV file.
   * @returns A Preferences object representing the data in the CSV file.
   */
  static async loadFromCsv(filePath) {
    const content = await readFile(filePath);
    const records = parse(content, {
      columns: true,
      trim: true
    });
    return new Preferences(Preferences.#extendRecords(records));
  }

  /**
   * Add some helper methods to the raw record arrays parsed from a preference
   * CSV file. Adds: .choice(n), .name(), .abset(), .grade(), .teacher(), and
   * .timestamp().
   * 
   * @param {Array} records Raw preference records from a preference CSV file.
   * @returns The input record set augmented with helper methods.
   */
  static #extendRecords(records) {
    records.forEach(record => {
      record.choice = function(n) {
        // n = choice number
        // "Clay Owl"
        return this[`Class choice #${n}`];
      };
      record.name = function() {
        // Jane Gupta
        return this['Your First and Last Name'];
      };
      record.absent = function() {
        // Friday, May 6, Friday, May 13
        return this['If you know you will be absent on a Cluster Class day, please select the day(s) you will be absent'];
      };
      record.grade = function() {
        // "4th - Wai"
        return this['Your Grade/Teacher'].split(' - ')[0];
      };
      record.teacher = function() {
        // "4th - Wai"
        return this['Your Grade/Teacher'].split(' - ')[1];
      };
      record.timestamp = function() {
        // "5/3/2022 9:33:49"
        return this['Timestamp'];
      }
    });
    return records;
  }
}

module.exports = {
  Preferences
};
