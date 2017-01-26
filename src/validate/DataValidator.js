/**
 * Data validator
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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

"use strict";

const Class = require( 'easejs' ).Class;


/**
 * Check data update for failures
 *
 * This validator glues together various parts of the system that contribute
 * to a validation on data change.
 *
 * TODO: Remove reliance on ClientDependencyFactory
 */
module.exports = Class( 'DataValidator',
{
    /**
     * Bucket data validator
     * @type {BucketDataValidator}
     */
    'private _bucket_validator': null,

    /**
     * Bucket field monitor
     * @type {ValidStateMonitor}
     */
    'private _field_monitor': null,

    /**
     * Dependency factory
     *
     * TODO: remove dependency on this class
     *
     * @type {ClientDependencyFactory}
     */
    'private _factory': null,

    /**
     * Bucket diff store
     * @type {Store}
     */
    'private _store_factory': null,


    /**
     * Initialize validator
     *
     * @param {BucketDataValidator}     bucket_validator data validator
     * @param {ValidStateMonitor}       field_monitor    field state monitor
     * @param {ClientDependencyFactory} dep_factory      REMOVE ME
     * @param {function()}              store_factory    factory for diff store
     */
    __construct(
        bucket_validator, field_monitor, dep_factory, store_factory
    )
    {
        if ( typeof store_factory !== 'function' )
        {
            throw TypeError( "Expected function for parameter store_factory" );
        }

        this._bucket_validator = bucket_validator;
        this._field_monitor    = field_monitor;
        this._factory          = dep_factory;

        this._createStores( store_factory );
    },


    /**
     * Create internal diff stores
     *
     * @param {function()} store_factory function to produce stores
     *
     * @return {undefined}
     */
    'private _createStores': function( store_factory )
    {
        this._bucket_store = store_factory();
    },


    /**
     * Validate diff and update field monitor
     *
     * The external validator `validatef` is a kluge while the system
     * undergoes refactoring.
     *
     * @param {Object}                   diff      bucket diff
     * @param {function(Object,Object)=} validatef external validator
     *
     * @return {Promise} accepts with unspecified value once field monitor
     *                   has completed its update
     */
    'public validate'( diff, validatef )
    {
        const _self = this;

        let failures = {};

        _self._bucket_validator.validate( diff, ( name, value, i ) =>
        {
            diff[ name ][ i ] = undefined;

            ( failures[ name ] = failures[ name ] || {} )[ i ] =
                _self._factory.createFieldFailure( name, i, value );
        }, true );

        validatef && validatef( diff, failures );

        // XXX: this assumes that the above is synchronous
        return this.updateFailures( diff, failures );
    },


    /**
     * Update failures from external validation
     *
     * TODO: This is a transitional API---we should handle all validations,
     * not allow external systems to meddle in our affairs.
     *
     * @param {Object} diff     bucket diff
     * @param {Object} failures failures per field name and index
     *
     * @return {Promise} promise to populate internal store
     */
    'public updateFailures'( diff, failures )
    {
        const _self = this;

        return this._populateStore( diff ).then( () =>
        {
            return _self._field_monitor.update(
                _self._bucket_store, failures
            );
        } );
    },


    /**
     * Populate store with diff
     *
     * This effectively converts a basic array into a `Store`.  This is
     * surprisingly performant on v8.  If the stores mix in traits, there
     * may be a slight performance hit for trait-overridden methods.
     *
     * @param {Object} diff bucket diff
     *
     * @return {Promise} when all items have been added to the store
     */
    'private _populateStore'( diff )
    {
        var bstore = this._bucket_store;

        return Promise.all(
            Object.keys( diff ).map(
                key => bstore.add( key, diff[ key ] )
            )
        );
    },
} );
