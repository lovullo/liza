/**
 * Node-based HTTP client with session spoofing
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const { Trait } = require( 'easejs' );
const HttpImpl  = require( './HttpImpl' );


/**
 * Spoof user session during request
 *
 * TODO: Implementing HttpImpl instead of overriding NodeHttpImpl to work
 * around a class extension bug; change once fixed.
 */
module.exports = Trait( 'SpoofedNodeHttpImpl' )
    .implement( HttpImpl )
    .extend(
{
    /**
     * Session to spoof
     * @type {UserRequest}
     */
    'private _request': null,


    /**
     * Use session for spoofing requests
     *
     * @param {UserRequest} request session to spoof
     */
    __mixin( request )
    {
        this._request = request;
    },


    /**
     * Set request options to spoof session
     *
     * @param {Object} options request options
     * @param {string} method  HTTP method
     * @param {string} data    request data
     *
     * @return {Object} request headers
     */
    'virtual abstract override public setOptions'( options, method, data )
    {
        const cookie = this._request.getSessionIdName() + '=' +
            this._request.getSessionId();

        options.headers = {
            'User-Agent':      this._request.getUserAgent(),
            'X-Forwarded-For': this._request.getRemoteAddr(),
            'Cookie':          cookie,
        };

        return this.__super( options, method, data );
    }
} );
