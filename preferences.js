const { readFile } = require('fs/promises');
const { parse } = require('csv-parse/sync');

class Preference {
  constructor(name, choices, absents, grade, teacher, timestamp) {
    this.name = name;
    this.choices = choices;
    this.absents = absents;
    this.grade = grade;
    this.teacher = teacher;
    this.timestamp = timestamp;
  }
}

class Preferences {
  constructor(preferences) {
    this.preferences = preferences;
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
    const preferences = parse(content, {
      columns: true,
      trim: true
    }).map(r => {
      const [ grade, teacher ] = r['Your Grade/Teacher'].split(' - ');
      const classes = Array.from(Array(99).keys())
        // Try the first 99 choices
        .map(i => r[`Class choice #${i}`])
        // No one picks 99 choices, so we're going to have nulls for some
        // choices. Get rid of these nulls.
        .filter(c => !!c);
      // TODO need to get these values set as day 1, day 2, etc in the spreadsheet
      const absents = r['If you know you will be absent on a Cluster Class day, please select the day(s) you will be absent'];
      return new Preference(
        r['Your First and Last Name'],
        classes,
        absents,
        grade,
        teacher,
        r['Timestamp']
      );
    }).reduce((map, p) => (map[p.name] = p, map), {});
    return new Preferences(preferences);
  }
}

module.exports = {
  Preferences
};
