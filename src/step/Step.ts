/* eslint @typescript-eslint/no-var-requires: "off" */
/**
 * Step abstraction
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
 *   - References to "quote" should be replaced with generic terminology
 *     representing a document.
 *   - Sorting logic must be extracted, and MultiSort decoupled.
 * @end needsLove
 */

import {ClientQuote} from '../client/quote/ClientQuote';
import {CmatchData} from '../client/Cmatch';
import {StagingBucket} from '../bucket/StagingBucket';
import {MultiSort} from '../sort/MultiSort';

const EventEmitter = require('events').EventEmitter;

export type ExclusiveFields = Record<string, boolean>;

/**
 * Represents a single step to be displayed in the UI
 */
export class Step extends EventEmitter {
  /**
   * Called when quote is changed
   */
  readonly EVENT_QUOTE_UPDATE: string = 'updateQuote';

  /**
   * Step identifier
   */
  private _id = 0;

  /**
   * Data bucket to store the raw data for submission
   */
  private _bucket: StagingBucket | null = null;

  /**
   * Fields contained exclusively on the step (no linked)
   */
  private _exclusiveFields: ExclusiveFields = {};

  /**
   * Fields that must contain a value
   */
  private _requiredFields: Record<string, boolean> = {};

  /**
   * Whether all fields on the step contain valid data
   */
  private _valid = true;

  /**
   * Explanation of what made the step valid/invalid, if applicable
   *
   * This is useful for error messages
   */
  private _validCause = '';

  /**
   * Sorted group sets
   */
  private _sortedGroups: Record<any, any> = {};

  /**
   * Initializes step
   *
   * @param id         - step identifier
   * @param quote      - quote to contain step data
   * @param _multisort - a sorting function
   */
  constructor(
    id: number,
    quote: ClientQuote,
    private readonly _multi_sort: MultiSort
  ) {
    super();

    this._id = +id;

    // TODO: this is temporary; do not pass bucket, pass quote
    quote.visitData((bucket: StagingBucket) => {
      this._bucket = bucket;
    });
  }

  /**
   * Returns the numeric step identifier
   *
   * @return step identifier
   */
  getId(): number {
    return this._id;
  }

  /**
   * Return the bucket associated with this step
   *
   * XXX: Remove me; breaks encapsulation.
   *
   * @return bucket associated with step
   */
  getBucket(): StagingBucket {
    return <StagingBucket>this._bucket;
  }

  /**
   * Set whether or not the data on the step is valid
   *
   * @param valid - whether the step contains only valid data
   * @param cause - Explanation of what made the step valid/invalid
   */
  setValid(valid: boolean, cause: string): this {
    this._valid = !!valid;
    this._validCause = cause;

    return this;
  }

  /**
   * Returns whether all the elements in the step contain valid data
   *
   * @param cmatch - cmatch data
   *
   * @return true if all elements are valid, otherwise false
   */
  isValid(cmatch: CmatchData): boolean {
    if (!cmatch) {
      throw Error('Missing cmatch data');
    }

    return this._valid && this.getNextRequired(cmatch) === null;
  }

  getValidCause(): string {
    return this._validCause;
  }

  /**
   * Retrieve the next required value that is empty
   *
   * Aborts on first missing required field with its name and index.
   *
   * @param cmatch - cmatch data
   *
   * @return first missing required field
   */
  getNextRequired(cmatch: CmatchData): string[] | null {
    cmatch = cmatch || {};

    // check to ensure that each required field has a value in the bucket
    for (const name in this._requiredFields) {
      const data = this._bucket?.getDataByName(name),
        cdata = cmatch[name];

      // a non-empty string indicates that the data is missing (absense of
      // an index has no significance)
      for (const i in data) {
        // any falsy value will be considered empty (note that !"0" ===
        // false, so this will work)
        if (!data[+i] && data[+i] !== 0) {
          if (!cdata || (cdata && cdata.indexes[i])) {
            return [name, i];
          }
        }
      }
    }

    // all required fields have values
    return null;
  }

  /**
   * Sets a new quote to be used for data storage and retrieval
   *
   * @param quote - new quote
   */
  updateQuote(quote: ClientQuote): this {
    quote.visitData((quote_bucket: StagingBucket) => {
      this._bucket = quote_bucket;
    });

    this.emit(this.__self.$('EVENT_QUOTE_UPDATE'));
    return this;
  }

  /**
   * Adds field names exclusively contained on this step (no linked)
   *
   * @param fields - field names
   */
  addExclusiveFieldNames(fields: string[]): this {
    let i = fields.length;
    while (i--) {
      this._exclusiveFields[fields[i]] = true;
    }

    return this;
  }

  /**
   * Retrieve list of field names (no linked)
   *
   * @return field names
   */
  getExclusiveFieldNames(): ExclusiveFields {
    return this._exclusiveFields;
  }

  /**
   * Set names of fields that must contain a value
   *
   * @param required - required field names
   */
  setRequiredFieldNames(required: Record<string, boolean>): this {
    this._requiredFields = required;
    return this;
  }

  setSortedGroupSets(sets: Record<any, any>) {
    this._sortedGroups = sets;
    return this;
  }

  eachSortedGroupSet(c: (arr: any[]) => void) {
    for (const id in this._sortedGroups) {
      // call continuation with each sorted set containing the group ids
      c(this._processSortedGroup(this._sortedGroups[id]));
    }
  }

  private _processSortedGroup(group_data: any): any[] {
    const data = [];

    for (const i in group_data) {
      const cur = group_data[i],
        name = cur[0],
        fields = cur[1];

      // get data for each of the fields
      const fdata = [];
      for (const j in fields) {
        fdata.push(this._bucket?.getDataByName(fields[j]));
      }

      data.push([name, fdata]);
    }

    const toint = [0, 0, 1];
    function pred(i: string, a: any, b: any) {
      let vala = a[1][i][0],
        valb = b[1][i][0];

      // convert to numeric if it makes sense to do so (otherwise, we may
      // be comparing them as strings, which does not quite give us the
      // ordering we desire)
      if (toint[+i]) {
        vala = +vala;
        valb = +valb;
      }

      if (vala > valb) {
        return 1;
      } else if (vala < valb) {
        return -1;
      }

      return 0;
    }

    // generate predicates
    const preds = [];
    for (const i in group_data[0][1]) {
      (function (i) {
        preds.push((a: any, b: any) => {
          return pred(i, a, b);
        });
      })(i);
    }

    // sort the data
    const sorted = this._multi_sort(data, preds);

    // return the group names
    const ret = [];
    for (const i in sorted) {
      // add name
      ret.push(sorted[i][0]);
    }

    return ret;
  }
}
