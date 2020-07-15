/**
 * Field validity monitor
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
 */

'use strict';

const Class = require('easejs').Class;
const EventEmitter = require('../events').EventEmitter;
const Failure = require('./Failure');
const Store = require('../store/Store');

/**
 * Monitor field state and emit fix/failure events
 */
module.exports = Class('ValidStateMonitor').extend(EventEmitter, {
  /**
   * Past validation failures
   * @type {Object}
   */
  'private _failures': {},

  /**
   * Mark fields as updated and detect failures and fixes
   *
   * The field data `data` should be a key-value store with an array as
   * the value for each key.  If the data are not present, then it is
   * assumed to have been left unchanged, and will not contribute to a
   * fix.  Otherwise, any field in `failures` but not in `data` will count
   * as a fix.
   *
   * `failures` should follow the same structure as `data`.  Indexes
   * should omitted from the value if they are not failures.
   *
   * The return value is a promise that is accepted once all fix checks
   * have been performed.  The `failure` event is always emitted _before_
   * the fix event.
   *
   * @param {Object} data     key-value field data
   * @param {Object} failures key-value field errors
   *
   * @return {Promise.<ValidStateMonitor>} self after fix checks
   */
  'public update'(data, failures) {
    if (!Class.isA(Store, data)) {
      throw TypeError('Bucket diff data must be a Store; given ' + data);
    }

    const fixed = this.detectFixes(data, this._failures, failures);

    return fixed.then(fixes => {
      const count_new = this.mergeFailures(this._failures, failures);

      if (this.hasFailures() && count_new > 0) {
        this.emit('failure', this._failures);
      }

      if (fixes !== null) {
        this.emit('fix', fixes);
      }

      return this.__inst;
    });
  },

  /**
   * Retrieve current validation errors
   *
   * @return {Object} key-value object where key is field name and
   *                  value is an array with each failure index and
   *                  the value that caused the failure
   */
  'public getFailures'() {
    return this._failures;
  },

  /**
   * Determine whether or not there are additional failures that must be fixed
   *
   * This runs fastest if there are failures or if there are no failures and
   * the object is entriely clean. Will clean up fixed fields as it goes,
   * speeding up future runs. Will return true on the first failure it
   * encounters, but in order to determine if there are no failures, it must
   * loop through all past failures (unless they have bene cleaned).
   *
   * Assuming a failure, this will run in *at best* O(1) time  (check first
   * field, check first field index). If it must check a few fields, it will
   * run in O(n) time, where n is the number of fields until the first
   * failure, yielding O(1) on subsequent calls assuming no changes in past
   * failures. Assuming no failures and a clean object, O(1). Worst case is
   * O(n). I'm not going to bother working out the average run time.
   *
   * Essentially---it's not that bad.
   *
   * @param {Object} past past failures cache
   *
   * @return {boolean} true if errors exist, otherwise false
   */
  'virtual public hasFailures'() {
    let past = this._failures;

    return Object.keys(past).some(field => {
      for (let i in past[field]) {
        return true;
      }

      // clean up as we go
      delete past[field];

      return false;
    });
  },

  /**
   * Merges a new set of failures into the past failures table
   *
   * This will merge each individual index of each field. Note that it is not
   * responsible for clearing failures that are no longer present.
   *
   * @param {Object} past     past failures to merge with
   * @param {Object} failures new failures
   *
   * @return {number} number of new failures
   */
  'virtual protected mergeFailures'(past, failures) {
    let count_new = 0;

    for (var name in failures) {
      past[name] = past[name] || [];

      const cur_past = past[name];

      // copy each failure into the past failures table
      for (var i in failures[name]) {
        var new_failure = failures[name][i];

        // merge with past failure if present
        cur_past[i] =
          cur_past[i] !== undefined
            ? cur_past[i].merge(new_failure)
            : new_failure;

        count_new++;
      }
    }

    return count_new;
  },

  /**
   * Detects fixes based on previous failures
   *
   * This method will also clear fixed failures from the past failures object
   * by directly modifying it (for performance reasons).
   *
   * Note that this does not entirely remove the field from the past failures
   * object; this is because the memory consumption is negligable when
   * compared with the rest of the software and it would only muddy up the
   * code (counting the number of checks vs the number of fixes). Cleanup is
   * handled by _hasFailures().
   *
   * @param {Object} past     past failures to merge with
   * @param {Object} data     validated data
   * @param {Object} failures new failures
   *
   * @return {Promise.<!Object>} fixed list of fixed indexes for each fixed field
   */
  'virtual protected detectFixes'(data, past, failures) {
    let fixed = {};

    return Promise.all(
      Object.keys(past).map(name => {
        const past_fail = past[name];
        const fail = failures[name];

        return this._checkFailureFix(name, fail, past_fail, data, fixed);
      })
    ).then(fixes => (fixes.some(fix => fix === true) ? fixed : null));
  },

  /**
   * Check past failure fixes
   *
   * @param {string} name      failing field name
   * @param {Array}  fail      failing field index/value
   * @param {Array}  past_fail past failures for field name
   * @param {Object} data      validated data
   * @param {Object} fixed     destination for fixed field data
   *
   * @return {Promise.<boolean>} whether a field was fixed
   */
  'private _checkFailureFix'(name, fail, past_fail, data, fixed) {
    // we must check each individual index because it is possible that
    // not every index was modified or fixed (we must loop through like
    // this because this is treated as a hash table, not an array)
    return Promise.all(
      past_fail.map((failure, fail_i) => {
        const causes = (failure && failure.getCauses()) || [];

        // to short-circuit checks, the promise will be _rejected_ once
        // a match is found (see catch block)
        return causes
          .reduce(
            this._checkCauseFix.bind(this, data, fail),
            Promise.resolve(true)
          )
          .then(() => false)
          .catch(result => {
            if (result instanceof Error) {
              throw result;
            }

            // looks like it has been resolved
            this._fixFailure(fixed, name, fail_i, result);

            return true;
          });
      })
    ).then(fixes => fixes.some(fix => fix === true));
  },

  /**
   * Check past failure causes
   *
   * Each past failure in `fail` will be checked against the data in
   * `diff` to determine whether it should be considered a possible
   * fix.  If so, the promise is fulfilled with the fix data.  It is the
   * responsibility of the caller to handle removing past failures.
   *
   * If the diff contains a scalar instead of an array diff, it is
   * considered to affect every index.
   *
   * @param {Object}  data   validated data
   * @param {Object}  fail   failure records
   * @param {Promise} causep cause promise to chain onto
   * @param {Field}   cause  field that caused the error
   *
   * @return {Promise} whether a field should be fixed
   */
  'private _checkCauseFix'(data, fail, causep, cause) {
    const cause_name = cause.getName();
    const cause_index = cause.getIndex();

    return causep.then(
      () =>
        new Promise((keepgoing, found) =>
          data
            .get(cause_name)
            .then(field => {
              // we want everything to be an array, but we need a sane
              // fallback if we _are_ provided with scalars
              const index_data = Array.isArray(field)
                ? field[cause_index]
                : field;

              // to be marked as fixed, there must both me no failure
              // and there must be data for this index for the field
              // in question (if the field wasn't touched, then of
              // course there's no failure!)
              if (
                (fail === undefined || !fail[cause_index]) &&
                index_data !== undefined
              ) {
                found(index_data);
                return;
              }

              // keep searching
              keepgoing(true);
            })
            .catch(e => keepgoing(true))
        )
    );
  },

  /**
   * Mark a failure as fixed
   *
   * @param {Object} fixed destination object
   * @param {string} name  fixed field name
   * @param {number} index fixed field index
   * @param {*}      value value that caused the fix
   *
   * @return {Object} `fixed` argument
   */
  'private _fixFailure'(fixed, name, index, value) {
    (fixed[name] = fixed[name] || [])[index] = value;

    // caller is expected to have ensured that this exists
    delete this._failures[name][index];

    return fixed;
  },

  /**
   * Clear specified failures, or otherwise all recorded failures
   *
   * `fields` must be a key-value map with the field name as the key and
   * an array of indexes as the value.  Any field in `fields` that has no
   * failure is ignored.
   *
   * For each specified failure, a `fix` event is emitted.  If no failures
   * are specified by `fields`, all recorded failures are marked as
   * fixed.  If a field in `fields` is not known, it is ignored.
   *
   * Normally the resulting fix object contains the values that triggered
   * the fix.  Instead, each fixed index will contain `null`.
   *
   * This process is synchronous, and only a single `fix` event is emitted
   * after all failures have been cleared.
   *
   * @param {Object} fields key-value names of fields/indexes to clear
   *
   * @return {ValidStateMonitor} self
   */
  'public clearFailures'(fields) {
    const failures = this._failures;

    let fixed = {};

    const isRequestedIndex = fields
      ? field =>
          (fields[field.getName()] || []).indexOf(field.getIndex()) !== -1
      : () => true;

    Object.keys(failures)
      .reduce(
        (all_fields, name) =>
          all_fields.concat(failures[name].map(cause => cause.getField())),
        []
      )
      .filter(isRequestedIndex)
      .forEach(field =>
        this._fixFailure(fixed, field.getName(), field.getIndex(), null)
      );

    this.emit('fix', fixed);

    return this;
  },
});
