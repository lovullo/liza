/* TODO auto-generated eslint ignore, please fix! */
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
 *
 *  A simple recursive sorter with support for multiple criteria
 *
 *  For simplicity's sake, this simply uses JavaScript's built-in sort()
 *  method using the supplied predicates. It then iterates through the sorted
 *  result and, using the supplied predicates, determines how the results
 *  should be grouped for sub-sorting. Because of this extra iteration, this
 *  isn't a very efficient algorithm, but it doesn't need to be for our
 *  purposes.
 *
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

declare type compareFn = (a: any, b: any) => number;

export type MultiSort = (_data: any[], _preds: compareFn[]) => any[];

/**
 * Recursively sorts the given data using the provided predicates
 *
 * The predicate used depends on the depth of the sort. Results will be
 * grouped according to similarity and recursively sorted until either no
 * predicates remain or until the results are so dissimilar that they cannot
 * be further sorted.
 *
 * @param data  - data to be sorted
 * @param preds - predicates for arbitrary depth
 *
 * @return sorted data
 */
export function multiSort(data: any[], preds: compareFn[]): any[] {
  // nothing can be done if we (a) don't have a length (non-array?), (b)
  // the array is empty or (c) if we have no more preds
  if (preds.length === 0 || data.length < 2) {
    return data;
  }

  const sorted = data.slice(),
    pred = preds[0],
    next_preds = preds.slice(1);

  // sort according to the current predicate
  sorted.sort(pred);

  // if we cannot do any more sub-sorting, then simply return this sorted
  // result
  if (preds.length === 1) {
    return sorted;
  }

  return multiSubSort(sorted, pred, next_preds);
}

/**
 * Recursively sorts sorted results by grouping similar elements
 */
function multiSubSort(sorted: any, pred: compareFn, next_preds: compareFn[]) {
  let i = 0;
  const len = sorted.length;

  const result = [];
  let cur = [sorted[0]];

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
      const sub = cur.length > 1 ? multiSort(cur, next_preds) : cur;

      for (const j in sub) {
        result.push(sub[j]);
      }

      cur = [];
    }

    cur.push(sorted[i]);
  }

  return result;
}
