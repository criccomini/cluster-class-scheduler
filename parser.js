const { readFile } = require('fs/promises');
const { parse } = require('csv-parse/sync');

async function loadCsv(csvFilePath) {
  const content = await readFile(csvFilePath);
  const records = parse(content, {
    columns: true,
    trim: true
  });
  return extendRecords(records);
}

function extendRecords(records) {
  records.forEach((record) => {
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
    console.log(record.name() + " " + record.timestamp() + " " + record.grade() + " " + record.teacher());
  });
}

module.exports = {
  loadCsv
};
