/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-undef: "off", prefer-arrow-callback: "off" */
/**
 * Group side-formatted table UI
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
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
 *
 * @needsLove
 *   - Remove reliance on jQuery.
 *   - Dependencies need to be liberated: Styler; Group.
 * @end needsLove
 */

var Class = require('easejs').Class,
  GroupUi = require('./GroupUi');

/**
 * Represents a side-formatted table group
 *
 * This class extends from the generic Group class.  It contains logic to
 * support tabbed groups, allowing for the adding and removal of tabs.
 */
module.exports = Class('SideTableGroupUi').extend(GroupUi, {
  /**
   * Percentage width of the left column
   * @type {number}
   */
  'private const WIDTH_COL_LEFT_PERCENT': 30,

  /**
   * Stores the base title for each new tab
   * @type {string}
   */
  $baseHeadColumn: null,

  /**
   * Stores the base tab content to be duplicated for tabbed groups
   * @type {jQuery}
   */
  $baseBodyColumn: null,

  /**
   * Table element
   * @type {jQuery}
   */
  $table: null,

  /**
   * Number of subcolumns within each column
   * @type {number}
   */
  subcolCount: 1,

  /**
   * Template method used to process the group content to prepare it for
   * display
   *
   * @return void
   */
  'override protected processContent': function () {
    // determine if we should lock this group down
    if (this.$content.find('.groupTable').hasClass('locked')) {
      this.group.locked(true);
    }

    this._processTable();
  },

  /**
   * This group does not support multiple indexes
   *
   * @return {boolean}
   */
  'protected override supportsMultipleIndex': function () {
    return false;
  },

  _processTable: function () {
    this.$table = this._getTable();

    // important: do this before we begin detaching things
    this._calcColumnWidths();

    // Any content that is not the side column is to be considered the first
    // data column. detach() is used to ensure events and data remain.
    this.$baseHeadColumn = this.$table
      .find('thead')
      .find('th:not( .groupTableSide )')
      .detach();
    this.$baseBodyColumn = this.$table
      .find('tbody')
      .find('td:not( .groupTableSide )')
      .detach();

    this.subcolCount = +$(this.$baseHeadColumn[0]).attr('colspan');

    // if the group is locked, there will be no adding of rows
    if (this.group.locked()) {
      this.$content.find('.addrow').remove();
    }
  },

  /**
   * Calculates column widths
   *
   * Ensures that the left column takes up a consistent amount of space and
   * that each of the remaining columns are distributed evenly across the
   * remaining width of the table.
   *
   * As a consequence of this operation, any table with N columns will be
   * perfectly aligned with any other table of N columns.
   *
   * See FS#7916 and FS#7917.
   *
   * @return {undefined}
   */
  'private _calcColumnWidths': function () {
    // the left column will take up a consistent amount of width and the
    // remainder of the width (in percent) will be allocated to the
    // remaining columns
    var left = this.__self.$('WIDTH_COL_LEFT_PERCENT'),
      remain = 100 - left,
      $cols = this.$content.find('tr:nth(1) > th'),
      count = $cols.length,
      width = Math.floor(remain / count);

    // set the widths of the left column and each of the remaining columns
    this.$content.find('tr:first > th:first').attr('width', left + '%');

    $cols.attr('width', width + '%');
  },

  _getTable: function () {
    return this.$content.find('table.groupTable');
  },

  addColumn: function () {
    var $col_head = this.$baseHeadColumn.clone(true),
      $col_body = this.$baseBodyColumn.clone(true),
      col_head = $col_head[0],
      col_body = $col_body[0],
      $thead = this.$table.find('thead'),
      $tbody = this.$table.find('tbody'),
      index = this.getCurrentIndex();

    // properly name the elements to prevent id conflicts
    this.setElementIdIndexes(col_head.getElementsByTagName('*'), index);
    this.setElementIdIndexes(col_body.getElementsByTagName('*'), index);

    // add the column headings
    $col_head.each(function (i, th) {
      var $th = $(th);

      // the first cell goes in the first header row and all others go in
      // the following row
      var $parent = null;
      if (i === 0) {
        $parent = $thead.find('tr:nth(0)');

        // add the index to the column title
        $th.find('span.colindex').text(' ' + (index + 1));
      } else {
        $parent = $thead.find('tr:nth(1)');
      }

      $parent.append($th);
    });

    // add the column body cells
    var subcol_count = this.subcolCount;
    $col_body.each(function (i, $td) {
      $tbody.find('tr:nth(' + Math.floor(i / subcol_count) + ')').append($td);
    });

    // finally, style our new elements
    this.styler.apply($col_head).apply($col_body);

    // Set field content parent for this index
    this.fieldContentParent[index] = col_body;

    if (this.getDomPerfFlag() === true) {
      this.context.addIndex(index, this.fieldContentParent[index]);
    }

    // raise event
    this.postAddRow($col_head, index).postAddRow($col_body, index);

    return this;
  },

  /**
   * Removes a column from the table
   *
   * @return {SideTableGroupUi} self
   */
  removeColumn: function () {
    // remove the last column
    var index = this.getCurrentIndex();

    // the column index needs to take into account that the first column is
    // actually the side column (which shouldn't be considered by the user)
    var col_index = index + 1,
      $subcols = this._getSubColumns(index);

    // remove the top header for this column
    this.$table.find('thead > tr:first > th:nth(' + col_index + ')').remove();

    // remove sub-columns
    this.styler.remove($subcols);
    $subcols.remove();

    return this;
  },

  _getSubColumns: function (index) {
    // calculate the positions of the sub-columns
    var start = index * this.subcolCount + 1,
      end = start + this.subcolCount;

    var selector = '';

    for (var i = start; i < end; i++) {
      if (selector) {
        selector += ',';
      }

      // add this sub-column to the selector
      selector +=
        'thead > tr:nth(1) > th:nth(' +
        (i - 1) +
        '), ' +
        'tbody > tr > td:nth-child(' +
        (i + 1) +
        ')';
    }

    return this.$table.find(selector);
  },

  'override protected addIndex': function (index) {
    // increment id before doing our own stuff
    this.__super(index);
    this.addColumn();

    return this;
  },

  'override public removeIndex': function (index) {
    // remove our stuff before decrementing our id
    this.removeColumn();
    this.__super(index);

    return this;
  },
});
