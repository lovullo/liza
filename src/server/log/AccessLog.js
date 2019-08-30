/**
 * HTTP access log
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

var Class       = require( 'easejs' ).Class,
    UserRequest = require( '../request/UserRequest' );


/**
 * Logs HTTP access in Apache's combined log format
 */
module.exports = Class( 'AccessLog' )
    .extend( require( './Log' ),
{
    /**
     * Monitors a user request for the end of the connection and adds an entry
     * to the access log
     *
     * @param UserRequest user_request
     *
     * @return AccessLog self
     */
    'public attach': function( user_request )
    {
        if ( !( Class.isA( UserRequest, user_request ) ) )
        {
            throw new TypeError(
                'UserRequest expected, ' + ( user_request.toString() ) +
                ' given'
            );
        }

        var self    = this,
            request = user_request.getRequest();

        // log when the request is complete
        user_request.on( 'end', function()
        {
            // determine the remote address (in case we're behind a proxy, look
            // at X-Forwarded-For)
            var remote_addr = user_request.getRemoteAddr(),
                username = user_request.getSession().agentId() || '-';

            // access log (apache combined log format)
            self.write( '%s %s - - [%s] "%s %s HTTP/%s" %d %d "%s" "%s"',
                remote_addr,
                username,
                new Date(),
                request.method,
                request.url,
                request.httpVersion,
                user_request.getResponseCode(),
                user_request.getResponseLength(),
                request.headers['referer'] || '-',
                request.headers['user-agent'] || '-'
            );
        });

        return this;
    }
} );

