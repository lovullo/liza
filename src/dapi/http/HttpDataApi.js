/**
 * Data transmission over HTTP(S)
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

var Class    = require( 'easejs' ).Class,
    DataApi  = require( '../DataApi' ),
    HttpImpl = require( './HttpImpl' ),

    // RFC 2616 methods
    rfcmethods = {
        DELETE:  true,
        GET:     true,
        HEAD:    true,
        OPTIONS: true,
        POST:    true,
        PUT:     true,
        TRACE:   true
    };


/**
 * HTTP request abstraction. Does minor validation, but delegates to a specific
 * HTTP implementation for the actual request.
 */
module.exports = Class( 'HttpDataApi' )
    .implement( DataApi )
    .extend(
{
    /**
     * Request URL
     * @type {string}
     */
    'private _url': '',

    /**
     * HTTP method
     * @type {string}
     */
    'private _method': '',

    /**
     * HTTP implementation to perfom request
     * @type {HttpImpl}
     */
    'private _impl': null,


    /**
     * Initialize Data API with destination and HTTP implementation
     *
     * The supplied HTTP implementation will be used to perform the HTTP
     * requests, which permits the user to use whatever implementation works
     * well with their existing system.
     *
     * @param {string}   url    destination URL
     * @param {string}   method RFC-2616-compliant HTTP method
     * @param {HttpImpl} impl   HTTP implementation
     *
     * @throws {TypeError} when non-HttpImpl is provided
     */
    __construct: function( url, method, impl )
    {
        if ( !( Class.isA( HttpImpl, impl ) ) )
        {
            throw TypeError( "Expected HttpImpl" );
        }

        this._url    = ''+url;
        this._method = this._validateMethod( method );
        this._impl   = impl;
    },


    /**
     * Perform an asynchronous request and invoke the callback with the reply
     *
     * In the event of an error, the first parameter is the error; otherwise, it
     * is null. The return data shall not be used in the event of an error.
     *
     * The return value shall be a raw string; conversion to other formats must
     * be handled by a wrapper.
     *
     * @param {string}                    data     binary data to transmit
     * @param {function(?Error,*):string} callback continuation upon reply
     *
     * @return {DataApi} self
     *
     * @throws {TypeError} on validation failure
     */
    'virtual public request': function( data, callback )
    {
        this._validateDataType( data );

        this._impl.requestData(
            this._url, this._method, data, callback
        );

        return this;
    },


    /**
     * Ensures that the provided method conforms to RFC 2616
     *
     * @param {string} method HTTP method
     * @return {string} provided method
     *
     * @throws {Error} on non-conforming method
     */
    'private _validateMethod': function( method )
    {
        if ( !( rfcmethods[ method ] ) )
        {
            throw Error( "Invalid RFC 2616 method: " + method );
        }

        return method;
    },


    /**
     * Validates that the provided data type is accepted by the Data API
     *
     * @param {*} data data to validate
     * @return {undefined}
     *
     * @throws {TypeError} on validation failure
     */
    'private _validateDataType': function( data )
    {
        var type = typeof data;

        if ( ( data === null )
            || !( ( type === 'string' ) || ( type === 'object' ) )
        )
        {
            throw TypeError(
                "Data must be a string of raw data or object containing " +
                "key-value params"
            );
        }
    }
} );
