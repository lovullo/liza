/**
 * Processes DataApi return data as JSON
 *
 *  Copyright (C) 2014 LoVullo Associates, Inc.
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

var Class   = require( 'easejs' ).Class,
    DataApi = require( '../DataApi' );


/**
 * Processes DataApi return data as JSON
 */
module.exports = Class( 'JsonDataApi' )
    .implement( DataApi )
    .extend(
{
    /**
     * DataAPI to decorate
     * @type {DataApi}
     */
    'private _dapi': null,


    /**
     * Decorate provided DataAPI to parse response data as JSON
     *
     * @param {DataApi} dapi DataApi to decorate
     */
    __construct: function( dapi )
    {
        if ( !( Class.isA( DataApi, dapi ) ) )
        {
            throw TypeError( "Expecting DataApi" );
        }

        this._dapi = dapi;
    },


    /**
     * Proxies request to encapsulated DataApi and parses the result as JSON
     *
     * @param {string}             data     binary data to transmit
     * @param {function(?Error,*)} callback continuation upon reply
     *
     * @return {DataApi} self
     */
    'public request': function( data, callback )
    {
        this._dapi.request( data, function( err, resp )
        {
            if ( err !== null )
            {
                callback( err, null );
                return;
            }

            try
            {
                var data = JSON.parse( resp );
            }
            catch ( e )
            {
                // parsing failed
                callback( e, null );
                return;
            }

            callback( null, data );
        } );

        return this;
    }
} );

