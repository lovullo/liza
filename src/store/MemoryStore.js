/**
 * Generic key/value store in local memory
 *
 *  Copyright (C) 2016 LoVullo Associates, Inc.
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

var Class = require( 'easejs' ).Class,
    Store = require( './Store' );


/**
 * Generic key/value store with bulk clear
 *
 * @todo There's a lot of overlap between this concept and that of the
 *   Bucket.  Maybe have the Bucket layer atop of simple Store
 *   interface as a step toward a new, simpler Bucket
 *   implementation.  This was not implemented atop of the Bucket
 *   interface because its haphazard implementation would
 *   overcomplicate this.
 *
 * @example
 *   let s = MemoryStore();
 *
 *   s.add( 'foo', 'bar' );
 *   s.add( 'baz', 'quux' );
 *   s.get( 'foo' );  // bar
 *   s.get( 'baz' );  // quux
 *
 *   s.clear();
 *   s.get( 'foo' );  // undefined
 *   s.get( 'baz' );  // undefined
 */
module.exports = Class( 'MemoryStore' )
    .implement( Store )
    .extend(
{
    /**
     * Key/value store
     *
     * @type {Object}
     */
    'private _store': {},


    /**
     * Add item to cache under `key` with value `value`
     *
     * @param {string} key   cache key
     * @param {*}      value value for key
     *
     * @return {Store} self
     */
    'virtual public add': function( key, value )
    {
        this._store[ key ] = value;

        return this;
    },


    /**
     * Retrieve item from cache under `key`
     *
     * @param {string} key cache key
     *
     * @return {*} `key` value
     */
    'virtual public get': function( key )
    {
        return this._store[ key ];
    },


    /**
     * Clear all items in cache
     *
     * @return {Store} self
     */
    'virtual public clear': function()
    {
        this._store = {};

        return this;
    },


    /**
     * Fold (reduce) all cached values
     *
     * This provides a way to iterate through all cached values and
     * their keys while providing a useful functional result (folding).
     *
     * The order of folding is undefined.
     *
     * The ternary function `callback` is of the same form as
     * {@link Array#fold}: the first argument is the value of the
     * accumulator (initialized to the value of `initial`; the second
     * is the cached item; and the third is the key of that item.
     *
     * @param {function(*,*,string=)} callback folding function
     * @param {*}                     initial  initial value for accumulator
     *
     * @return {*} folded value (final accumulator value)
     */
    'public reduce': function( callback, initial )
    {
        var store = this._store;

        return Object.keys( store )
            .map( function( key )
            {
                return [ key, store[ key ] ];
            } )
            .reduce( function( accum, values )
            {
                return callback( accum, values[ 1 ], values[ 0 ] );
            }, initial );
    }
} );
