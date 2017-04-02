/**
 * Daemon class
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

var AbstractClass = require( 'easejs' ).AbstractClass,

    liza    = require( '../..' ),
    sys     = require( 'util' ),
    sprintf = require( 'php' ).sprintf;


/**
 * Facade handling core logic for the daemon
 *
 * TODO: Factor out unrelated logic
 */
module.exports = AbstractClass( 'Daemon',
{
    /**
     * Quote server port
     * @type {number}
     */
    'private _httpPort': 0,

    /**
     * Server to accept HTTP requests
     * @type {HttpServer}
     */
    'private _httpServer': null,

    /**
     * Path to access log
     * @var {string}
     */
    'private _accessLogPath': '',

    /**
     * Path to debug log
     * @var {string}
     */
    'private _debugLogPath': '',

    /**
     * Access logger
     * @type {AccessLog}
     */
    'private _accessLog': null,

    /**
     * Debug logger
     * @type {DebugLog}
     */
    'private _debugLog': null,

    /**
     * Encryption service
     * @type {EncryptionService}
     */
    'private _encService': null,

    /**
     * Memcache client
     * @type {Object}
     */
    'private _memcache': null,

    /**
     * Routers to use to handle user requests, ordered from most likely to be
     * used to least for performance reasons
     *
     * @type {Array.<Object>}
     */
    'private _routers': null,

    /**
     * Rating service
     * @type {Object}
     */
    'private _rater': null,


    'public __construct': function( http_port, log_priority )
    {
        this._httpPort = http_port;

        this._rater      = liza.server.rater.service;
        this._httpServer = this.getHttpServer();
        this._accessLog  = this._createAccessLog();
        this._debugLog   = this._createDebugLog( log_priority );
        this._encService = this.getEncryptionService();
        this._memcache   = this.getMemcacheClient();
        this._routers    = this.getRouters();
    },


    /**
     * Starts initializing the daemon
     *
     * @return {undefined}
     */
    'public start': function()
    {
        var _self = this;

        this._debugLog.log( this._debugLog.PRIORITY_IMPORTANT,
            "Access log path: %s", this._accessLogPath
        );

        this._debugLog.log( this._debugLog.PRIORITY_IMPORTANT,
            "Debug log path: %s", this._debugLogPath
        );

        this._initSignalHandlers();
        this._testEncryptionService( function()
        {
            _self._memcacheConnect();
            _self._initMemoryLogger();

            _self._initRouters();
            _self._initHttpServer( function()
            {
                _self._initUncaughtExceptionHandler();

                // ready to roll
                _self._debugLog.log( _self._debugLog.PRIORITY_INFO,
                    "Daemon initialization complete."
                );
            } );
        } );
    },


    'protected getDebugLog': function()
    {
        return this._debugLog;
    },


    'protected getHttpServer': function()
    {
        return require( './http_server' );
    },


    'protected getAccessLog': function()
    {
        return liza.server.log.AccessLog;
    },


    'protected getPriorityLog': function()
    {
        return liza.server.log.PriorityLog;
    },


    'protected getProgramController': function()
    {
        var controller = require( './controller' );
        controller.rater = this._rater;

        return controller;
    },


    'protected getScriptsController': function()
    {
        return require( './scripts' );
    },


    'protected getClientErrorController': function()
    {
        return require( './clienterr' );
    },


    'protected getUserRequest': function()
    {
        return liza.server.request.UserRequest;
    },


    'protected getUserSession': function()
    {
        return liza.server.request.UserSession;
    },


    'protected getMemcacheClient': function()
    {
        var MemcacheClient    = require( 'memcache/lib/memcache' ).Client,
            ResilientMemcache = liza.server.cache.ResilientMemcache,

            memc = ResilientMemcache(
                new MemcacheClient(
                    process.env.MEMCACHE_PORT || 11211,
                    process.env.MEMCACHE_HOST || 'localhost'
                )
            );

        var _self = this;

        memc
            .on( 'preConnect', function()
            {
                _self._debugLog.log( _self._debugLog.PRIORITY_IMPORTANT,
                    'Connecting to memcache server...'
                );
            } )
            .on( 'connect', function()
            {
                _self._debugLog.log( _self._debugLog.PRIORITY_IMPORTANT,
                    'Connected to memcache server.'
                );
            } )
            .on( 'connectError', function( e )
            {
                _self._debugLog.log( _self._debugLog.PRIORITY_ERROR,
                    'Failed to connect to memcached: %s',
                    e.message
                );
            } )
            .on( 'queuePurged', function( n )
            {
                _self._debugLog.log( _self._debugLog.PRIORITY_ERROR,
                    'Memcache request queue (size %d) purged!',
                    n
                );
            } )
            .on( 'error', function( e )
            {
                _self._debugLog.log( _self._debugLog.PRIORITY_ERROR,
                    'Memcache error: %s',
                    e.message
                );
            } );

        return memc;
    },


    'abstract protected getEncryptionService': [],


    'protected getRouters': function()
    {
        return [
            this.getProgramController(),
            this.getScriptsController(),
            this.getClientErrorController(),
        ];
    },


    /**
     * Perform a graceful shutdown
     *
     * @param {string} signal the signal that caused the shutdown
     *
     * @return {undefined}
     */
    'protected shutdown': function( signal )
    {
        this._debugLog.log( this._debugLog.PRIORITY_IMPORTANT,
            "Received %s. Beginning graceful shutdown...",
            signal
        );

        this._debugLog.log( this._debugLog.PRIOIRTY_IMPORTANT,
            "Closing HTTP server..."
        );
        this._httpServer.close();

        this._debugLog.log( this._debugLog.PRIORITY_IMPORTANT,
            "Shutdown complete. Exiting..."
        );

        process.exit();
    },


    'private _createAccessLog': function()
    {
        this._accessLogPath =
            ( process.env.LOG_PATH_ACCESS || '/var/log/node/access.log' );

        return this.getAccessLog()( this._accessLogPath );
    },


    'private _createDebugLog': function( log_priority )
    {
        this._debugLogPath =
            ( process.env.LOG_PATH_DEBUG || '/var/log/node/debug.log' );

        return this.getPriorityLog()(
            this._debugLogPath,
            ( process.env.LOG_PRIORITY || log_priority )
        );
    },


    /**
     * Catches and logs uncaught exceptions to prevent early termination
     *
     * @return {undefined}
     */
    'private _initUncaughtExceptionHandler': function()
    {
        var _self = this;

        // chances are, we don't want to crash; we are, after all, a webserver
        process.on( 'uncaughtException', function( err )
        {
            _self._debugLog.log( _self._debugLog.PRIORITY_ERROR,
                "Uncaught exception: %s\n%s",
                err,
                ( err.stack ) ? err.stack : '(No stack trace)'
            );

            // should we terminate on uncaught exceptions?
            if ( process.env.NODEJS_UCE_TERM )
            {
                _self._debugLog.log( _self._debugLog.PRIORITY_ERROR,
                    "NODEJS_UCE_TERM set; terminating..."
                );

                // SIGINT
                process.kill( process.pid );
            }
        });

        // notify the user of the UCE_TERM flag is set
        if ( process.env.NODEJS_UCE_TERM )
        {
            this._debugLog.log( 1,
                "NODEJS_UCE_TERM set; " +
                "will terminate on uncaught exceptions."
            );
        }
    },


    'private _initSignalHandlers': function()
    {
        var _self = this;

        // graceful shutdown on SIGINT and SIGTERM (cannot catch SIGKILL)
        try
        {
            process
                .on( 'SIGHUP', function()
                {
                    _self._debugLog.log( _self._debugLog.PRIORITY_IMPORTANT,
                        "SIGHUP received; requesting reload"
                    );

                    _self.getProgramController().reload();
                } )
                .on( 'SIGINT', function()
                {
                    _self.shutdown( 'SIGINT' );
                } )
                .on( 'SIGTERM', function()
                {
                    _self.shutdown( 'SIGTERM' );
                } );
        }
        catch ( e )
        {
            console.log( "note: signal handling unsupported on this OS" );
        }
    },


    'private _testEncryptionService': function( callback )
    {
        var enc_test = 'test string',
            _self    = this;

        this._debugLog.log( this._debugLog.PRIORITY_INFO,
            "Performing encryption service sanity check..."
        );

        // encryption sanity check to ensure we won't end up working with data
        // that will only become corrupt
        this._encService.encrypt( enc_test, function( data )
        {
            _self._encService.decrypt( data, function( data )
            {
                if ( enc_test !== data.toString( 'ascii' ) )
                {
                    _self._debugLog.log( _self._debugLog.PRIORITY_ERROR,
                        "Encryption service is incompetant. Aborting."
                    );
                    process.exit( 1 );
                }

                _self._debugLog.log( _self._debugLog.PRIORITY_INFO,
                    "Encryption service sanity check passed."
                );

                callback();
            } );
        } );
    },


    /**
     * Attempts to make connection to memcache server
     *
     * @param memcache.Client memcache client to connect to server
     *
     * @return undefined
     */
    'private _memcacheConnect': function()
    {
        try
        {
            this._memcache.connect();
        }
        catch( err )
        {
            this._debugLog.log( this._debugLog.PRIORITY_ERROR,
                "Failed to connected to memcached server: %s",
                err
            );
        }
    },


    'private _initMemoryLogger': function()
    {
        var _self = this;

        // log memory usage (every 15 min)
        setInterval( function()
        {
            _self._debugLog.log( _self._debugLog.PRIORITY_IMPORTANT,
                'Memory usage: %s MB (rss), %s/%s MB (V8 heap)',
                ( process.memoryUsage().rss / 1024 / 1024 ).toFixed( 2 ),
                ( process.memoryUsage().heapUsed / 1024 / 1024 ).toFixed( 2 ),
                ( process.memoryUsage().heapTotal / 1024 / 1024 ).toFixed( 2 )
            );
        }, 900000 );
    },


    'private _initRouters': function()
    {
        var _self = this;

        // initialize each router
        this._routers.forEach( function( router )
        {
            if ( router.init instanceof Function )
            {
                router.init( _self._debugLog, _self._encService );
            }
        });
    },


    'private _initHttpServer': function( callback )
    {
        var _self = this;

        /**
         * Builds UserRequest from the provided request and response objects
         *
         * @param {HttpServerRequest} request
         * @param {HttpServerResponse} response
         *
         * @return {UserRequest} instance to represent current request
         */
        function request_builder( request, response )
        {
            return _self.getUserRequest()(
                request,
                response,
                function( sess_id )
                {
                    // build a new user session from the given session id
                    return _self.getUserSession()( sess_id, _self._memcache );
                }
            );
        }

        // create the HTTP server and listen for connections
        try
        {
            this._httpServer = this.getHttpServer().create(
                this._routers,
                request_builder,
                this._accessLog,
                this._debugLog
            );

            this._httpServer.listen( this._httpPort, function()
            {
                _self._debugLog.log(
                    1, "Server running on port %d", _self._httpPort
                );

                callback();
            } );
        }
        catch( err )
        {
            this._debugLog.log( this._debugLog.PRIORITY_ERROR,
                "Unable to start HTTP server: %s",
                err
            );

            // exit with an error
            process.exit( 1 );
        }
    },
} );

