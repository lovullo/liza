/**
 * XMLHttpRequest HTTP protocol implementation
 *
 *  Copyright (C) 2014, 2015 R-T Specialty, LLC.
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

const Class     = require( 'easejs' ).Class;
const HttpImpl  = require( './HttpImpl' );
const HttpError = require( './HttpError' );


/**
 * An HTTP implementation using the standardized XMLHttpRequest prototype.
 */
module.exports = Class( 'XhrHttpImpl' )
    .implement( HttpImpl )
    .extend(
{
    /**
     * XMLHttpRequest constructor
     * @type {XMLHttpRequest}
     * @constructor
     */
    'private _Xhr': null,


    /**
     * Initializes with constructor to the object through which XHRs will be
     * made
     *
     * @param {Object} XMLHttpRequest ctor to object to perform requests
     */
    __construct: function( XMLHttpRequest )
    {
        this._Xhr = XMLHttpRequest;
    },


    /**
     * Perform HTTP request using the standard XMLHttpRequest
     *
     * If METHOD is `"GET"`, the data will be appended to the URL;
     * otherwise, the URL remains unchanged.
     *
     * No additional encoding is preformed on DATA; that is assumed to have
     * already been performed.
     *
     * @param {string} url    base request URL
     * @param {string} method RFC-2616-compliant HTTP method
     *
     * @param {string} data request data
     *
     * @param {function(Error, Object)} callback server response callback
     *
     * @return {HttpImpl} self
     */
    'public requestData': function( url, method, data, callback )
    {
        if ( typeof data !== 'string' )
        {
            throw TypeError(
                "Request data must be a string; " + typeof data + " given"
            );
        }

        var req = new this._Xhr(),
            url = this._genUrl( url, method, data );

        try
        {
            this.openRequest( req, url, method );
            this.onLoad( req, function( err, resp )
            {
                callback( err, resp );
            } );

            req.send( this._getSendData( method, data ) );
        }
        catch ( e )
        {
            callback( e, null );
        }

        return this;
    },


    /**
     * Generate URL according to METHOD and provided DATA
     *
     * See `#requestData` for more information.
     *
     * @param {string}          url      base request URL
     * @param {string}          method   RFC-2616-compliant HTTP method
     *
     * @param {?Object<string,string>|string=} data request params or
     *                                              post data
     *
     * @return {string} original URL, or appended with params
     */
    'private _genUrl': function( url, method, data )
    {
        if ( method !== 'GET' )
        {
            return url;
        }

        return url +
            ( ( data )
              ? ( '?' + data )
              : ''
            );
    },


    /**
     * Determine what DATA to post to the server
     *
     * If method is GET, no data are posted
     *
     * @param {string}                         url  base request URL
     * @param {?Object<string,string>|string=} data post data
     *
     * @return {string|undefined} data to post to server
     */
    'private _getSendData': function( method, data )
    {
        if ( method === 'GET' )
        {
            return undefined;
        }

        // TODO: reject nonsense types, including arrays
        switch ( typeof data )
        {
            case 'object':
                return this._encodeKeys( data );

            default:
                return data;
        }
    },


    /**
     * Prepares a request to the given URL using the given HTTP method
     *
     * This method may be overridden by subtypes to set authentication data,
     * modify headers, hook XHR callbacks, etc.
     *
     * Subtypes may throw exceptions; the caller of this method catches and
     * properly forwards them to the callback.
     *
     * This method must be synchronous.
     *
     * @param {XMLHttpRequest} req    request to prepare
     * @param {string}         url    destination URL
     * @param {string}         method HTTP method
     *
     * @return {undefined}
     */
    'virtual protected openRequest': function( req, url, method )
    {
        // alway async
        req.open( method, url, true );

        if ( method === 'POST' )
        {
            req.setRequestHeader(
                'Content-Type',
                'application/x-www-form-urlencoded'
            );
        }
    },


    /**
     * Hooks ready state change to handle data
     *
     * Subtypes may override this method to alter the ready state change
     * actions taken (e.g. to display progress, handle errors, etc.)  If
     * only the HTTP status needs to be checked, subtypes may override
     * success/failure determination via `#isSuccessful'.  If the error
     * response needs to be customized, override `#serveError'.
     *
     * When overriding this method, please either call the parent method or
     * invoke the aforementioned two methods.
     *
     * @param {XMLHttpRequest}          req      request to hook
     * @param {function(?Error,string)} callback continuation to invoke with
     *                                           response
     *
     * @return {undefined}
     *
     * @throws {Error} if non-200 response received from server
     */
    'virtual protected onLoad': function( req, callback )
    {
        var _self = this;

        req.onreadystatechange = function()
        {
            // ready state of 4 (DONE) indicates that the request is complete
            if ( req.readyState !== 4 )
            {
                return;
            }
            else if ( !( _self.isSuccessful( req.status ) ) )
            {
                _self.serveError( req, callback );
                return;
            }

            // successful
            callback( null, req.responseText );
        };
    },


    /**
     * Determine whether the given HTTP status indicates a success or
     * failure
     *
     * The default implementation is to consider any 2xx status code to be
     * successful, as indicated by RFC 2616.
     *
     * @param {number} status HTTP response status
     *
     * @return {bool} whether HTTP status represents a success
     */
    'virtual protected isSuccessful': function( status )
    {
        return ( +status >= 200 ) && ( +status < 300 );
    },


    /**
     * Serve an error response
     *
     * The default behavior is to return an Error with the status code as a
     * `status` property, and the original response text as the output
     * value; the philosophy here is that we should never modify the output,
     * since a certain format may be expected as the result.
     *
     * When overriding this method, keep in mind that it should always
     * return an Error for the first argument, or set it to null, indicating
     * a success.
     *
     * This method exposes the original XMLHttpRequest used to make the
     * request, so it can be used to perform additional analysis for error
     * handling, or to override the error and instead return a successful
     * response.
     *
     * @param {XMLHttpRequest}          req      request to hook
     * @param {function(?Error,string)} callback continuation to invoke with
     *                                           response
     * @return {undefined}
     */
    'virtual protected serveError': function( req, callback )
    {
        var e = HttpError( req.status + " error from server" );
        e.status = req.status;

        callback( e, req.responseText );
    }
} );
