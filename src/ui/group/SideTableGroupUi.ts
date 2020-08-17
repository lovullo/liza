/* TODO auto-generated eslint ignore, please fix! */
/* eslint @typescript-eslint/no-inferrable-types: "off", no-var: "off", no-undef: "off", prefer-arrow-callback: "off" */
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

import {GroupUi} from './GroupUi';
import {PositiveInteger} from '../../numeric';
import {ClientQuote} from '../../client/quote/ClientQuote';

declare type jQuery = any;

/**
 * Represents a side-formatted table group
 *
 * This class extends from the generic Group class.  It contains logic to
 * support tabbed groups, allowing for the adding and removal of tabs.
 */
export class SideTableGroupUi extends GroupUi {
  /**
   * Percentage width of the left column
   */
  private readonly WIDTH_COL_LEFT_PERCENT: number = 30;

  /**
   * Stores the base title for each new tab
   */
  $baseHeadColumn: jQuery = null;

  /**
   * Stores the base tab content to be duplicated for tabbed groups
   */
  $baseBodyColumn: jQuery = null;

  /**
   * Table element
   */
  $table: jQuery = null;

  /**
   * Number of subcolumns within each column
   */
  subcolCount: number = 1;

  /**
   * Template method used to process the group content to prepare it for
   * display
   */
  protected processContent(_quote?: ClientQuote): void {
    // determine if we should lock this group down
    if (this.$content.find('.groupTable').hasClass('locked')) {
      this.group.locked(true);
    }

    this._processTable();
  }

  /**
   * This group does not support multiple indexes
   *
   * @return false
   */
  protected supportsMultipleIndex(): boolean {
    return false;
  }

  public _processTable(): void {
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

    this.subcolCount = +(<string>(
      $((this.$baseHeadColumn || [])[0])?.attr('colspan')
    ));

    // if the group is locked, there will be no adding of rows
    if (this.group.locked()) {
      this.$content.find('.addrow').remove();
    }
  }

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
   */
  private _calcColumnWidths(): void {
    // the left column will take up a consistent amount of width and the
    // remainder of the width (in percent) will be allocated to the
    // remaining columns
    var left = this.WIDTH_COL_LEFT_PERCENT,
      remain = 100 - left,
      $cols = this.$content.find('tr:nth(1) > th'),
      count = $cols.length,
      width = Math.floor(remain / count);

    // set the widths of the left column and each of the remaining columns
    this.$content.find('tr:first > th:first').attr('width', left + '%');

    $cols.attr('width', width + '%');
  }

  public _getTable(): any {
    return this.$content.find('table.groupTable');
  }

  public addColumn(): this {
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
    $col_head.each(function (i: number, th: any) {
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
    $col_body.each(function (i: number, $td: any) {
      $tbody.find('tr:nth(' + Math.floor(i / subcol_count) + ')').append($td);
    });

    // finally, style our new elements
    this.styler.apply($col_head).apply($col_body);

    // Set field content parent for this index
    this.fieldContentParent[index] = col_body;

    if (this.getDomPerfFlag() === true) {
      this.context.addIndex(
        <PositiveInteger>index,
        this.fieldContentParent[index]
      );
    }

    // raise event
    this.postAddRow($col_head, index).postAddRow($col_body, index);

    return this;
  }

  /**
   * Removes a column from the table
   */
  public removeColumn(): this {
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
  }

  public _getSubColumns(index: number): any {
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
  }

  protected addIndex(index: number): this {
    // increment id before doing our own stuff
    super.addIndex(index);
    this.addColumn();

    return this;
  }

  public removeIndex(index: number): this {
    // remove our stuff before decrementing our id
    this.removeColumn();
    super.removeIndex(index);

    return this;
  }
}
