/* TODO auto-generated eslint ignore, please fix! */
/* eslint @typescript-eslint/no-inferrable-types: "off", no-undef: "off" */
/**
 * Group collapsable table UI
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
import {QuoteDataBucket} from '../../bucket/QuoteDataBucket';
import {ClientQuote} from '../../client/quote/ClientQuote';

declare type jQuery = any;

export class CollapseTableGroupUi extends GroupUi {
  /**
   * Percentage width of the left column
   */
  private readonly WIDTH_COL_LEFT_PERCENT: number = 30;

  /**
   * Base rows for each unit
   */
  private _$baseRows: jQuery = null;

  /**
   * Number of rows in the unit
   */
  private _rowCount: number = 0;

  /**
   * Flags that, when true in the bucket, will replace each individual row
   * with a single cell (used for ineligibility, for example
   */
  private _blockFlags: string[] = [];

  /**
   * Contains true/false values of each of the block flags
   */
  private _blockFlagValues: Record<string, any> = {};

  /**
   * Summary to display on unit row if block flag is set
   */
  private _blockFlagSummary: string = '';

  private _blockDisplays: jQuery = null;

  protected processContent(_quote?: ClientQuote): void {
    this._processTableRows();

    // determine if we should lock this group down
    if (this.$content.find('.groupTable').hasClass('locked')) {
      this.group.locked(true);
    }

    // if the group is locked, there will be no adding of rows
    if (this.group.locked()) {
      this.$content.find('.addrow').remove();
    }

    const $tbody = this.$content.find('tbody');

    // block flags are comma-separated (derived from the XML, which has
    // comma-separated values for consistency with the other properties)
    this._blockFlags = $tbody.attr('blockFlags').split(',');
    this._blockFlagSummary = $tbody.attr('blockFlagSummary') || '';

    this._blockDisplays = this._getBlockDisplays();
  }

  private _processTableRows(): void {
    this._$baseRows = this.$content.find('tbody > tr:not(.footer)');

    this._$baseRows.detach();

    this._calcColumnWidths();

    this._rowCount = this._$baseRows.length;
  }

  /**
   * Retrieve and detach block-mode displays for each column
   *
   * @return block-mode display elements
   */
  private _getBlockDisplays(): jQuery {
    return this.$content.find('div.block-display').detach();
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
    const left = this.WIDTH_COL_LEFT_PERCENT,
      remain = 100 - left,
      // we will calculate and apply the width to the parent columns (this
      // allows subcols to vary, which we may not want, but ensures that
      // tables of N columns will always be aligned even if they have no
      // subcolumns)
      $cols = this.$content.find('tr:nth(0) > th:not(:first)'),
      count = $cols.length,
      width = Math.floor(remain / count);

    // set the widths of the left column and each of the remaining columns
    this.$content.find('tr:first > th:first').attr('width', left + '%');

    $cols.attr('width', width + '%');
  }

  /**
   * Initializes unit toggle on click
   *
   * @param $unit - unit to initialize toggle on
   */
  private _initToggle($unit: jQuery): void {
    $unit
      .filter('tr.unit')
      // we set the CSS here because IE doesn't like :first-child
      .css('cursor', 'pointer')
      .click((e: any) => {
        const $node = $(e.target);

        $node
          .filter('.unit')
          .toggleClass('collapsed')
          .find('td:first')
          .toggleClass('collapsed');

        $node.nextUntil('.unit, .footer').toggle();
      })
      .find('td:first')
      .addClass('first');
  }

  private _getTableBody() {
    return this.$content.find('tbody');
  }

  /**
   * Determines if the block flag is set for any column and converts it to a
   * block as necessary
   *
   * This looks more complicated than it really is. Here's what we're doing:
   *  - For the unit row:
   *    - Remove all cells except the first and span first across area
   *  - For all other rows:
   *    - Remove all but the first cell
   *    - Expand first cell to fit the area occupied by all of the removed
   *      cells
   *    - Replace content with text content of the flag
   *    - Adjust width slightly so it doesn't take up too much room
   *
   * @param $unit - generated unit nodes
   */
  private _initBlocks($unit: jQuery): void {
    for (let i = 0, len = this._blockFlags.length; i < len; i++) {
      const flag = this._blockFlags[i];

      // ignore if the flag is not set
      if (this._blockFlagValues[flag] === false) {
        continue;
      }

      const $rows = $unit.filter('tr:not(.unit)'),
        $cols = $rows.find('td[columnIndex="' + i + '"]'),
        col_len = $rows.first().find('td[columnIndex="' + i + '"]').length;
      // combine cells in unit row and remove content
      $unit
        .filter('.unit')
        .find('td[columnIndex="' + i + '"]')
        .filter(':not(:first)')
        .remove()
        .end()
        .attr('colspan', col_len)
        .addClass('blockSummary')

        // TODO: this doesn't really belong here; dynamic block flag
        // summaries would be better
        .text(
          /Please wait.../.test('') ? 'Please wait...' : this._blockFlagSummary
        );

      // remove all cells associated with this unit except for the first,
      // which we will expand to fill the area previously occupied by all
      // the cells and replace with the content of the block flag (so it's
      // not really a flag; I know)
      $cols
        .filter(':not(:first)')
        .remove()
        .end()
        .addClass('block')
        .attr({
          colspan: col_len,
          rowspan: $rows.length,
        })
        .html('')
        .append(this._blockDisplays[i]);
    }
  }

  public addRow(): void {
    const $unit = this._$baseRows.clone(true),
      unit = $unit[0],
      index = this.getCurrentIndex();

    // properly name the elements to prevent id conflicts
    this.setElementIdIndexes($unit.find('*').toArray(), index);

    // Set field content parent for this index
    this.fieldContentParent[index] = unit;

    if (this.getDomPerfFlag() === true) {
      this.context.addIndex(
        <PositiveInteger>index,
        this.fieldContentParent[index]
      );
    }

    // add the index to the row title
    $unit.find('span.rowindex').text(' ' + (index + 1));

    // add to the table (before the footer, if one has been provided)
    const footer = this._getTableBody().find('tr.footer');
    if (footer.length > 0) {
      footer.before($unit);
    } else {
      this._getTableBody().append($unit);
    }

    // finally, style our new elements
    this.styler.apply($unit);

    // the unit should be hidden by default and must be toggle-able (fun
    // word)
    this._initBlocks($unit);
    this._initToggle($unit);

    // this will handle post-add processing, such as answer hooking
    this.postAddRow($unit, index);
  }

  public removeRow(): this {
    const $rows = this._getUnit(this.getCurrentIndex());

    // remove rows
    this.styler.remove($rows);
    $rows.remove();

    return this;
  }

  private _getUnit(index: number): jQuery {
    const start = this._rowCount * index;

    return this._getTableBody()
      .find('tr:nth(' + start + '):not( .footer )')
      .nextUntil('.unit, .footer')
      .andSelf();
  }

  public preEmptyBucket(bucket: QuoteDataBucket, updated: boolean) {
    // retrieve values for each of the block flags
    for (let i = 0, len = this._blockFlags.length; i < len; i++) {
      const flag = this._blockFlags[i];

      this._blockFlagValues[flag] = bucket.getDataByName(flag)[0] || false;
    }

    // remove and then re-add each index (the super method will re-add)
    // TODO: this is until we can properly get ourselves out of block mode
    let cur_index = this.getCurrentIndexCount();
    while (cur_index) {
      this.removeIndex(cur_index);
      cur_index = this.getCurrentIndexCount();
    }

    super.preEmptyBucket(bucket, updated);
    return this;
  }

  protected addIndex(index: number): this {
    // increment id before doing our own stuff
    super.addIndex(index);
    this.addRow();

    return this;
  }

  public removeIndex(index: number): this {
    this.contextRemoveIndex(index);
    // remove our stuff before decrementing our id
    this.removeRow();
    super.removeIndex(index);

    return this;
  }
}
