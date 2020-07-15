/**
 * Sorting with multiple criteria
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
 *   - Dependencies need to be liberated:
 *       - BucketDataValidator.
 *   - Global references (e.g. jQuery) must be removed.
 *   - Checkbox-specific logic must be extracted.
 *   - This class is doing too much.
 * @end needsLove
 */

var Class = require('easejs').Class;

/**
 * A simple recursive sorter with support for multiple criteria
 *
 * For simplicity's sake, this simply uses JavaScript's built-in sort()
 * method using the supplied predicates. It then iterates through the sorted
 * result and, using the supplied predicates, determines how the results
 * should be grouped for sub-sorting. Because of this extra iteration, this
 * isn't a very efficient algorithm, but it doesn't need to be for our
 * purposes.
 *
 * Sorting is then performed recursively using the determined groups and the
 * next provided predicate.
 */
module.exports = Class('MultiSort', {
  /**
   * Recursively sorts the given data using the provided predicates
   *
   * The predicate used depends on the depth of the sort. Results will be
   * grouped according to similarity and recursively sorted until either no
   * predicates remain or until the results are so dissimilar that they cannot
   * be further sorted.
   *
   * @param {Array}                 data data to be sorted
   * @param {Array.<function(*,*)>} preds predicates for arbitrary depth
   *
   * @return {Array} sorted data
   */
  'public sort': function (data, preds) {
    // nothing can be done if we (a) don't have a length (non-array?), (b)
    // the array is empty or (c) if we have no more preds
    if (preds.length === 0 || data.length < 2) {
      return data;
    }

    var sorted = Array.prototype.slice.call(data),
      pred = preds[0],
      next_preds = Array.prototype.slice.call(preds, 1);

    // sort according to the current predicate
    sorted.sort(pred);

    // if we cannot do any more sub-sorting, then simply return this sorted
    // result
    if (preds.length === 1) {
      return sorted;
    }

    return this._subsort(sorted, pred, next_preds);
  },

  /**
   * Recursively sorts sorted results by grouping similar elements
   */
  'private _subsort': function (sorted, pred, next_preds) {
    var i = 0,
      len = sorted.length;

    var result = [],
      cur = [sorted[0]];

    // note that this increment is intentional---at the bottom of this loop,
    // we push the current element into the current group. Therefore, this
    // extra step (past the end of the sorted array) ensures that the last
    // element will be properly processed as part of the last group. The
    // fact that we push undefined onto cur before returning is of no
    // consequence.
    while (i++ < len) {
      // if we are at the last element in the array OR if the current
      // element is to be sorted differently than the previous, process
      // the current group of elements before continuing
      if (i === len || pred(sorted[i - 1], sorted[i]) !== 0) {
        // the element is different; sub-sort
        var sub = cur.length > 1 ? this.sort(cur, next_preds) : cur;

        for (var j in sub) {
          result.push(sub[j]);
        }

        cur = [];
      }

      cur.push(sorted[i]);
    }

    return result;
  },
});
