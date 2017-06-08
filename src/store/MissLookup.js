/**
 * Auto-lookup for store misses
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
 * Automatically try to look up values on store miss
 *
 * A common use case for key/value stores is caching.  Unless the
 * cache is being warmed by another system, it's likely that the
 * caller will process whatever item is missing and then immediately
 * add it to the cache.  This simplifies that situation by
 * automatically calling a function on miss and holding the request
 * until the datum becomes available.
 *
 * To guard against stampeding, and to relieve callers from handling
 * other concurrency issues, all requests for the same key will return
 * the same promise until that promise is resolved or rejected (see
 * `#get`).
 *
 * @example
 *   function lookup( key )
 *   {
 *       return Promise.resolve( key + ' foobar' );
 *   }
 *
 *   let store = Store.use( MissLookup( lookup ) );
 *
 *   store.get( 'unknown' )
 *       .then( function( value )
 *       {
 *           // value 'unknown foobar'
 *       } );
 *
 * This trait can also be used purely to prevent stampeding by
 * providing a miss function that is effectively a noop for a given
 * situation.
 */
module.exports = Trait( 'MissLookup' )
    .implement( Store )
    .extend(
{
    /**
     * Store miss key lookup function
     *
     * @type {function(string)}
     */
    'private _lookup': null,

    /**
     * Unresolved promises for misses, by key
     *
     * @type {Object}
     */
    'private _misses': {},


    /**
     * Initialize key miss lookup
     *
     * The unary miss lookup function `lookup` will be provided with
     * the key of the store item that missed and should return the
     * intended value of that item.  The resulting item will be stored
     * and returned.  If no item is found, `lookup` should return
     * `undefined`.
     *
     * @param {function(string): Promise} lookup store miss key lookup
     */
    __mixin: function( lookup )
    {
        if ( typeof lookup !== 'function' )
        {
            throw TypeError( 'Lookup function must be a function' );
        }

        this._lookup = lookup;
    },


    /**
     * Retrieve item from the store under `key`, attempting lookup on
     * store miss
     *
     * In the event of a miss, the looked up value is added to the
     * store.  This method waits for the add operation to complete
     * before fulfilling the promise by re-requesting the key from the
     * supertype (allowing it to do its own thing).
     *
     * On the first miss for a given key `K`, a promise `P` is stored.
     * To prevent stampeding and other awkward concurrency issues,
     * all further requests for `K` will receive the same promise
     * `P` until it is resolved.
     *
     * A word of caution: if the lookup function does not return a
     * value, it will continue to be called for each request
     * thereafter.  This might not be a good thing if the lookup
     * operating is intensive, so the lookup should take into
     * consideration this possibility.
     *
     * @param {string} key store key
     *
     * @return {Promise} promise for the key value
     */
    'virtual abstract override public get': function( key )
    {
        var _self   = this,
            __super = this.__super.bind( this );

        // to prevent stampeding, return any existing unresolved
        // promise for this key
        if ( this._misses[ key ] )
        {
            return this._misses[ key ];
        }

        // note that we have to store the reference immediately so we
        // don't have two concurrent failures, so this will store a
        // promise even if the key already exists (which is okay)
        return this._misses[ key ] = this.__super( key )
            .then( function( value )
            {
                // already exists
                delete _self._misses[ key ];

                return value;
            } )
            .catch( function()
            {
                delete _self._misses[ key ];

                return _self._lookup( key )
                    .then( function( value )
                    {
                        return _self.add( key, value );
                    } )
                    .then( function()
                    {
                        return __super( key );
                    } );
            } );
    },
} );
