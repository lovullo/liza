/**
 * Semaphore class
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @todo this is actually a mutex; rename?
 */

var Class = require('easejs').Class;

/**
 * Provides the ability to acquire locks and automatically queues acquisition
 * requests to be executed when the lock becomes available.
 *
 * N.B. This implementation assumes a single-threaded implementation; it must be
 * modified to avoid lock race conditions should a multi-threaded server be
 * used.
 */
module.exports = Class('Semaphore', {
  /**
   * Timestamp representing the date of the current lock, if any, per id
   * @type {Object}
   */
  'private _lock': {},

  /**
   * Queue of acquisition requsts waiting for a particular lock, per id
   * @type {Object}
   */
  'private _queue': {},

  /**
   * Attempts to acquire the lock
   *
   * If the lock is available, immediately invokes the provided continuation.
   *
   * If the lock is not available, queues the continuation to be invoked as
   * soon as the lock is freed.
   *
   * Once the lock is successfully acquired, the provided continuation is
   * invoked with a single argument to another continuation that may be
   * invoked in order to free the lock.
   *
   * @param {string|number} id lock id
   *
   * @param {function(function())} c continuation to invoke when lock is
   *                               successfully acquired
   *
   * @return {Semaphore} self
   */
  'public acquire': function (id, c) {
    var _self = this;

    this._queue[id] = this._queue[id] || [];

    // if the lock is already acquired, then we must wait for it to be
    // free'd; block and add to callback queue
    if (this._lock[id]) {
      this._queue[id].push(function () {
        // try again (should succeed)
        _self.acquire(id, c);
      });

      return;
    }

    this._lock[id] = new Date().getTime();

    // return a continuation that will free the lock (this is an alternative
    // to providing a free() method, which prevents impatient requests from
    // freeing the lock themselves)
    c(function () {
      _self._free(id, _self._lock[id]);
    });
  },

  /**
   * Attempts to free a lock
   *
   * If ts is provided, will check against the timestamp of the current lock
   * for the given id. If they do not match, then the lock will not be freed;
   * this prevents malicious or accidental frees by acquiring a lock and
   * storing the free continuation in memory to be invoked repeatedly to
   * forcefully obtain a lock.
   *
   * After the lock is freed, this method will immediately return. On the next
   * tick, the acquisition queue will then be processed.
   *
   * @param {number|string} id lock id
   * @param {number}        ts timestamp to validate against
   *
   * @return {undefined}
   */
  'private _free': function (id, ts) {
    // prevent previous lock acquisition requests from freeing future ones
    if (ts !== undefined && ts !== this._lock[id]) {
      return;
    }

    // yes, this is known to slow down v8 a little, but we need to free the
    // memory
    delete this._lock[id];

    // let the current request finish before we begin processing the next
    // lock request
    var queue = this._queue;
    process.nextTick(function () {
      // are there any queued acquisition requests? (perform this check
      // after the tick to ensure that the array is not modified between
      // our check and shift)
      if (queue[id] && queue[id].length) {
        // no, this is not a typo.
        queue[id].shift()();
        return;
      }

      delete queue[id];
    });
  },

  /**
   * Frees locks that have been acquired for longer than the given amount of
   * time
   *
   * Note that this operation is potentially unsafe; only with sufficient time
   * intervals so as to determine that a request is unlikely to ever free the
   * lock, thus avoiding a deadlock.
   *
   * This operation is synchronous.
   *
   * @param {number} maxtime maximum number of time in milliseconds
   *
   * @param {function(string|number)} c continuation to invoke with id of
   *                                    freed lock(s), if any
   *
   * @return {Semaphore} self
   */
  'public freeStale': function (maxtime, c) {
    var now = new Date().getTime();

    for (var id in this._lock) {
      if (now - this._lock[id] > maxtime) {
        // notify caller
        c && c(id);

        // free the lock
        this._free(id);
      }
    }

    return this;
  },

  'public isLocked': function (id) {
    return this._lock[id] > 0;
  },
});
