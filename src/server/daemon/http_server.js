/**
 * Liza HTTP server
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
 *
 * Also called the "quote server".
 *
 * This is ancient---it's an evolution of the first prototype written for
 * liza's server, and has barely evolved since then.
 */

var http = require( 'http' );


exports.create = function( routers, request_builder, access_log, debug_log )
{
    return log_server( http.createServer( function( request, response )
    {
        // easy request/response management
        var user_request = request_builder( request, response );

        // log this request to the access log
        access_log.attach( user_request );

        // process the request when it's ready (all data is available)
        user_request.on( 'ready', function()
        {
            var routed = false;
            Promise.all(
                routers.map( function( router )
                {
                    return router.route( user_request, debug_log );
                } )
            ).then( function( routed )
            {
                var was_routed = routed.some( function( handled )
                {
                    return handled === true;
                } );

                // display a 404 if we weren't able to route the request
                if ( !was_routed )
                {
                    return_404( user_request );
                }
            } );
        });
    }), debug_log );
};


function return_404( response )
{
    response.setResponseCode( 404 );
    response.end( '404 Not found.' );
}


/**
 * Enables logging on the server
 *
 * @param {HttpServer}     server    server on which to enable logging
 * @param {PriorityLogger} debug_log logger to use
 *
 * @return {HttpServer}
 */
function log_server( server, debug_log )
{
    server
        .on( 'connection', function( stream )
        {
            /** this is useless until not behind a proxy, since the IP address
             * is always the same
            debug_log.log( debug_log.PRIORITY_SOCKET,
                'HTTP connection received from %s',
                stream.remoteAddress
            );
            */

            // log errors on the connection
            stream.on( 'error', function( exception )
            {
                debug_log.log( debug_log.PRIORITY_SOCKET,
                    'HTTP server connection error on %s: %s',
                    stream.remoteAddress,
                    exception
                );
            });
        })
        .on( 'close', function( errno )
        {
            debug_log.log( debug_log.PRIORITY_SOCKET,
                "HTTP server connection closed."
            );
        })
        .on( 'clientError', function( exception )
        {
            debug_log.log( debug_log.PRIORITY_SOCKET,
                'HTTP client connection error: %s',
                exception
            );
        });

    return server;
}

