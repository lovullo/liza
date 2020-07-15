/**
 * Table styling dialog
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var Class = require('easejs').Class,
  DialogDecorator = require('./DialogDecorator'),
  TableDialogData = require('./TableDialogData');

/**
 * Styles table data in a dialog
 *
 * See TableDialogData for additional comments about generalizing this in the
 * future.
 */
module.exports = Class('TableDialog').extend(DialogDecorator, {
  /**
   * Table data
   * @type {TableDialogData}
   */
  'private _data': null,

  /**
   * Whether we have rendered the table
   * @type {boolean}
   */
  'private _drawn': false,

  /**
   * Initialize dialog with table data
   *
   * The table will not be rendered until the dialog is first opened.
   *
   * @param {TableDialogData} data table data to render
   */
  'protected init': function (data) {
    if (!Class.isA(TableDialogData, data)) {
      throw TypeError('Expected TableDialogData');
    }

    this._data = data;
  },

  /**
   * Render the table before opening the dialog
   *
   * @return {Dialog} self
   */
  'override public open': function () {
    if (this._drawn) {
      return;
    }

    var _self = this,
      _super = this.__super;

    // generate table from the provided data
    this._createBody(this._data, function (body) {
      _self._createHead(_self._data, function (head) {
        _self
          .getDialog()
          .setHtml('<table class="list">' + head + body + '</table>');
      });

      _self._drawn = true;
      _super.call(_self);
    });

    return this;
  },

  /**
   * Generate thead HTML
   *
   * @param {TableDialogData} data table data to render
   * @return {string} generated HTML
   */
  'private _createHead': function (data, callback) {
    var _self = this;

    data.getColumnTitles(function (cols) {
      var head = '<thead>';

      for (var i = 0, len = cols.length; i < len; i++) {
        // escape defined on supertype
        head += '<th>' + _self.escapeHtml(cols[i]) + '</th>';
      }

      callback(head + '</thead>');
    });
  },

  /**
   * Generate tbody HTML
   *
   * @param {TableDialogData} data table data to render
   * @return {string} generated HTML
   */
  'private _createBody': function (data, callback) {
    var _self = this;

    data.getRows(function (rows) {
      var body = '<tbody>';

      for (var i = 0, len = rows.length; i < len; i++) {
        body += _self.createRow(rows[i]);
      }

      callback(body + '</tbody>');
    });
  },

  /**
   * Generate tr HTML for row of data
   *
   * @param {TableDialogData} data table data to render
   * @return {string} generated HTML
   */
  'virtual public createRow': function (row) {
    var html = '<tr>';

    for (var i = 0, len = row.length; i < len; i++) {
      html += '<td>' + row[i] + '</td>';
    }

    html += '</tr>';
    return html;
  },
});
