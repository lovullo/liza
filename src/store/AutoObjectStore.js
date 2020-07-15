/**
 * Convert objects to Stores upon retrieval
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
 * Convert objects into sub-stores containing its key/value pairs
 *
 * When retrieving a value that is an object, it will first be converted
 * into a Store and populated with the key/value pairs of that
 * object.  Non-object values will remain untouched.
 *
 * This trait expects a constructor function to instantiate a new
 * Store.  Providing the same constructor as was used to instantiate the
 * current object will allow for an object to be recursively converted into
 * nested Stores.
 *
 * Sub-stores are cached until the value of the key is references
 * changes, after which point another request to `#get` will instantiate a
 * _new_ store.  The previous store will not be modified to reflect the new
 * value.
 *
 * @example
 *   store.get( 'foo' );         // new Store      (1)
 *   store.get( 'foo' );         // existing Store (1)
 *   store.add( 'foo', {} );
 *   store.get( 'foo' );         // new Store      (2)
 *   store.add( 'foo', "bar" );
 *   store.get( 'foo' );         // "bar"
 */
module.exports = Trait('AutoObjectStore')
  .implement(Store)
  .extend({
    /**
     * Constructor for object sub-stores
     * @type {function(Object):Store}
     */
    'private _ctor': null,

    /**
     * Store cache
     * @type {Object.<Store>}
     */
    'private _stores': {},

    /**
     * Initialize with Store constructor
     *
     * `ctor` will be used to instantiate Stores as needed.
     *
     * @param {function():Store} ctor Store constructor
     */
    __mixin(ctor) {
      this._ctor = ctor;
    },

    /**
     * Add item to store under `key` with value `value`
     *
     * Any cached store for `key` will be cleared so that future `#get`
     * requests return up-to-date data.
     *
     * @param {string} key   store key
     * @param {*}      value value for key
     *
     * @return {Promise.<Store>} promise to add item to store, resolving to
     *                           self (for chaining)
     */
    'virtual abstract override public add'(key, value) {
      return this.__super(key, value).then(ret => {
        delete this._stores[key];
        return ret;
      });
    },

    /**
     * Retrieve item from store under `key`
     *
     * If the returned value is an object, it will automatically be
     * converted into a store and populated with the object's
     * values; otherwise, the value will be returned unaltered.
     *
     * Only vanilla objects (that is---not instances of anything but
     * `Object`) will be converted into a Store.
     *
     * @param {string} key store key
     *
     * @return {Promise} promise for the key value
     */
    'virtual abstract override public get'(key) {
      if (this._stores[key] !== undefined) {
        return Promise.resolve(this._stores[key]);
      }

      return this.__super(key).then(value => {
        if (!this._isConvertable(value)) {
          return value;
        }

        // create and cache store (we cache _before_ populating,
        // otherwise another request might come in and create yet
        // another store before we have a chance to complete
        // populating)
        const substore = this._ctor();

        this._stores[key] = substore;

        return substore.populate(value).then(() => substore);
      });
    },

    /**
     * Determine whether given value should be converted into a Store
     *
     * Only vanilla objects (that is---not instances of anything but
     * `Object`) will be converted into a Store.
     *
     * @param {*} value value under consideration
     *
     * @return {boolean} whether to convert `value`
     */
    'private _isConvertable'(value) {
      if (typeof value !== 'object') {
        return false;
      }

      const ctor = value.constructor || {};

      // instances of prototypes should be left alone, so we should ignore
      // everything that's not a vanilla object
      if (ctor !== Object) {
        return false;
      }

      return true;
    },
  });
