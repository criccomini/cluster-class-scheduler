const { readFile } = require('fs/promises');
const { parse } = require('csv-parse/sync');

async function loadCsv(csvFilePath) {
  const content = await readFile(csvFilePath);
  const records = parse(content, {
    cast: true,
    cast_date: true
  });
  console.log(records);
}

module.exports = {
  loadCsv
};