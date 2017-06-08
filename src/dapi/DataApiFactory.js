/**
 * Instantiate appropriate DataApi
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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

var Class = require( 'easejs' ).Class,

    HttpDataApi           = require( './http/HttpDataApi' ),
    XhrHttpImpl           = require( './http/XhrHttpImpl' ),
    JsonResponse          = require( './format/JsonResponse' ),
    RestrictedDataApi     = require( './RestrictedDataApi' ),
    StaticAdditionDataApi = require( './StaticAdditionDataApi' ),
    BucketDataApi         = require( './BucketDataApi' );


/**
 * Instantiates the appropriate DataApi object for the givne service type
 */
module.exports = Class( 'DataApiFactory',
{
    /**
     * Return a DataApi instance for the requested service type
     *
     * The source and method have type-specific meaning; that is, "source" may
     * be a URL and "method" may be get/post for a RESTful service.
     *
     * @param {string} type service type (e.g. "rest")
     * @param {Object} desc API description
     *
     * @return {DataApi} appropriate DataApi instance
     */
    'public fromType': function( type, desc, bucket )
    {
        var api    = null,
            source = ( desc.source || '' ),
            method = ( desc.method || '' ),

            static_data = ( desc['static'] || [] ),
            nonempty    = !!desc.static_nonempty,
            multiple    = !!desc.static_multiple;

        switch ( type )
        {
            case 'rest':
                api = HttpDataApi.use( JsonResponse )(
                    source,
                    method.toUpperCase(),
                    XhrHttpImpl( XMLHttpRequest )
                );
                break;

            case 'local':
                // currently, only local bucket data sources are supported
                if ( source !== 'bucket' )
                {
                    throw Error( "Unknown local data API source: " + source );
                }

                api = BucketDataApi( bucket, desc.retvals );
                break;

            default:
                throw Error( 'Unknown data API type: ' + type );
        };

        return RestrictedDataApi(
            StaticAdditionDataApi( api, nonempty, multiple, static_data ),
            desc
        );
    }
} );

