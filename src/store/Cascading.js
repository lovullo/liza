/**
 * Recurisvely-clearing key/value store
 *
 *  Copyright (C) 2016 R-T Specialty, LLC.
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

var Trait = require( 'easejs' ).Trait,
    Class = require( 'easejs' ).Class,
    Store = require( './Store' );


/**
 * Store of stores with cascading clear
 *
 * The store `S` into which this trait is mixed will accept only other
 * Store objects which will each have their `#clear` method called
 * when `#clear` is invoked on `S`.
 *
 * @example
 *   let store_a = Store(),
 *       store_b = Store();
 *
 *   // assuming sync. store for example (ignore promises)
 *   store_a.add( 'key', 'value' );
 *   store_b.add( 'foo', 'bar' );
 *
 *   let container = Store.use( Cascading );
 *   container.add( 'a', store_a );
 *   container.add( 'b', store_b );
 *   container.clear();
 *
 *   store_a.get( 'key' );  // Promise rejects
 *   store_b.get( 'foo' );  // Promise rejects
 *
 *   Store.use( Cascading ).add( 'invalid', 'value' );
 *   // rejected with TypeError: Can only add Store to Cascading stores
 *
 * Although clear cascades to each `Store`, other methods do not (for
 * example, `get` will not query all `Store`s); another trait should
 * be added for such a thing.  This behavior allows for, effectively,
 * namespacing.
 *
 * This trait can be used, for example, to implement a centralized
 * caching system that can trigger a reload of objects realtime
 * system-wide, allowing for transparent hot code swapping (assuming
 * that the caller will re-store).
 */
module.exports = Trait( 'Cascading' )
    .implement( Store )
    .extend(
{
    /**
     * Add item to store under `key` with value `value`
     *
     * Only [`Store`]{@link module:store.Store} objects may be attached.
     *
     * @param {string} key   store key
     * @param {Store}  value Store to attach
     *
     * @return {Promise.<Store>} promise to add item to store, resolving to
     *                           self (for chaining)
     */
    'virtual abstract override public add': function( key, value )
    {
        if ( !Class.isA( Store, value ) )
        {
            return Promise.reject(
                TypeError( "Can only add Store to Cascading stores" )
            );
        }

        return this.__super( key, value );
    },


    /**
     * Clear all stores in the store
     *
     * @return {Promise} promise to clear all caches
     */
    'virtual abstract override public clear': function()
    {
        return this.reduce(
            function( accum, store )
            {
                accum.push( store.clear() );
                return accum;
            },
            []
        )
            .then( function( promises )
            {
                return Promise.all( promises );
            } )
            .then( function( result )
            {
                return result.every( function( value )
                {
                    return value === true;
                } );
            } );
    },
} );
