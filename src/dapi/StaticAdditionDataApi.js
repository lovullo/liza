/**
 * Adds static data to API response
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
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

var Class   = require( 'easejs' ).Class,
    DataApi = require( './DataApi' ),

    EventEmitter = require( '../events' ).EventEmitter;


/**
 * Prepends static data to a response
 */
module.exports = Class( 'StaticAdditionDataApi' )
    .implement( DataApi )
    .extend( EventEmitter,
{
    /**
     * DataApi to restrict
     * @type {DataApi}
     */
    'private _api': null,

    /**
     * Prevents augmenting empty sets
     * @type {boolean}
     */
    'private _nonempty': false,

    /**
     * Only append if more than 1 result
     * @type {boolean}
     */
    'private _multiple': false,

    /**
     * Static values to prepend
     */
    'private _static': [],


    /**
     * Initialize static API response data
     *
     * @param {DataApi}        data_api    data API to wrap
     * @param {Boolean}        nonempty    to append if any results
     * @param {Boolean}        multiple    to append if more than 1 result
     * @param {Array.<Object>} static_data static data to prepend
     */
    __construct: function( data_api, nonempty, multiple, static_data )
    {
        this._api      = data_api;
        this._static   = static_data;
        this._nonempty = !!nonempty;
        this._multiple = !!multiple;
    },


    /**
     * Request data from the service
     *
     * @param {Object=}           data     request params
     * @param {function(Object)=} callback server response callback
     *
     * @return {DataApi} self
     */
    'public request': function( data, callback, id )
    {
        data     = data     || {};
        callback = callback || function() {};

        var _self = this,
            inst  = this.__inst;

        this._api.request( data, function( err, response )
        {
            // if the data are invalid, do nothing
            if ( !Array.isArray( response ) )
            {
                callback.call( inst, err, response );
                return;
            }

            // return the response with our data
            callback.call( inst,
                err,
                _self._unshiftData( response )
            );
        }, id );
    },


    /**
     * Unshifts the static data onto the given data set
     *
     * Be warned: for performance reasons, this alters the actual array that was
     * passed in (rather than returning a new one); if this is a problem, change
     * it (or add a flag to the ctor).
     *
     * @param {Array} data data to augment
     *
     * @return {Array} augmented data
     */
    'private _unshiftData': function( data )
    {
        // if the nonempty flag is set, then we should not augment empty sets
        if ( ( data.length === 0 ) && ( this._nonempty ) )
        {
            return data;
        }

        // if multiple flag is set but result contains < 2 results, do
        // not augment
        if ( ( data.length < 2 ) && ( this._multiple ) )
        {
            return data;
        }

        // note that this modifies the actual reference!
        var i = this._static.length;
        while ( i-- )
        {
            data.unshift( this._static[ i ] );
        }

        return data;
    }
} );
