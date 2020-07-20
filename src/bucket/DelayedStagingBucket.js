/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Delayed writing to staging bucket
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

const {Class} = require('easejs');
const StagingBucket = require('./StagingBucket');
const DelayedRecursionError = require('./DelayedRecursionError');

/**
 * Holds changes until explicitly processed to avoid cascades
 *
 * Since each write could trigger any number of event listeners, writes
 * should be queued and done en-masse.
 *
 * TODO: Convert to Trait.
 */
module.exports = Class('DelayedStagingBucket').extend(StagingBucket, {
  /**
   * Queued data
   * @type {Object}
   */
  'private _queued': {},

  /**
   * Delay timer id
   * @type {number}
   */
  'private _timer': 0,

  /**
   * Whether #processValues is still on the stack
   * @type {boolean}
   */
  'private _processing': 0,

  'public override setValues': function (data) {
    for (var name in data) {
      if (this._queued[name] === undefined) {
        this._queued[name] = [];
      }

      // merge individual indexes
      this.merge(data[name], this._queued[name]);
    }

    this._setTimer();
    return this;
  },

  'private _setTimer': function () {
    // no need to re-set timers
    if (this._timer) {
      return;
    }

    // invoke when stack clears
    var _self = this;
    this._timer = setTimeout(() => {
      // just in case something prevented us from decrementing the
      // lock (e.g. an exception)
      this._processing = 0;

      _self.processValues();
    }, 0);
  },

  /**
   * Retrieve the data that will result after a merge
   *
   * This should be used sparingly, since if this is called before data is
   * actually merged into the bucket, then it is possible that the values will
   * change after validations are run.
   */
  'public getPendingDataByName': function (name, diff) {
    diff = diff || this._queued;

    var pending = this.getDataByName['super'].call(this, name);
    if (!(this._queued[name] || diff[name])) {
      return pending;
    }

    // merge the queued data
    this.merge(this._queued[name] || diff[name], pending, true);
    return pending;
  },

  'public override getDataByName': function (name) {
    // if enqueued data is requested, then we have no choice but to merge to
    // ensure that the data is up-to-date
    if (this._queued[name] !== undefined) {
      this.processValues();
    }

    return this.__super.call(this, name);
  },

  'public override getData': function () {
    this.processValues();
    return this.__super.call(this);
  },

  'public override each': function (c) {
    this.processValues();
    return this.__super.call(this, c);
  },

  'public override getFilledDiff': function () {
    this.processValues();
    return this.__super.call(this);
  },

  'public override hasIndex': function (name, i) {
    this.processValues();
    return this.__super.call(this, name, i);
  },

  'public processValues': function () {
    // if no timer is set, then we have no data
    if (!this._timer) {
      return this;
    }

    // since additional data may be queued as a consequence of the below
    // set, prepare for it by providing an empty queue
    this._withProcessLock(() => {
      var oldqueue = this._queued;
      this._queued = {};
      this._timer = 0;

      this.setValues['super'].call(this, oldqueue, true, true);
    });

    return this;
  },

  /**
   * Increment lock for duration of function F
   *
   * The lock is incremented before calling F and decremented after F
   * returns.  The maximum lock count is hard-coded to 5, after which an
   * exception will be thrown.  The intent of this value is to provide a
   * little bit of flexibility to hook implementations that allows for
   * some gentle recursion, but preempts hooks when it looks like things
   * may be going awry.
   *
   * @param {Function} f function to call
   *
   * @throws {DelayedRecursionError} when lock count exceeds maximum
   *
   * @return {undefined}
   */
  'private _withProcessLock'(f) {
    // protect against runaway recursion from hooks
    if (this._processing === 5) {
      // throwing the exception will halt execution of the stack if
      // uncaught, meaning _processing will never be fully
      // decremented, so clear it out
      this._processing = 0;

      throw DelayedRecursionError(
        'Recursion on DelayedStagingBucket#processValues ' +
          '(likely caused by a bucket hook)'
      );
    }

    // note that this isn't guarded with a try/catch, because we handle
    // resetting the lock in a couple other places---this is more
    // fool-proof, since catching an exception mail fail in certain
    // circumstances (e.g. when reaching a resource limit, like
    // stack/memory)
    this._processing++;
    f();
    this._processing--;
  },
});
