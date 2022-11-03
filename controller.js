class Controller {
  static addClasses(classes) {
    // Clear classes table.
    document
      .querySelector('#classes-table-body')
      .innerHTML = "";

    // Add classes to table
    [...classes]
      .sort((c1, c2) => c1.name.localeCompare(c2.name, undefined, { sensitivity: 'base' }))
      .forEach(c => Controller.addClass(c));
  }

  static addClass(c) {
    document
      .querySelector('#classes-table-body')
      .innerHTML += `
        <tr>
          <td>${c.name}</td>
          <td><input type="checkbox" name="${c.name}[day_1]" ${c.days.includes(2) ? 'checked' : ''} /></td>
          <td><input type="checkbox" name="${c.name}[day_2]" ${c.days.includes(1) ? 'checked' : ''} /></td>
          <td><input type="checkbox" name="${c.name}[day_3]" ${c.days.includes(3) ? 'checked' : ''} /></td>
          <td><input type="text" name="${c.name}[min]" size="4" value="${c.minStudents}" /></td>
          <td><input type="text" name="${c.name}[max]" size="4" value="${c.maxStudents}" /></td>
        </tr>
      `;
  }
}

module.exports = {
  Controller
};
