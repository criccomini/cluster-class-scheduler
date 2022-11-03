class Controller {
  static addClasses(classes) {
    // Clear classes table.
    document
      .querySelector('#classes-table-body')
      .innerHTML = "";

    // Add classes to table
    classes
      .forEach(c => Controller.addClass(c));
  }

  static addClass(c) {
    document
      .querySelector('#classes-table-body')
      .innerHTML += `
        <tr>
          <td>${c.name}</td>
          <td><input type="checkbox" name="day_1" ${c.days.includes(1) ? 'checked' : ''} /></td>
          <td><input type="checkbox" name="day_2" ${c.days.includes(2) ? 'checked' : ''} /></td>
          <td><input type="checkbox" name="day_3" ${c.days.includes(3) ? 'checked' : ''} /></td>
          <td><input type="text" name="" value="${c.minStudents}" /></td>
          <td><input type="text" name="" value="${c.maxStudents}" /></td>
        </tr>
      `;
  }
}

module.exports = {
  Controller
};
