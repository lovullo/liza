/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-undef: "off" */
/**
 * Represents the result of performing a standard ("dumb") diff on bucket data
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
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
  BucketDiffContext = require('./BucketDiffContext');
BucketDiffResult = require('./BucketDiffResult');

/**
 * Result of performing a standard ("dumb") diff on bucket data
 *
 * This class handles the heavy lifting with regards to requesting
 * information about a diff---the actual diff algorithm need only provide a
 * list of the changes, which an instance of this class may either return
 * directly or retrieve the field data from the provided context.
 */
module.exports = Class('StdBucketDiffResult')
  .implement(BucketDiffResult)
  .extend({
    /**
     * Context used to produce the diff
     * @type {BucketDiffContext}
     */
    'private _context': null,

    /**
     * List of flags describing field changes
     * @type {Object}
     */
    'private _changes': null,

    __construct: function (context, changes) {
      if (!Class.isA(BucketDiffContext, context)) {
        throw TypeError('Expected BucketDiffContext; received ' + context);
      }

      this._context = context;
      this._changes = changes;
    },

    /**
     * Describes what fields have changed using boolean flags; does not include
     * unchanged fields
     *
     * As an example:
     *   { field: [ false, true, false ] }
     *
     * @return {Object} hash of arrays of boolean flags representing changes
     */
    'public describeChanged': function () {
      return this._changes;
    },

    /**
     * Describes changes in values by listing either undefined if no change or
     * an array containing, respectively, the current and previous values for
     * each index
     *
     * As an example:
     *   { field: [ undefined, [ 'current', 'prev' ], undefined ] }
     *
     * @return {Object} value changes
     */
    'public describeChangedValues': function () {
      var ret = {};

      for (var field in this._changes) {
        var change = this._changes[field],
          i = change.length,
          values = this._context.getFieldValues(field);

        ret[field] = [];
        while (i--) {
          if (change[i] !== true) {
            ret[field][i] = undefined;
            continue;
          }

          // return both the current and previous values respectively
          ret[field][i] = [values[0][i], values[1][i]];
        }
      }

      return ret;
    },
  });
