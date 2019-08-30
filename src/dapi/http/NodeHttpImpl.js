/**
 * HTTP over Node.js-compatible API
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
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

const { Class } = require( 'easejs' );
const HttpImpl  = require( './HttpImpl' );
const HttpError = require( './HttpError' );


/**
 * HTTP adapter using Node.js-compatible objects (e.g. its `http` modules)
 */
module.exports = Class( 'NodeHttpImpl' )
    .implement( HttpImpl )
    .extend(
{
    /**
     * Clients for desired protocols (e.g. HTTP(s))
     * @type {Object}
     */
    'private _protoHandlers': {},

    /**
     * URL parser
     * @type {url}
     */
    'private _urlParser': '',

    /**
     * Request origin
     * @type {string}
     */
    'private _origin': '',


    /**
     * Initialize with protocol handlers and URL parser
     *
     * `proto_handlers` must be a key-value mapping of the protocol string
     * to a handler object conforming to Node's http(s) APIs---that is, it
     * should provide a `#request` method.
     *
     * `origin` is prepended to all request URLs.
     *
     * @param {Object} proto_handlers protocol handler key-value map
     * @param {Object} url_parser     URL parser
     * @param {string} origin         request origin
     */
    constructor( proto_handlers, url_parser, origin )
    {
        this._protoHandlers = proto_handlers;
        this._urlParser     = url_parser;
        this._origin        = ( origin !== undefined ) ? ''+origin : '';
    },


    /**
     * Perform HTTP request
     *
     * If the request is synchronous, it must still return the data via the
     * provided callback. The provided data is expected to be key-value if an
     * object is given, otherwise a string of binary data.
     *
     * @param {string}                    url      destination URL
     * @param {string}                    method   RFC-2616-compliant HTTP method
     * @param {Object|string}             data     request params
     * @param {function(?Error, ?string)} callback server response callback
     *
     * @return {HttpImpl} self
     */
    'virtual public requestData'( url, method, data, callback )
    {
        const options  = this._parseUrl( url );
        const protocol = options.protocol.replace( /:$/, '' );
        const handler  = this._protoHandlers[ protocol ];

        if ( !handler )
        {
            throw Error( `No handler for ${protocol}` );
        }

        this.setOptions( options, method, data );

        let forbid_end = false;

        const req = handler.request( options, res =>
        {
            let data = '';

            res.on( 'data', chunk => data += chunk );
            res.on( 'end', () =>
                !forbid_end && this.requestEnd( res, data, callback )
            );
        } );

        req.on( 'error', e =>
        {
            this.serveError( e, null, null, callback );

            // guarantee that the callback will not be invoked a second time
            // if something tries to end the request
            forbid_end = true;
        } );

        if ( method === 'POST' )
        {
            req.write( data );
        }

        req.end();
    },


    /**
     * Parse given URL
     *
     * If the URL begins with a slash, the origin is prepended.
     *
     * @param {string} url URL
     *
     * @return {Object} parsed URL
     */
    'private _parseUrl'( url )
    {
        const origin = ( url[ 0 ] === '/' )
              ? this._origin
              : '';

        return this._urlParser.parse( origin + url );
    },


    /**
     * Set request options
     *
     * TODO: public to work around a class extension trait bug; make
     * protected once fixed
     *
     * @param {Object} options request options
     * @param {string} method  HTTP method
     * @param {string} data    request data
     *
     * @return {Object} request headers
     */
    'virtual public setOptions'( options, method, data )
    {
        const { headers = {} } = options;

        options.method = method;

        if ( method === 'POST' )
        {
            headers[ 'Content-Type' ] = 'application/x-www-form-urlencoded';

            options.headers = headers;
        }
        else
        {
            if ( data )
            {
                options.path += '?' + data;
            }
        }
    },



    /**
     * Invoked when a request is completed
     *
     * Subtypes may override this method to handle their own request
     * processing before the continuation `callback` is invoked with the
     * final data.
     *
     * To override only error situations, see `#serveError`.
     *
     * @param {Object}                   res      Node http.ServerResponse
     * @param {string}                   data     raw response data
     * @param {function(?Error,?string)} callback completion continuation
     *
     * @return {undefined}
     */
    'virtual protected requestEnd'( res, data, callback )
    {
        if ( !this.isSuccessful( res ) )
        {
            this.serveError(
                HttpError( res.statusMessage, res.statusCode ),
                res,
                data,
                callback
            );

            return;
        }

        callback( null, data );
    },


    /**
     * Predicate to determine whether HTTP request was successful
     *
     * Non-2xx status codes represent failures.
     *
     * @param {Object} res Node http.ServerResponse
     *
     * @return {boolean} whether HTTP status code represents a success
     */
    'virtual protected isSuccessful'( res )
    {
        return ( +res.statusCode >= 200 ) && ( +res.statusCode < 300 );
    },


    /**
     * Invoke continuation `callback` with an error `e`
     *
     * @param {Error}                  e        error
     * @param {Object}                 res      Node http.ServerResponse
     * @param {string}                 data     raw response data
     * @param {function(?Error,?data)} callback continuation
     *
     * @return {undefined}
     */
    'virtual protected serveError'( e, res, data, callback )
    {
        callback( e, data );
    },
} );
