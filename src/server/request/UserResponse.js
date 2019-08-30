/**
 * Response to user request
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var Class        = require( 'easejs' ).Class,
    UserRequest  = require( './UserRequest' );


/**
 * Abstraction for standard user request responses
 *
 * This provides consistency throughout the system and permits hiding the
 * actual user request.  This may be extended by subtypes to alter its
 * behavior in a well-defined manner.
 */
module.exports = Class( 'UserResponse' )
    .extend(
{
    /**
     * User request to accept a response
     * @type {UserRequest}
     */
    'private _request': null,


    __construct: function( request )
    {
        if ( !Class.isA( UserRequest, request ) )
        {
            throw TypeError(
                "UserRequest expected; given " + request
            );
        }

        this._request = request;
    },


    /**
     * Satisfy a request successfully
     *
     * This is an HTTP/1.1 200 OK response.
     *
     * @param {*} data return data
     *
     * @return {undefined} only one response should be made
     */
    'public ok': function( data )
    {
        this._reply( 200, null, data );
    },


    /**
     * Request was accepted for processing and may or may not eventually
     * complete
     *
     * This is an HTTP/1.1 202 Accepted response.
     *
     * @param {*} data return data
     *
     * @return {undefined} only one response should be made
     */
    'public accepted': function( data )
    {
        this._reply( 202, null, data );
    },


    /**
     * Client request was unknown or invalid
     *
     * This is an HTTP/1.1 400 Bad Request response.
     *
     * @param {*}       data  return data
     * @param {?string} error error code or description
     *
     * @return {undefined} only one response should be made
     */
    'public requestError': function( data, error )
    {
        this._reply( 400, error, data );
    },


    /**
     * Request cannot be completed due to a conflict with the current state
     * of the resource
     *
     * This is an HTTP/1.1 409 Conflict response.
     *
     * @param {*}       data  return data
     * @param {?string} error error code or description
     *
     * @return {undefined} only one response should be made
     */
    'public stateError': function( data, error )
    {
        this._reply( 409, error, data );
    },


    /**
     * User is not authorized to perform the action
     *
     * This is an HTTP/1.1 403 Forbidden response.
     *
     * @param {*}       data  return data
     * @param {?string} error error code or description
     *
     * @return {undefined} only one response should be made
     */
    'public forbidden': function( data, error )
    {
        this._reply( 403, error, data );
    },


    /**
     * Requested resource was not found
     *
     * This is an HTTP/1.1 404 Not Found response.
     *
     * @param {*}       data  return data
     * @param {?string} error error code or description
     *
     * @return {undefined} only one response should be made
     */
    'public notFound': function( data, error )
    {
        this._reply( 404, error, data );
    },


    /**
     * An internal error occurred while processing an otherwise valid
     * request
     *
     * This is an HTTP/1.1 500 Internal Server Error response.
     *
     * @param {*}       data  return data
     * @param {?string} error error code or description
     *
     * @return {undefined} only one response should be made
     */
    'public internalError': function( data, error )
    {
        this._reply( 500, error, data );
    },


    /**
     * Requested service is unavailable and the request could not be
     * fulfilled
     *
     * This is an HTTP/1.1 503 Service Unavailable response.
     *
     * @param {*}       data  return data
     * @param {?string} error error code or description
     *
     * @return {undefined} only one response should be made
     */
    'public unavailable': function( data, error )
    {
        this._reply( 503, error, data );
    },


    /**
     * Requested service is temporarily unavailable and the request should
     * be retried
     *
     * This invokes `#unavailable` with a static error code of `EAGAIN`
     * (motivated by the standard Unix error constant name).
     *
     * @param {*} data return data
     *
     * @return {undefined} only one response should be made
     */
    'public tryAgain': function( data )
    {
        this.unavailable( data, 'EAGAIN' );
    },



    /**
     * Prepare to complete a request with the given code and data
     *
     * The majority of this logic is delegated to `#endRequest`, allowing
     * subtypes to hook or override the response logic.
     *
     * @param {number}  code  status code
     * @param {?string} error error string, if applicable
     * @param {*}       data  generic return data
     */
    'protected _reply': function( code, error, data )
    {
        code  = +code;
        error = ''+( error || '' ) || null;

        // this may be overridden by subtypes
        this.endRequest( code, error, data );
    },


    /**
     * Complete a request with the given code and data
     *
     * The returned are serialized, so keep in mind that certain data
     * may be lost (for example, the distinction between `null` and
     * `undefined`).
     *
     * A subtype may override this method to hook or fundamentally alter the
     * behavior of a response.  If a subtype only wishes to modify or
     * augment the response, it should instead override `#createRreply`.
     *
     * @param {number}  code  status code
     * @param {?string} error error string, if applicable
     * @param {*}       data  generic return data
     */
    'virtual protected endRequest': function( code, error, data )
    {
        this._request
            .setResponseCode( code )
            .end(
                JSON.stringify(
                    this.createReply( code, error, data )
                )
            );
    },


    /**
     * Produce a response to be returned to the client
     *
     * The standard reply consists of an error string (or null) and generic
     * response data, output as a JSON object literal.
     *
     * If a subtype wishes to augment the response in any way, this is the
     * place to do it.
     *
     * The return value will be serialized.
     *
     * @param {?string} error error string, if applicable
     * @param {*}       data  generic return data
     *
     * @return {*} response value
     */
    'virtual protected createReply': function( code, error, data )
    {
        return {
            error: error,
            data:  data,
        };
    },
} );

