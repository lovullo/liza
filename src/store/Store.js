/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Generic key/value store
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

var Interface = require('easejs').Interface;

/**
 * Generic key/value store with bulk clear
 *
 * @todo There's a lot of overlap between this concept and that of the
 *   Bucket.  Maybe have the Bucket layer atop of simple Store
 *   interface as a step toward a new, simpler Bucket
 *   implementation.  This was not implemented atop of the Bucket
 *   interface because its haphazard implementation would
 *   overcomplicate this.
 */
module.exports = Interface('Store', {
  /**
   * Add item to store under `key` with value `value`
   *
   * The promise will be fulfilled with an object containing the
   * `key` and `value` added to the store; this is convenient for
   * promises.
   *
   * @param {string} key   store key
   * @param {*}      value value for key
   *
   * @return {Promise.<Store>} promise to add item to store, resolving to
   *                           self (for chaining)
   */
  'public add': ['key', 'value'],

  /**
   * Populate store with each element in object `obj`
   *
   * This is simply a convenient way to call `#add` for each element in an
   * object.  This does directly call `#add`, so overriding that method
   * will also affect this one.
   *
   * If the intent is to change the behavior of what happens when an item
   * is added to the store, override the `#add` method instead of this one
   * so that it affects _all_ adds, not just calls to this method.
   *
   * @param {Object} obj object with which to populate store
   *
   * @return {Array.<Promise.<Store>>} array of #add promises
   */
  'public populate': ['obj'],

  /**
   * Retrieve item from store under `key`
   *
   * The promise will be rejected if the key is unavailable.
   *
   * @param {string} key store key
   *
   * @return {Promise} promise for the key value
   */
  'public get': ['key'],

  /**
   * Clear all items in store
   *
   * @return {Promise<Store>} promise to clear store, resolving to self
   *                          (for chaining)
   */
  'public clear': [],

  /**
   * Fold (reduce) all stored values
   *
   * This provides a way to iterate through all stored values and
   * their keys while providing a useful functional result (folding).
   *
   * The order of folding is undefined.
   *
   * The ternary function `callback` is of the same form as
   * {@link Array#fold}: the first argument is the value of the
   * accumulator (initialized to the value of `initial`; the second
   * is the stored item; and the third is the key of that item.
   *
   * @param {function(*,*,string=)} callback folding function
   * @param {*}                     initial  initial value for accumulator
   *
   * @return {Promise} promise of a folded value (final accumulator value)
   */
  'public reduce': ['callback', 'initial'],
});
