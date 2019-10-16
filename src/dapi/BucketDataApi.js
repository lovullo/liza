/**
 * Retrieves API data from bucket
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
    Bucket  = require( '../bucket/Bucket' );


/**
 * Retrieve data from the bucket
 */
module.exports = Class( 'BucketDataApi' )
    .implement( DataApi )
    .extend(
{
    /**
     * Bucket to use as data source
     * @type {Bucket}
     */
    'private _bucket': null,

    'private _params': {},


    /**
     * Initialize data API
     *
     * @param {string}              url      service URL
     * @param {RestDataApiStrategy} strategy request strategy
     */
    __construct: function( bucket, params )
    {
        if ( !( Class.isA( Bucket, bucket ) ) )
        {
            throw Error( "Invalid bucket provided" );
        }

        this._bucket = bucket;
        this._params = params;
    },


    /**
     * Request data from the bucket
     *
     * @param {Object}           data     request params
     * @param {function(Object)} callback server response callback
     *
     * @return {BucketDataApi} self
     */
    'public request': function( data, callback, id )
    {
        var _self = this.__inst,
            rows  = [];

        for ( var i in this._params )
        {
            var field = this._params[ i ],
                fdata = this._bucket.getDataByName( field );

            for ( var index in fdata )
            {
                rows[ index ] = rows[ index ] || {};
                rows[ index ][ field ] = fdata[ index ];
            }
        }

        callback( null, rows );

        return this;
    }
} );
