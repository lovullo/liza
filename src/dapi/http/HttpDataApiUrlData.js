/**
 *  Provide data as part of URL
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
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

const { Trait }   = require( 'easejs' );
const HttpDataApi = require( './HttpDataApi' );


/**
 * Place fields from given data in the URL
 *
 * All remaining fields are passed to the underlying supertype.
 */
module.exports = Trait( 'HttpDataApiUrlData' )
    .extend( HttpDataApi,
{
    /**
     * Fields to take from data and place in URL
     * @type {string}
     */
    'private _fields': [],


    /**
     * Initialize with URL field list
     *
     * @param {Array<string>} fields list of fields to include in URL
     */
    __mixin( fields )
    {
        this._fields = fields;
    },


    /**
     * Concatenate chosen fields with URL
     *
     * The previously specified fields will have their values delimited by '/'
     * and will be concatenated with the URL.  All used fields in DATA will be
     * removed before being passed to the supertype.  METHOD and CALLBACK are
     * proxied as-is.
     *
     * @param {string}                  url      destination URL
     * @param {string}                  method   RFC-2616-compliant HTTP method
     * @param {Object|string}           data     request params
     * @param {function(Error, Object)} callback server response callback
     *
     * @return {HttpImpl} self
     */
    'override public requestData'( url, method, data, callback )
    {
        const [ values, filtered_data ]  = this._getFieldValues( data );

        const params  = values.map( ( [ , value ] ) => value );
        const missing = values.filter( ( [ , value ] ) => value === undefined );

        if ( missing.length > 0 )
        {
            callback(
                Error(
                    "Missing URL parameters: " +
                    missing.map( ( [ field ] ) => field ).join( ", " )
                ),
                null
            );

            return this;
        }

        const built_url = ( params.length > 0 )
            ? url + '/' + params.join( '/' )
            : url;

        return this.__super( built_url, method, filtered_data, callback );
    },


    /**
     * Associate fields with their respective values from DATA
     *
     * The returned values are of the form `[ [ field, value ], ... ]`.
     * The returned data object is a copy of the original and is stripped
     * of the respective fields.
     *
     * @param {Object} data source data
     *
     * @return {Array} values and copy of data stripped of those fields
     */
    'private _getFieldValues'( data )
    {
        const fieldset = new Set( this._fields );
        const values   = this._fields.map( field => [ field, data[ field ] ] );

        // copy of data with fields stripped
        const new_data = Object.keys( data ).reduce( ( dest, key ) =>
        {
            if ( fieldset.has( key ) )
            {
                return dest;
            }

            dest[ key ] = data[ key ];
            return dest;
        }, {} );

        return [ values, new_data ];
    },
} );
