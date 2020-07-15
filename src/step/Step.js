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

var Class = require('easejs').Class,
  EventEmitter = require('../events').EventEmitter,
  // XXX: tightly coupled
  MultiSort = require('../sort/MultiSort');

/**
 * Represents a single step to be displayed in the UI
 */
module.exports = Class('Step').extend(EventEmitter, {
  /**
   * Called when quote is changed
   * @type {string}
   */
  'const EVENT_QUOTE_UPDATE': 'updateQuote',

  /**
   * Step identifier
   * @type {number}
   */
  'private _id': 0,

  /**
   * Data bucket to store the raw data for submission
   * @type {StepDataBucket}
   */
  'private _bucket': null,

  /**
   * Fields contained exclusively on the step (no linked)
   * @type {Object}
   */
  'private _exclusiveFields': {},

  /**
   * Fields that must contain a value
   * @type {Object}
   */
  'private _requiredFields': {},

  /**
   * Whether all fields on the step contain valid data
   * @type {boolean}
   */
  'private _valid': true,

  /**
   * Explanation of what made the step valid/invalid, if applicable
   *
   * This is useful for error messages
   *
   * @type {string}
   */
  'private _validCause': '',

  /**
   * Sorted group sets
   * @type {Object}
   */
  'private _sortedGroups': {},

  /**
   * Initializes step
   *
   * @param {number}      id    step identifier
   * @param {ClientQuote} quote quote to contain step data
   *
   * @return {undefined}
   */
  'public __construct': function (id, quote) {
    var _self = this;

    this._id = +id;

    // TODO: this is temporary; do not pass bucket, pass quote
    quote.visitData(function (bucket) {
      _self._bucket = bucket;
    });
  },

  /**
   * Returns the numeric step identifier
   *
   * @return Integer step identifier
   */
  'public getId': function () {
    return this._id;
  },

  /**
   * Return the bucket associated with this step
   *
   * XXX: Remove me; breaks encapsulation.
   *
   * @return {Bucket} bucket associated with step
   */
  'public getBucket': function () {
    return this._bucket;
  },

  /**
   * Set whether or not the data on the step is valid
   *
   * @param {boolean} valid whether the step contains only valid data
   *
   * @return {Step} self
   */
  'public setValid': function (valid, cause) {
    this._valid = !!valid;
    this._validCause = cause;

    return this;
  },

  /**
   * Returns whether all the elements in the step contain valid data
   *
   * @return Boolean true if all elements are valid, otherwise false
   */
  'public isValid': function (cmatch) {
    if (!cmatch) {
      throw Error('Missing cmatch data');
    }

    return this._valid && this.getNextRequired(cmatch) === null;
  },

  'public getValidCause': function () {
    return this._validCause;
  },

  /**
   * Retrieve the next required value that is empty
   *
   * Aborts on first missing required field with its name and index.
   *
   * @param {Object} cmatch cmatch data
   *
   * @return {!Array.<string, number>} first missing required field
   */
  'public getNextRequired': function (cmatch) {
    cmatch = cmatch || {};

    // check to ensure that each required field has a value in the bucket
    for (var name in this._requiredFields) {
      var data = this._bucket.getDataByName(name),
        cdata = cmatch[name];

      // a non-empty string indicates that the data is missing (absense of
      // an index has no significance)
      for (var i in data) {
        // any falsy value will be considered empty (note that !"0" ===
        // false, so this will work)
        if (!data[i] && data[i] !== 0) {
          if (!cdata || (cdata && cdata.indexes[i])) {
            return [name, i];
          }
        }
      }
    }

    // all required fields have values
    return null;
  },

  /**
   * Sets a new bucket to be used for data storage and retrieval
   *
   * @param {QuoteDataBucket} bucket new bucket
   *
   * @return {Step} self
   */
  'public updateQuote': function (quote) {
    // todo: Temporary
    var _self = this,
      bucket = null;
    quote.visitData(function (quote_bucket) {
      bucket = quote_bucket;
    });

    _self._bucket = bucket;
    _self.emit(this.__self.$('EVENT_QUOTE_UPDATE'));
    return this;
  },

  /**
   * Adds field names exclusively contained on this step (no linked)
   *
   * @param {Array.<string>} fields field names
   *
   * @return {StepUi} self
   */
  'public addExclusiveFieldNames': function (fields) {
    var i = fields.length;
    while (i--) {
      this._exclusiveFields[fields[i]] = true;
    }

    return this;
  },

  /**
   * Retrieve list of field names (no linked)
   *
   * @return {Object.<string>} field names
   */
  'public getExclusiveFieldNames': function () {
    return this._exclusiveFields;
  },

  /**
   * Set names of fields that must contain a value
   *
   * @param {Object} required required field names
   *
   * @return {StepUi} self
   */
  'public setRequiredFieldNames': function (required) {
    this._requiredFields = required;
    return this;
  },

  'public setSortedGroupSets': function (sets) {
    this._sortedGroups = sets;
    return this;
  },

  'public eachSortedGroupSet': function (c) {
    var sets = {};
    var data = [];

    for (var id in this._sortedGroups) {
      // call continuation with each sorted set containing the group ids
      c(this._processSortedGroup(this._sortedGroups[id]));
    }
  },

  'private _processSortedGroup': function (group_data) {
    var data = [];

    for (var i in group_data) {
      var cur = group_data[i],
        name = cur[0],
        fields = cur[1];

      // get data for each of the fields
      var fdata = [];
      for (var i in fields) {
        fdata.push(this._bucket.getDataByName(fields[i]));
      }

      data.push([name, fdata]);
    }

    var toint = [0, 0, 1];
    function pred(i, a, b) {
      var vala = a[1][i][0],
        valb = b[1][i][0];

      // convert to numeric if it makes sense to do so (otherwise, we may
      // be comparing them as strings, which does not quite give us the
      // ordering we desire)
      if (toint[i]) {
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
    var preds = [];
    for (var i in group_data[0][1]) {
      (function (i) {
        preds.push(function (a, b) {
          return pred(i, a, b);
        });
      })(i);
    }

    // sort the data
    var sorted = MultiSort().sort(data, preds);

    // return the group names
    var ret = [];
    for (var i in sorted) {
      // add name
      ret.push(sorted[i][0]);
    }

    return ret;
  },
});
