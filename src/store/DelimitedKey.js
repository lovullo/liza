/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-unused-vars: "off" */
/**
 * Add and retrieve nested store values using string of delimited keys
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

const {Trait, Class} = require('easejs');
const Store = require('./Store');

/**
 * Add and retrieve items from (possibly) nested Stores
 *
 * This is a convenient syntax for deeply nested Stores and can greatly cut
 * down on the verbosity of promises.  This is best and least confusingly
 * described with an example:
 *
 * @example
 *   const outer     = Store.use( DelimitedKey( '.' ) )();
 *   const middle    = Store();
 *   const inner     = Store();
 *
 *   // resolves to "inner value get"
 *   inner.add( 'foo', "inner value get" )
 *       .then( () => middle.add( 'inner', inner ) )
 *       .then( () => outer.add( 'middle', middle ) )
 *       .then( () => outer.get( 'middle.inner.foo' ) );
 *
 *   // resolves to "inner value add"
 *   outer.add( 'middle.inner.foo', "inner value add" )
 *       .then( () => inner.get( 'foo' ) );
 */
module.exports = Trait('DelimitedKey')
  .implement(Store)
  .extend({
    /**
     * Key delimiter
     * @type {string}
     */
    'private _delim': '',

    /**
     * Specify key delimiter
     *
     * @param {string} delim key delimiter
     */
    __mixin(delim) {
      this._delim = '' + delim;
    },

    /**
     * Add item to (possibly) nested store under with value `value`
     *
     * The given key `key` is split on the chosen delimiter (specified at
     * the time of mixin).  All but the last element in `key` are retrieved
     * recursively as Stores; the final Store is then assigned `value` to
     * the key represented by the last value in the delimited `key`.
     *
     * @param {string} key   delimited store key
     * @param {*}      value value for key
     *
     * @return {Promise.<Store>} promise to add item to store, resolving to
     *                           self (for chaining)
     */
    'virtual abstract override public add'(key, value) {
      if (typeof key !== 'string') {
        return this.__super(key);
      }

      const parts = key.split(this._delim);
      const maxi = parts.length - 1;
      const __super = this.__super;

      return parts
        .reduce(
          (promise, part, i) =>
            promise.then(store => (i < maxi ? store.get(part) : store)),
          Promise.resolve(this)
        )
        .then(store => __super.call(this, parts[maxi], value));
    },

    /**
     * Retrieve item from (possibly) nested store
     *
     * The given key `key` is split on the chosen delimiter (specified at
     * the time of mixin).  All but the last element in `key` are retrieved
     * recursively as Stores; the final element in delimited `key` then
     * identifies they key to be retrieved from the final Store.
     *
     * @param {string} key delimited store key
     *
     * @return {Promise} promise for the key value
     */
    'virtual abstract override public get'(key) {
      if (typeof key !== 'string') {
        return this.__super(key);
      }

      const [first, ...parts] = key.split(this._delim);

      return parts.reduce(
        (promise, part) => promise.then(store => store.get(part)),
        this.__super(first)
      );
    },
  });
