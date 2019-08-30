/**
 * Spoof HTTP request metadata
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

var Class = require( 'easejs' ).Class;


/**
 * Spoofs an HTTP request with a user session
 *
 * This attempts to make a request to an HTTP server using the user agent,
 * IP address, and session cookie of the original user request.
 */
module.exports = Class( 'SessionSpoofHttpClient',
{
    /**
     * HTTP object with #request
     * @type {Object}
     */
    'private _http': null,

    /**
     * HTTP server hostname
     * @type {string}
     */
    'private _host': '',


    /**
     * Initialize spoof client
     *
     * HTTP must be an object with a `request' method.
     *
     * @param {Object} htto     HTTP module with #request
     * @param {string} hostname remote host name
     */
    __construct: function( http, hostname )
    {
        this._http = http;
        this._host = ''+hostname;
    },


    /**
     * Initialized HTTP requested with spoofed session
     *
     * @param {UserRequest} user_request original user request
     * @param {string}      path         requested path on server
     */
    'request': function( user_request, path )
    {
        path = ''+path;

        var sessid   = user_request.getSessionId(),
            sessname = user_request.getSessionIdName();

        if ( sessid === null )
        {
            throw Error( "Session id unavailable" );
        }

        return this._http.request( {
            hostname: this._host,
            path:     path,
            headers:  {
                'User-Agent':      user_request.getUserAgent(),
                'X-Forwarded-For': user_request.getRemoteAddr(),
                'Cookie':          sessname + '=' + sessid,
            }
        } );
    }
} );

