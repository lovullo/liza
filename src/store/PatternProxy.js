/**
 * Store proxy to sub-stores based on key patterns
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

'use strict';

const Trait = require('easejs').Trait;
const Class = require('easejs').Class;
const Store = require('./Store');
const StorePatternError = require('./StorePatternError');

/**
 * Proxy to sub-stores based on key patterns
 *
 * Patterns are an array of the form `[pattern, store]`.  If a key matches
 * `pattern`, then the request is proxied to `store`.  If the pattern
 * contains a match group, then group 1 will be used as the key for `store`.
 *
 * @example
 *   const store1 = Store();
 *   const store2 = Store();
 *
 *   const patterns = [
 *       [ /^foo:/,      store1 ],
 *       [ /^bar:(.*)$/, store2 ],
 *   ];
 *
 *   const proxy = Store.use( PatternProxy( patterns ) )();
 *
 *   // Promise resolving to "baz"
 *   proxy.add( 'foo:bar', 'baz' ).then( () => store1.get( 'foo:bar' );
 *
 *   // Promise resolving to "quux"
 *   proxy.add( 'bar:baz', 'quux' ).then( () => store1.get( 'baz' );
 *
 *   // Promise rejecting with StorePatternError
 *   proxy.add( 'unknown', 'nope' );
 *
 *   // Promise resolving to "quuux"
 *   store2.add( 'quux', 'quuux' )
 *       .then( () => proxy.get( 'bar:quux' );)
 *
 * Note that this will perform a linear search on each of the patterns.  You
 * can optimize this by putting the patterns in order of most frequently
 * encountered, descending.
 *
 * If a key fails to match any pattern, a `StorePatternError` is thrown.  To
 * provide a default pattern, create a regular expression that matches on
 * any input (e.g. `/./`).)
 */
module.exports = Trait('PatternProxy')
  .implement(Store)
  .extend({
    /**
     * Pattern mapping to internal store
     * @type {Array.<Array.<RegExp,Store>>}
     */
    'private _patterns': [],

    /**
     * Define pattern map
     *
     * `patterns` should be an array of arrays, of this form:
     *
     * @example
     *   [ [ /a/, storea ], [ /^b:(.*)$/, storeb ] ]
     *
     * That is: a regular expression that, when matched, maps to the
     * associated store.  If the regular expression contains a match group,
     * group 1 will be used as the key name in the destination store.
     *
     * @param {Array.<Array.<RegExp,Store>>} patterns pattern map
     */
    __mixin(patterns) {
      this._patterns = this._validatePatternMap(patterns);
    },

    /**
     * Verify that pattern map contains valid mappings
     *
     * @param {Array.<Array.<RegExp,Store>>} patterns pattern map
     *
     * @return {Array} `patterns` argument
     */
    'private _validatePatternMap'(patterns) {
      if (!Array.isArray(patterns)) {
        throw TypeError('Pattern map must be an array');
      }

      patterns.forEach(([pattern, store], i) => {
        if (!(pattern instanceof RegExp)) {
          throw TypeError(`Pattern must be a RegExp at index ${i}`);
        }

        if (!Class.isA(Store, store)) {
          throw TypeError(`Pattern must map to Store at index ${i}`);
        }
      });

      return patterns;
    },

    /**
     * Proxy item with value `value` to internal store matching against `key`
     *
     * Note that the key stored may be different than `key`.  This
     * information is important only if the internal stores are not
     * encapsulated.
     *
     * @param {string} key   store key to match against
     * @param {*}      value value for key
     *
     * @return {Promise.<Store>} promise to add item to store, resolving to
     *                           self (for chaining)
     */
    'virtual public abstract override add'(key, value) {
      return this.matchKeyToStore(key).then(({store, key: skey}) =>
        store.add(skey, value)
      );
    },

    /**
     * Retrieve item from an internal store matching against `key`
     *
     * Note that the key stored may be different than `key`.  This
     * information is important only if the internal stores are not
     * encapsulated.
     *
     * The promise will be rejected if the key is unavailable.
     *
     * @param {string} key store key to pattern match
     *
     * @return {Promise} promise for the key value
     */
    'virtual public abstract override get'(key) {
      // XXX
      return this.matchKeyToStore(key).then(({store, key: skey}) =>
        store.get(skey)
      );
    },

    /**
     * Attempt to map `key` to a Store
     *
     * If no patterns match against `key`, the Promise will be rejected.
     *
     * @param {string} key key to match against
     *
     * @return {Promise.<Object>} {store,key} on success,
     *                             StorePatternError on failure
     */
    'protected matchKeyToStore'(key) {
      for (let [pattern, store] of this._patterns) {
        const [match, skey = key] = key.match(pattern) || [];

        if (match !== undefined) {
          return Promise.resolve({
            store: store,
            key: skey,
          });
        }
      }

      return Promise.reject(
        StorePatternError(`Key '${key}' does not match any pattern`)
      );
    },

    /**
     * Clear all pattern stores
     *
     * This simply calls `#clear` on all stores associated with all
     * patterns.
     *
     * @return {Promise.<Store>} promise to add item to store, resolving to
     *                           self (for chaining)
     */
    'virtual public abstract override clear'() {
      return Promise.all(this._patterns.map(([, store]) => store.clear()));
    },
  });
