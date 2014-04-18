/**
 * HTTP protocol implementation
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

var Interface = require( 'easejs' ).Interface;


/**
 * HTTP protocol implementation that will perform the actual transfer. This
 * abstraction allows use of whatever library the user prefers (e.g.
 * XMLHttpRequest, jQuery, etc).
 */
module.exports = Interface( 'HttpImpl',
{
    /**
     * Perform HTTP request
     *
     * If the request is synchronous, it must still return the data via the
     * provided callback. The provided data is expected to be key-value if an
     * object is given, otherwise a string of binary data.
     *
     * An implementation is not required to implement every HTTP method,
     * although that is certainly preferred; a user of the API is expected to
     * know when an implementation does not support a given method.
     *
     * @param {string}                  url      destination URL
     * @param {string}                  method   RFC-2616-compliant HTTP method
     * @param {Object|string}           data     request params
     * @param {function(Error, Object)} callback server response callback
     *
     * @return {HttpImpl} self
     */
    'public requestData': [ 'url', 'method', 'data', 'callback' ]
} );
