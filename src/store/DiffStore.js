/**
 * Store that lazily computes diffs since last change
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

"use strict";

const Class          = require( 'easejs' ).Class;
const Store          = require( './Store' );
const StoreMissError = require( './StoreMissError' );


/**
 * Lazily compute diffs since last change
 *
 * This store recursively calculates the diff of scalars and
 * objects.  Unlike many other stores, you don't always get out what you put
 * in.
 *
 * There are three operations:
 *   - `#add` stages a change to a key;
 *   - `#get` calculates the diff of a key against its committed value; and
 *   - `#clear` commits staged values, clearing all diffs.
 *
 * Values are recursively compared until a scalar is found.  If the scalar
 * matches the committed value, it is recognized as unchanged and
 * represented as `undefined`.  Otherwise, the staged value takes its
 * place.
 *
 * @example
 *   // Promise resolving to [ undefined, "quux" ]
 *   DiffStore()
 *       .add( 'foo', [ "bar", "baz" ] )
 *       .then( store => store.clear() )
 *       .add( 'foo', [ "bar", "quux" ] )
 *       .then( store => store.get( 'foo' ) )
 *
 *   // Promise resolving to { foo: undefined, baz: [ undefined, 'c' ] }
 *   DiffStore()
 *       .add( 'foo', { foo: 'bar', baz: [ 'a', 'b', ] } )
 *       .then( store => store.clear() )
 *       .add( 'foo', { baz: [ 'a', 'c' ] } )
 *       .then( store => store.get( 'foo' ) )
 *
 * The union of all keys of all objects are included in the diff:
 *
 * @example
 *   // Promise resolving to { foo: undefined, baz: 'quux' }
 *   DiffStore()
 *       .add( 'foo', { foo: 'bar' } )
 *       .then( store => store.clear() )
 *       .add( 'foo', { baz: 'quux' } )
 *       .then( store => store.get( 'foo' ) )
 *
 * Values are diff'd since the last `#clear`, so adding a value multiple
 * times will compare only the last one:
 *
 * @example
 *   // Promise resolving to undefined
 *   DiffStore()
 *       .add( 'foo', 'foo' )
 *       .then( store => store.clear() )
 *       .add( 'foo', 'bar' )
 *       .add( 'foo', 'baz' )
 *       .add( 'foo', 'foo' )
 *       .then( store => store.get( 'foo' ) )
 *
 *   // Promise resolving to undefined
 *   DiffStore()
 *       .add( 'foo', 'bar' )
 *       .then( store => store.clear() )
 *       .then( store => store.get( 'foo' ) )
 *
 * One caveat: since the diff represents the absence of changes as
 * `undefined`, there is no way to distinguish between an actual undefined
 * value and a non-change.  If this is important to you, you can subtype
 * this class and override `#diff`.
 *
 * For more examples, see the `DiffStoreTest` test case.
 */
module.exports = Class( 'DiffStore' )
    .implement( Store )
    .extend(
{
    /**
     * New data staged for committing
     * @type {Object}
     */
    'private _staged': {},

    /**
     * Previous values
     * @type {Object}
     */
    'private _commit': {},


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
    'virtual public add'( key, value )
    {
        this._staged[ key ] = value;

        return Promise.resolve( this.__inst );
    },


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
    'virtual public populate'( obj )
    {
        return Promise.all(
            Object.keys( obj ).map(
                key => this.add( key, obj[ key ] )
            )
        );
    },


    /**
     * Retrieve diff of `key`
     *
     * This performs a lazy diff of the data `D` behind `key`.  For each
     * scalar value in `D`, recursively, the value will be `undefined` if
     * there is no change and will be the staged value if changed.  A change
     * occurs when the data `D` differs from the value of `key` before the
     * last `#clear`.  A value is staged when it has been added since the
     * last `#clear`.
     *
     * @param {string} key store key
     *
     * @return {Promise} promise for the key value
     */
    'virtual public get'( key )
    {
        if ( ( this._staged[ key ] || this._commit[ key ] ) === undefined )
        {
            return Promise.reject(
                StoreMissError( `Key '${key}' does not exist` )
            );
        }

        return Promise.resolve(
            this.diff( this._staged[ key ], this._commit[ key ] )
        );
    },


    /**
     * Commit staged data and clear diffs
     *
     * All staged data will be committed.  Until some committed key `k` has
     * its data modified via `#add`, `k` will not be considered to have
     * changed.
     *
     * @return {Promise.<Store>} promise to add item to store, resolving to
     *                           self (for chaining)
     */
    'virtual public clear'()
    {
        Object.keys( this._staged ).forEach(
            key => this._commit[ key ] = this._staged[ key ]
        );

        this._staged = {};

        return Promise.resolve( this.__inst );
    },


    /**
     * Recursively diff two objects or scalars `data` and `orig`
     *
     * A datum in `data` is considered to be changed when it is not equal to
     * the corresponding datum in `orig`.  If the datum is an object, it is
     * processed recursively until a scalar is reached for comparison.
     *
     * The algorithm processes the union of the keys of both `data` and
     * `orig`.
     *
     * One caveat: since the diff represents the absence of changes as
     * `undefined`, there is no way to distinguish between an actual
     * undefined value and a non-change.  If this is important to you, you
     * can override this method.
     *
     * An example of the output of the algorithm is given in the class-level
     * documentation.
     *
     * @param {*} data new data
     * @param {*} orig original data to diff against
     *
     * @return {*} diff
     */
    'virtual protected diff'( data, orig )
    {
        if ( orig === undefined )
        {
            // no previous, then data must be new, and so _is_ the diff
            return data;
        }
        else if ( typeof data !== 'object' )
        {
            // only compare scalars (we'll recurse on objects)
            return ( data === orig )
                ? undefined
                : data;
        }

        const keys = this._getKeyUnion( data, orig );
        let diff   = ( Array.isArray( data ) ) ? [] : {};

        for ( let key of keys )
        {
            diff[ key ] = this.diff( data[ key ], orig[ key ] );
        }

        return diff;
    },


    /**
     * Calculate the union of the keys of `first` and `second`
     *
     * `first` and `second` must both be of type `object`.
     *
     * @param {*} first  some object
     * @param {*} second some object
     *
     * @return {Set} Object.keys(first) ∪ Object.keys(second)
     */
    'private _getKeyUnion'( first, second )
    {
        const keys = new Set( Object.keys( first ) );

        Object.keys( second )
            .forEach( key => keys.add( key ) );

        return keys;
    },


    /**
     * Fold (reduce) all staged values
     *
     * A value is staged when it has been set but `#clear` has not yet
     * been called---these are the only values that might be
     * different.  Since the purpose of this Store is to produce diffs,
     * there is no way to iterate over all values previously encountered.
     *
     * The order of folding is undefined.
     *
     * The ternary function `callback` is of the same form as
     * {@link Array#reduce}: the first argument is the value of the
     * accumulator (initialized to the value of `initial`; the second
     * is the stored item; and the third is the key of that item.
     *
     * @param {function(*,*,string=)} callback folding function
     * @param {*}                     initial  initial value for accumulator
     *
     * @return {Promise} promise of a folded value (final accumulator value)
     */
    'public reduce'( callback, initial )
    {
        return Promise.resolve(
            Object.keys( this._staged).reduce(
                ( accum, key ) => {
                    const value = this.diff(
                        this._staged[ key ],
                        this._commit[ key ]
                    );

                    return callback( accum, value, key );
                },
                initial
            )
        );
    },
} );
