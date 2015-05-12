/**
 * XMLHttpRequest HTTP protocol implementation
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
    HttpImpl = require( './HttpImpl' );


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
     * @param {Object|string}           data     request params
     * @param {function(Error, Object)} callback server response callback
     *
     * @return {HttpImpl} self
     */
    'public requestData': function( url, method, data, callback )
    {
        var req = new this._Xhr();

        try
        {
            this.openRequest( req, url, method );
            this.onLoad( req, function( err, resp )
            {
                callback( err, resp );
            } );
        }
        catch ( e )
        {
            callback( e, null );
        }

        return this;
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
    },


    /**
     * Hooks ready state change to handle data
     *
     * Subtypes may override this method to alter the ready state change
     * actions taken (e.g. to display progress, handle errors, etc.)  If
     * only the HTTP status needs to be checked, subtypes may override
     * success/failure determination via `#isSuccessful'.
     *
     * @param {XMLHttpRequest}   req      request to hook
     * @param {function(string)} callback continuation to invoke with response
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
                callback(
                    Error( req.status + " error from server" ),
                    {
                        status: req.status,
                        data:   req.responseText
                    }
                );
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
     * @param {number} status HTTP response status
     *
     * @return {bool} whether HTTP status represents a success
     */
    'virtual protected isSuccessful': function( status )
    {
        return +status === 200;
    }
} );

