/**
 * ResilientMemcache class
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

var Class        = require( 'easejs' ).Class,
    EventEmitter = require( 'events' ).EventEmitter;


/**
 * Wraps the crappy memcache client implementation that we're using and
 * automatically queues requests and reconnects on connection failure.
 *
 * Note that this only implements the methods that we actually use---in
 * particular, connect(), get() and set().
 */
module.exports = Class( 'ResilientMemcache' )
    .extend( EventEmitter,
{
    /**
     * Memcache client
     * @type {MemcacheClient}
     */
    'private _memcache': null,

    /**
     * Connection failure count (cleared on successful connection)
     * @type {number}
     */
    'private _fail_count': 0,

    /**
     * Number of failures before request queue is purged
     * @type {number}
     */
    'private _fail_limit': 5,

    /**
     * Queue of pending requests (in case of a connection failure)
     * @type {Object}
     */
    'private _queue': [],

    /**
     * Connection state
     * @type {boolean}
     */
    'private _connected': false,


    /**
     * Initialize decorator with existing memcache client instance
     *
     * The client is assumed to be disconnected from the server.
     *
     * @param {MemcacheClient} memcache   memcache client
     * @param {number}         fail_limit number of failed connection attempts
     *                                    before request queue is purged
     */
    __construct: function( memcache, fail_limit )
    {
        this._memcache = memcache;
        this._failHook();

        this._connected = false;

        // keep default unless set
        if ( fail_limit )
        {
            this._fail_limit = +fail_limit;
        }
    },


    /**
     * Attempts to connect to memcached
     *
     * The continuation is passed null if the connection is successful;
     * otherwise, it will be passed an exception.
     *
     * If retry is ommitted or true, then a connection will be repeatedly
     * attempted until a successful connection is made. There is currently no
     * way to cancel this retry, as we have no use for such a feature at
     * present. Note that, regardless of this setting, a reconnect will *always*
     * be retried if an established connection is broken.
     *
     * @param {function(*)} callback continuation to invoke on connect/error
     * @param {boolean}     retry    retry on error (default true)
     *
     * @return {ResilientMemcache} self
     */
    'public connect': function( callback, retry )
    {
        var _self = this,
            memc  = this._memcache;

        callback = callback || function() {};
        retry    = ( retry === undefined ) ? true : false;

        function cok()
        {
            memc.removeListener( 'error', cfail );
            callback( null );

            _self._connectSuccess();
        };

        function cfail( e )
        {
            memc.removeListener( 'connect', cok );
            _self._connectFailure( e );

            // re-try the connection attempt unless it has been requested that
            // we do not
            retry && _self._reconn( true );

            callback( e );
        };

        this.emit( 'preConnect' );

        try
        {
            // for good measure, otherwise the connect event will not be kicked
            // off
            this._connected = false;
            memc.close();

            memc
                .once( 'connect', cok )
                .once( 'error', cfail );

            memc.connect();
        }
        catch ( e )
        {
            memc.removeListener( 'error', cfail );
            cfail( e );
        }

        return this;
    },


    /**
     * Retrieve data; enqueue request if disconnected
     *
     * On success, the continuation will be passed the value associated with the
     * given key; otherwise, it will be passed null to indicate a failure.
     *
     * @param {string}           key      lookup key
     * @param {function(string)} callback success/failure continuation
     *
     * @return {ResilientMemcache} self
     */
    'public get': function( key, callback )
    {
        this._do( 'get', 1, arguments );
        return this;
    },


    /**
     * Set the value of a key; enqueue request if disconnected
     *
     * On failure, the continuation will be passed null; otherwise, its value is
     * undefined.
     *
     * @param {string}      key      key to set
     * @param {string}      value    key value
     * @param {function(*)} callback success/failure continuation
     * @param {number}      lifetime key lifetime (see memcache docs)
     * @param {number}      flags    see memcache docs
     *
     * @return {ResilientMemcache} self
     */
    'public set': function( key, value, callback, lifetime, flags )
    {
        this._do( 'set', 2, arguments );
        return this;
    },


    /**
     * Perform client action, enqueing if disconnected
     *
     * If connected, the request will be performed immediately.
     *
     * If an enqueued request is re-attempted and would be enqueued a second
     * time, it will immediately fail and invoke the original caller's
     * continuation with the value null.
     *
     * @param {string}    method memcache client method
     * @param {number}    cidx   caller continuation argument index
     * @param {arguments} args   caller arguments to re-attmempt on method
     *
     * @return {undefined}
     */
    'private _do': function( method, cidx, args )
    {
        var callback = args[ cidx ];

        if ( this._connected === false )
        {
            var _self = this;
            this._enqueue( callback, function()
            {
                // we do not want to do this a second time.
                args[ cidx ] = function()
                {
                    // if this gets called, then that means that we've been
                    // enqueued a second time, implying that we have
                    // disconnected yet again...give up to prevent a perpetual
                    // song and dance that would make anyone's ears and eyes
                    // bleed
                    callback( null );
                };

                // re-try with our new callback
                _self[ method ].apply( _self, args );
            } );

            return;
        }

        this._memcache[ method ].apply( this._memcache, args );
    },


    /**
     * Attempt reconnection
     *
     * Will continuously recurse with a delay until a connection is established.
     * The delay is not currently configurable.
     *
     * This method will, by default, do nothing if disconnect (this is to ensure
     * that reconnections are not spammed); in order to attempt to reconnect
     * while already disconnected, use the force parameter.
     *
     * @param {boolean} force take action
     *
     * @return {undefined}
     */
    'private _reconn': function( force )
    {
        var _self = this;

        // if we're not connected, then ignore this; we're already taking
        // care of the issue
        if ( !force && ( _self._connected === false ) )
        {
            return;
        }

        // attempt to reconnect
        _self.connect( function( err )
        {
            if ( err === null )
            {
                // we're good
                return;
            }

            // this is no good; try again shortly
            setTimeout( function()
            {
                _self._reconn( true );
            }, 1000 );
        }, false );
    },


    /**
     * Hook memcache client to report errors and attempt reconnects
     *
     * On connection close or timeout, a connection will automatically be
     * reattempted. In the case of an error, it will be bubbled up to be
     * reported via an event, but will not constitute a connection failure.
     *
     * @return {undefined}
     */
    'private _failHook': function()
    {
        var _self  = this,
            reconn = this._reconn.bind( this );

        this._memcache
            .on( 'close', reconn )
            .on( 'timeout', reconn )

            .on( 'error', function( e )
            {
                // if we're not yet connected, then all errors will be
                // considered connection errors, which we will handle separately
                if ( _self._connected )
                {
                    _self.emit( 'error', e );
                }
            } );
    },


    /**
     * Enqueue a request to be re-attempted once a memcached connection is
     * re-established
     *
     * The orginal caller's callback continuation is only useful for aborting
     * requests; the retry continuation is used to re-attempt the original
     * request.
     *
     * @param {function(*)} callback original caller continuation
     * @param {function()}  retry    retry continuation
     *
     * @return {undefined}
     */
    'private _enqueue': function( callback, retry )
    {
        this._queue.push( [ callback, retry ] );
    },


    /**
     * Purges the request queue, aborting all requests
     *
     * Immediately invokes the original request's continuation with the value
     * null to indicate a failure. This should be called periodically to ensure
     * that requests do not stall for too long.
     *
     * If the queue has entries, then this will result in the queuedPurged event
     * being raised with the number of requests that were purged.
     *
     * This is the worst-case scenerio.
     *
     * @return {undefined}
     */
    'private _purgeQueue': function()
    {
        var cur,
            n = this._queue.length;

        // do not purge a queue with nothing in it
        if ( n === 0 )
        {
            return;
        }

        // oh nooooo
        while ( cur = this._queue.shift() )
        {
            // invoke the continuation with a null to indicate a failure
            cur[ 0 ]( null );
        }

        // in case anyone cares that we just told everyone to fuck off
        this.emit( 'queuePurged', n );
    },


    /**
     * Re-attemped all enqueued requests
     *
     * This should be invoked when a connection is re-established to memcache.
     * The end result is that the original request receives the data they
     * requested (assuming that nothing else goes wrong) with nothing more than
     * an additional delay.
     *
     * @return {undefined}
     */
    'private _processQueue': function()
    {
        var cur;

        // yay...daises and butterflies...
        while ( cur = this._queue.shift() )
        {
            // give it another try
            cur[ 1 ]();
        }
    },


    /**
     * Invoked when a connection is successfully established with memcached
     *
     * This will raise the connect event, clear the connection failure count and
     * begin processing the request queue.
     *
     * @return {undefined}
     */
    'private _connectSuccess': function()
    {
        this._fail_count = 0;
        this._connected  = true;

        this.emit( 'connect' );

        // empty the queue
        this._processQueue();
    },


    /**
     * Invoked when a memcached connection attempt fails
     *
     * This will raise the connectionError event and increment the failure
     * count; if this count reaches the failure limit, then the count will be
     * reset and the request queue purged, preventing requests from lingering
     * for too long.
     *
     * Note that this consequently implies a *maximum* time of delay * limit in
     * the queue; a request could potentially be purged from the queue
     * immediately after it is made. No attempt is made to ensure queue time,
     * since a failure count implies that we are having difficulty reconnecting.
     *
     * @return {undefined}
     */
    'private _connectFailure': function( e )
    {
        this._connected = false;

        this.emit( 'connectError', e );

        // if we have reached our reconnect attempt limit, then purge the queue
        // to ensure that requests are not stalling for too long
        if ( ++this._fail_count === this._fail_limit )
        {
            this._purgeQueue();
            this._fail_count = 0;
        }
    }
} );
