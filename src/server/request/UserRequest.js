/**
 * UserRequest class
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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
 * Encapsulates user request and response data in an easy-to-use class
 *
 * This class doesn't really add any new functionality. It just makes working
 * with requests and responses a bit easier.
 */
module.exports = Class.extend( require( 'events' ).EventEmitter,
{
    /**
     * Request timeout in seconds
     *
     * In the future, we can make this configurable. Currently, it's
     * unnecessary. Feel free to add such a feature if you have need for it.
     *
     * @type {number}
     */
    'const TIMEOUT': 120,

    /**
     * Requested URI
     * @var String
     */
    uri: '',

    /**
     * Query (GET vars)
     * @var {Object}
     */
    query: {},

    /**
     * Request object
     * @var http.ServerRequest
     */
    request: null,

    /**
     * Response object
     * @var http.ServerResponse
     */
    response: null,

    /**
     * Contains post data, when available
     * @var undefined|Object
     */
    postData: undefined,

    /**
     * Functions to call when post data is available
     * @var Array
     */
    postDataCallbacks: [],

    /**
     * HTTP status code to respond with (default 200 OK)
     * @var Integer
     */
    responseCode: 200,

    /**
     * HTTP MIME Content type (text/html by default)
     * @var String
     */
    contentType: 'text/html; charset=utf-8',

    /**
     * Headers to send
     * @var {Object}
     */
    headers: {},

    /**
     * Whether the headers have been sent
     * @var Boolean
     */
    headersSent: false,

    /**
     * Length of response
     *
     * @var Integer
     */
    responseLength: 0,

    /**
     * User's session
     * @var UserSession
     */
    session: null,

    /**
     * Timer that will cause a timeout after TIMEOUT seconds
     * @type {!number}
     */
    'private _timeout': null,


    /**
     * String representation of object
     *
     * @return String
     */
    toString: function()
    {
        return '[object UserRequest]';
    },


    /**
     * Constructor
     *
     * @return undefined
     */
    __construct: function( request, response, session_builder )
    {
        var request_data = require( 'url' ).parse( request.url, true );

        this.uri      = request_data.pathname;
        this.query    = request_data.query || {};
        this.request  = request;
        this.response = response;

        this._initRequestPost();

        // "session key" used internally for certain scripts
        var skey = this.query.skey;

        // initialize session
        var _self = this;
        this.session = session_builder( this.getCookies().PHPSESSID )
            .on( 'ready', function( data )
            {
                // if no data is available, then the session could not be
                // initialized; abort the request :( (this should be ignored if
                // a session key is provided, since in that case we do not care
                // about a session)
                if ( ( data === null ) && !skey )
                {
                    _self.setResponseCode( 500 );
                    _self.end( 'Session initialization failure.' );

                    return;
                }

                // now we're ready to roll
                _self.emit( 'ready' );
            } );

        // set timeout in the event we fail to respond due to some bug/uncaught
        // exception/etc
        this._timeout = setTimeout(
            function()
            {
                _self.setResponseCode( 408 );
                _self.end( 'Request timed out.' );
            },
            ( this.__self.$( 'TIMEOUT' ) * 1000 )
        );
    },


    /**
     * Watches for post data and returns the data to any waiting callbacks
     *
     * @return undefined
     */
    _initRequestPost: function()
    {
        var querystring = require( 'querystring' ),
            post_raw    = '',
            request     = this;

        this.request
            .addListener( 'data', function( data )
            {
                post_raw += data;
            })
            .addListener( 'end', function()
            {
                request.postData = querystring.parse( post_raw );

                // call any callbacks that are waiting for the data
                var func = null;
                while ( func = request.postDataCallbacks.pop() )
                {
                    func.call( request, request.postData );
                }
            });
    },


    /**
     * Performs general initialization tasks (template method)
     *
     * @return undefined
     */
    _init: function( session_builder )
    {
        var request = this;

        this._initRequestPost();

    },


    /**
     * Returns the requested URI
     *
     * @return String requested URI
     */
    getUri: function()
    {
        return this.uri;
    },


    /**
     * Returns query (GET) data
     *
     * @return Object GET data
     */
    getGetData: function()
    {
        return this.query;
    },


    /**
     * Requests the post data
     *
     * This is asynchronous. If the data is already available, the callback will
     * be called immediately. If the data is not yet available, it will be
     * called as soon as it becomes available.
     *
     * @param Function( data ) callback function to call when data is available
     *
     * @return UserRequest self to allow for method chaining
     */
    getPostData: function( callback )
    {
        // if we already have the post data, give it to them immediately
        if ( this.postData !== undefined )
        {
            callback.call( this, this.postData );
            return this;
        }

        // otherwise, we need to call the callback when the data is available
        this.postDataCallbacks.push( callback );
        return this;
    },


    /**
     * Sets the HTTP status code to respond with
     *
     * @param Integer code HTTP status code
     *
     * @return UserRequest self
     */
    setResponseCode: function( code )
    {
        if ( this.headersSent === true )
        {
            console.error( 'Headers already sent; response code not set' );
            return this;
        }

        this.responseCode = +code;
        return this;
    },


    /**
     * Returns the HTTP status code sent to the client
     *
     * @return Integer HTTP status code
     */
    getResponseCode: function()
    {
        return this.responseCode;
    },


    /**
     * Sets the content type
     *
     * @param String type content type
     *
     * @return UserRequest self
     */
    setContentType: function( type )
    {
        this.contentType = ''+type;
        return this;
    },


    /**
     * Sets HTTP headers to send to the client
     *
     * The headers provided will be merged with any existing headers. They will
     * be overwritten if they have already been set.
     *
     * @param {Object} data headers to set (key-value)
     *
     * @return {UserRequest} self
     */
    setHeaders: function( data )
    {
        for ( header in data )
        {
            this.headers[ header ] = data[ header ];
        }

        return this;
    },


    /**
     * Tells the client not to cache the response
     *
     * @return {UserRequest} self
     */
    noCache: function()
    {
        // the first two are for IE6, the others are HTTP/1.0
        this.headers[ 'Cache-Control' ] =
            'private, max-age=0, no-store, no-cache, must-revalidate, ' +
                'post-check=0, pre-check=0';

        return this;
    },


    /**
     * Send headers to the client
     *
     * @return undefined
     */
    _sendHeaders: function()
    {
        this.headers[ 'Content-Type' ] = this.contentType;

        this.response.writeHead( this.responseCode, this.headers );
        this.headersSent = true;

        // we don't need this function anymore
        this._sendHeaders = function() {}
    },


    /**
     * Write data to the client
     *
     * @param String chunk    data to write
     * @param String encoding
     *
     * @return UserRequest self
     */
    write: function( chunk, encoding )
    {
        encoding = encoding || 'utf8';

        this.responseLength += chunk.length;

        this._sendHeaders();
        this.response.write( chunk, encoding );

        return this;
    },


    error: function( error, data, encoding )
    {
        this.setResponseCode( 503 );
        this.end(
            JSON.stringify( {
                error: error,
                data: data
            } ),
            encoding
        );
    },


    tryAgain: function( data, encoding )
    {
        this.setResponseCode( 503 );
        this.end(
            JSON.stringify( {
                error: 'EAGAIN',
                data: data
            } ),
            encoding
        );
    },


    ok: function( data, encoding )
    {
        this.setResponseCode( 200 );
        this.end(
            JSON.stringify( {
                error: null,
                data:  data,
            } )
        );
    },


    accepted: function( data, encoding )
    {
        this.setResponseCode( 202 );
        this.end(
            JSON.stringify( {
                error: null,
                data:  data,
            } )
        );
    },


    /**
     * End client response
     *
     * @param String chunk    data to write
     * @param String encoding
     *
     * @return UserRequest self
     */
    end: function( data, encoding )
    {
        data = data || '';

        clearTimeout( this._timeout );
        this._timeout = null;

        this.responseLength += data.length;

        this._sendHeaders();
        this.response.end( data, encoding );

        this.emit( 'end' );

        return this;
    },


    /**
     * Returns the length of the response
     *
     * Note that this is not very accurate, as this doesn't take into account
     * multi-byte characters.
     *
     * @return Integer response length
     *
     * @todo multibyte
     */
    getResponseLength: function()
    {
        return this.responseLength;
    },


    /**
     * Returns request cookies as an object
     *
     * @return Object request cookies
     */
    getCookies: function()
    {
        var cookies     = {},
            cookie_data = this.request.headers.cookie;

        if ( cookie_data === undefined )
        {
            return {};
        }

        // parse the cookies into an easily accessible object
        cookie_data.split( ';' ).forEach( function( val )
        {
            var data = val.split( '=', 2 );
            cookies[ data[0].trim() ] = data[1];
        });

        // any future calls to this function will simply return the already
        // generated cookies array to save us some time
        this.getCookies = function()
        {
            return cookies;
        }

        return cookies;
    },


    /**
     * Returns the current session
     *
     * @return UserSession
     */
    getSession: function()
    {
        return this.session;
    },


    /**
     * Returns the request object
     *
     * @return http.ServerRequest
     */
    getRequest: function()
    {
        return this.request;
    },


    'public getRemoteAddr': function()
    {
        // since we may be proxied, let the proxy forward header take precidence
        return this.request.headers['x-forwarded-for']
            || this.request.connection.remoteAddress;
    },


    'public getUserAgent': function()
    {
        return this.request.headers['user-agent'];
    },


    'public getSessionId': function()
    {
        return this.getCookies().PHPSESSID || null;
    },


    'public getSessionIdName': function()
    {
        return 'PHPSESSID';
    }
} );

