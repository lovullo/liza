/**
 * Route controller
 *
 *  Copyright (C) 2017, 2018 R-T Specialty, LLC.
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
 * @todo this is a mess of routing and glue code
 */

const {
    Db: MongoDb,
    Server: MongoServer,
    Connection: MongoConnection,
} = require( 'mongodb/lib/mongodb' );

const regex_base = /^\/quote\/([a-z0-9-]+)\/?(?:\/(\d+)\/?(?:\/(.*))?|\/(program.js))?$/;
const regex_step = /^step\/(\d+)\/?(?:\/(post|visit))?$/;

const http   = require( 'http' );
const crypto = require( 'crypto' );

var server         = null;
var server_cache   = null;
var rating_service = null;

const {
    bucket: {
        QuoteDataBucket,
    },

    dapi: {
        http: {
            HttpDataApi,
            HttpDataApiUrlData,
            NodeHttpImpl,
            SpoofedNodeHttpImpl,
        },
        DataApiFactory,
        DataApiManager,
    },

    document: {
        DocumentProgramFormatter,
    },

    field: {
        FieldClassMatcher,
    },

    server: {
        DocumentServer,

        db: {
            MongoServerDao,
        },

        lock: {
            Semaphore,
        },

        quote: {
            ServerSideQuote: Quote,
            ProgramQuoteCleaner,
        },

        service: {
            export: {
                ExportService,
            },

            RatingService,
            RatingServicePublish,
            RatingServiceSubmitNotify,
            TokenedService,
            TokenDao,
        },

        request: {
            CapturedUserResponse,
            SessionSpoofHttpClient,
            UserResponse,
        },
    },

    store,
} = require( '../..' );

const amqplib = require( 'amqplib' );


// read and write locks, as separate semaphores
var rlock = Semaphore(),
    wlock = Semaphore();

// concurrent session flag
var sflag = {};


// TODO: kluge to get liza somewhat decoupled from lovullo (rating module)
exports.rater             = {};
exports.skey              = "";
exports.post_rate_publish = {};


exports.init = function( logger, enc_service, conf )
{
    var db = new MongoDb(
        'program',
        new MongoServer(
            process.env.MONGODB_HOST || '127.0.0.1',
                +process.env.MONGODB_PORT || MongoConnection.DEFAULT_PORT,
            { auto_reconnect: true }
        ),
        { native_parser: false, safe: false }
    );

    const dao = MongoServerDao( db );

    _createDocumentServer( dao, logger, enc_service, conf ).then( srv =>
    {
        server = srv;

        server_cache = _createCache( server );
        server.init( server_cache, exports.rater );

        // TODO: temporary proof-of-concept
        rating_service = RatingService.use(
            RatingServicePublish( amqplib, exports.post_rate_publish )
        )(
            logger, dao, server, exports.rater
        );

        // TODO: exports.init needs to support callbacks; this will work, but
        // only because it's unlikely that we'll get a request within
        // milliseconds of coming online
        _initExportService( db, function( service )
        {
            c1_export_service = service;
        } );

        server.on( 'quotePverUpdate', function( quote, program, event )
        {
            // let them know that we're going to be a moment
            var c = event.wait();

            getCleaner( program ).clean( quote, function( err )
            {
                // report on our success/failure
                if ( err )
                {
                    event.bad( err );
                }
                else
                {
                    event.good();
                }

                // we're done
                c();
            } );
        } );
    } );
}


function _createDocumentServer( dao, logger, enc_service, conf )
{
    const origin_url = process.env.HTTP_ORIGIN_URL || '';

    if ( !origin_url )
    {
        // this allows the system to work without configuration (e.g. for
        // local development), but is really bad
        logger.log( logger.PRIORITY_IMPORTANT,
            "*** HTTP_ORIGIN_URL environment variable not set; " +
            "system will fall back to using the origin of HTTP requests, " +
            "meaning an attacker can control where server-side requests go! ***"
        );
    }

    return DocumentServer()
        .create( dao, logger, enc_service, origin_url, conf );
}


function _initExportService( db, callback )
{
    db.collection( 'quotes', function( err, collection )
    {
        if ( collection === null )
        {
            return;
        }

        var spoof_host = (
            ''+(
                process.env.C1_EXPORT_HOST
                    || process.env.LV_RATE_DOMAIN
                    || process.env.LV_RATE_HOST
            ).trim()
        );

        var spoof =  SessionSpoofHttpClient( http, spoof_host );

        callback(
            ExportService
                .use( TokenedService(
                    'c1import',
                    TokenDao( collection ),
                    function tokgen()
                    {
                        var shasum = crypto.createHash( 'sha1' );
                        shasum.update( ''+Math.random() );

                        return shasum.digest( 'hex' );
                    },
                    function newcapturedResponse( request, callback )
                    {
                        return UserResponse
                            .use( CapturedUserResponse( callback ) )
                            ( request );
                    }
                ) )
                ( spoof )
        );

    } );
}


/**
 * Create server cache
 *
 * TODO: This needs to be moved elsewhere; it is a stepping-stone
 * kluge.
 *
 * @param {Server} server server containing miss methods
 *
 * @return {Store} cache
 */
function _createCache( server )
{
    const progjs_cache = store.MemoryStore.use(
        store.MissLookup( server.loadProgramFiles.bind( server ) )
    )();

    const step_prog_cache = store.MemoryStore.use(
        store.MissLookup( program_id => Promise.resolve(
            store.MemoryStore.use(
                store.MissLookup(
                    server.loadStepHtml.bind( server, program_id )
                )
            )()
        ) )
    )();

    const prog_cache = store.MemoryStore.use(
        store.MissLookup( server.loadProgram.bind( server ) )
    )();

    const cache = store.MemoryStore.use( store.Cascading )();
    cache.add( 'program_js', progjs_cache );
    cache.add( 'step_html',  step_prog_cache );
    cache.add( 'program',    prog_cache );

    return cache;
}


exports.reload = function()
{
    // will cause all steps, programs, etc to be reloaded on demand
    server_cache.clear();

    server.reload( exports.rater );
};


exports.route = function( request )
{
    var data;

    if ( !( data = request.getUri().match( regex_base ) ) )
    {
        // we don't handle this URI
        return Promise.resolve( false );
    }

    // we don't want to cache the responses, as most of them change with each
    // request
    request.noCache();

    var program_id = data[1];

    return server.getProgram( program_id )
        .then( function( program )
        {
            return new Promise( function( resolve, reject )
            {
                doRoute( program, request, data, resolve, reject );
            } );
        } );
}


function doRoute( program, request, data, resolve, reject )
{
    // store our data in more sensible vars
    var program_id = data[1],
        quote_id   = +data[2] || 0,
        cmd        = data[3] || data[4] || '',
        session = request.getSession();

    // if we were unable to load the program class, that's a problem
    if ( program === null )
    {
        server.sendError( request,
            'Internal error. Please contact our support team for ' +
                'support.' +
            '<br /><br />Your information has <em>not</em> been saved!'
        );

        resolve( true );
    }

    var skey = has_skey( request );

    // is the user currently logged in?
    if ( ( request.getSession().isLoggedIn() === false )
        && !skey
    )
    {
        // todo: this is temporary so we don't break our current setup; remove
        // this check once we can error out before we even get to this point
        // (PHP current handles the initial page load)
        if ( cmd !== 'program.js' )
        {
            session.setRedirect( '/quote/' + program_id + '/', function()
            {
                session.setReturnQuoteNumber( quote_id, function()
                {
                    // peoples are trying to steal our secrets!?!!?
                    server.sendError(
                        request,
                        'Please <a href="/login">click here</a> to log in.'
                    );
                } );
            } );

            resolve( true );
        }
    }

    // if the session key was provided, mark us as internal
    if ( skey )
    {
        request.getSession().setAgentId( '900000' );
    }

    // we'll be serving all our responses as plain text
    request.setContentType( 'text/plain' );

    if ( data = cmd.match( regex_step ) )
    {
        var step_id      = data[1];
        var step_action  = ( data[2] !== undefined ) ? data[2] : '';

        switch ( step_action )
        {
            case 'post':
                acquireWriteLock( quote_id, request, function()
                {
                    handleRequest( function( quote )
                    {
                        server.handlePost(
                            step_id, request, quote, program, session
                        );
                    } );
                } );
                break;

            case 'visit':
                acquireRwLock( quote_id, request, function()
                {
                    handleRequest( function( quote )
                    {
                        server.visitStep( step_id, request, quote );
                    } );
                } );
                break;

            default:
                // send the requested step to the client
                acquireReadLock( quote_id, request, function()
                {
                    handleRequest( function( quote )
                    {
                        server.sendStep(
                            request, quote, program, step_id, session
                        );
                    } );
                } );
                break;
        }
    }
    else if ( cmd == 'init' )
    {
        acquireWriteLock( quote_id, request, function()
        {
            handleRequest( function( quote )
            {
                server.sendInit(
                    request,
                    quote,
                    program,

                    // for invalid quote requests
                    createQuoteQuick,

                    // concurrent access?
                    getConcurrentSessionUser( quote_id, session )
                );
            } );
        } );
    }
    else if ( cmd == 'progdata' )
    {
        acquireReadLock( quote_id, request, function()
        {
            handleRequest( function( quote )
            {
                const response      = UserResponse( request );
                const bucket        = quote.getBucket();
                const class_matcher = FieldClassMatcher( program.whens );

                DocumentProgramFormatter( program, class_matcher )
                    .format( bucket )
                    .then( data => response.ok( data ) )
                    .catch( e => response.internalError( {}, e ) );
            } );
        } );
    }
    else if ( cmd === 'mkrev' )
    {
        // the database operation for this is atomic and disjoint from
        // anything else we're doing, so no need to acquire any sort of
        // lock
        handleRequest( function( quote )
        {
            server.createRevision( request, quote );
        } );
    }
    // TODO: diff against other revisions as well
    else if ( data = cmd.match( /^revdiffgrp\/(.*?)\/(\d+)$/ ) )
    {
        // similar to above; no locking needed
        handleRequest( function( quote )
        {
            var gid   = data[ 1 ] || '',
                revid = +data[ 2 ] || 0;

            server.diffRevisionGroup( request, program, quote, gid, revid );
        } );
    }
    else if ( cmd == 'program.js' )
    {
        // no quote involved; just send the JS
        server.sendProgramJs( request, program_id );
        resolve( true );
    }
    else if ( /^rate\b/.test( cmd ) )
    {
        // the client may have optionally requested the rate for a specific
        // alias
        var ratedata = cmd.match( /^rate(?:\/([a-z]+))?/ ),
            alias    = ratedata[ 1 ];

        // request manual lock freeing; allows us to free the lock when we
        // want to (since we'll be saving data to the DB async, after the
        // response is already returned)
        acquireWriteLock( quote_id, request, function( free )
        {
            // if we're performing deferred rating, it must be async;
            // immediately free the locks and trust that the deferred process
            // knows what it is doing and can properly handle such concurrency
            alias && free();

            handleRequest( function( quote )
            {
                var response = UserResponse( request );

                rating_service.request( request, response, quote, alias, function()
                {
                    // we're done; free the lock
                    free();
                } );
            } );
        }, true );
    }
    else if ( /^worksheet\//.test( cmd ) )
    {
        var wdata    = cmd.match( /^worksheet\/(.+)\/([0-9]+)/ ),
            supplier = wdata[ 1 ],
            index    = +wdata[ 2 ];

        handleRequest( function( quote )
        {
            rating_service.serveWorksheet( request, quote, supplier, index );
        } );
    }
    else if ( /^export\//.test( cmd ) )
    {
        var import_data = cmd.match( /^export\/(.+?)(?:\/(.+))?$/ ),
            type        = import_data[ 1 ],
            subcmd      = import_data[ 2 ];


        // TODO: extract body
        handleRequest( function( quote )
        {
            // TODO: support type
            c1_export_service.request(
                request,
                UserResponse( request ),
                quote,
                subcmd
            );
        } );
    }
    else if ( cmd === 'quicksave' )
    {
        // attempt to acquire the write lock, aborting immediately if we
        // cannot (instead of queueing)
        acquireWriteLockImmediate( quote_id, request, function( free )
        {
            handleRequest( function( quote )
            {
                // if we could not immediately obtain the lock, then something
                // is currently saving, meaning that the quicksave data is
                // probably irrelevant (since it would just be wiped out anyway
                // if we had issued this request moments earlier); abort
                if ( !free )
                {
                    server.sendEmptyReply( request, quote );
                    return;
                }

                server.handleQuickSave( request, quote, program );
            } );
        } );

        // keep the session alive
        touchSession( quote_id, session );
    }
    else if ( /^log\//.test( cmd ) )
    {
        // the "log" URI currently does absolutely nothing; ideally, we'd be
        // able to post to this and log somewhere useful, but for now it
        // just appears in the logs
        handleRequest( function( quote )
        {
            server.sendEmptyReply( request, quote );
        } );
    }
    else
    {
        resolve( false );
    }

    // create a quote to represent this request
    function handleRequest( operation )
    {
        createQuote( quote_id, program, request, operation, function( fatal )
        {
            // if fatal, notify the user and bail out
            if ( fatal )
            {
                // an error occurred; quote invalid
                server.sendError( request,
                    'There was a problem loading this quote; please contact ' +
                    'our support team for assistance.'
                );

                return;
            }

            // otherwise, the given quote is invalid, but we can provide a new
            // one
            server.sendNewQuote( request, createQuoteQuick );
        } );
    }

    // we handled the request; don't do any additional routing
    resolve( true );
}


/**
 * Creates a new quote instance with the given quote id
 *
 * @param Integer           quote_id id of the quote
 * @param Program           program  program that the quote will be a part of
 * @param Function( quote ) callback function to call when quote is ready
 *
 * @return undefined
 */
function createQuote( quote_id, program, request, callback, error_callback )
{
    // if an invalid callback was given, log it to the console...that's a
    // problem, since the quote won't even be returned!
    callback = callback || function()
    {
        server.logger.log( log.PRIORITY_ERROR,
            "Invalid createQuote() callback"
        );
    }

    var bucket     = QuoteDataBucket(),
        metabucket = QuoteDataBucket(),
        quote      = Quote( quote_id, bucket );

    quote.setMetabucket( metabucket );

    var controller = this;
    return server.initQuote( quote, program, request,
        function()
        {
            callback.call( controller, quote );
        },
        function()
        {
            error_callback.apply( controller, arguments );
        }
    );
}


function createQuoteQuick( id )
{
    return Quote(
        id,
        QuoteDataBucket()
    );
}


/**
 * Check whether the proper skey (session key) was provided
 *
 * This is a basic authentication token that allows bypassing authentication
 * for internal tasks (like creating quotes).
 *
 * XXX: A single shared secret is a terrible idea; this was intended to
 * be a temporary solution.  Fix this crap in favor of proper authentication
 * between services.
 */
function has_skey( user_request )
{
    if ( !exports.skey )
    {
        return false;
    }

    return ( user_request.getGetData().skey === exports.skey );
}


function getCleaner( program )
{
    return ProgramQuoteCleaner( program );
}


/**
 * Acquire a semaphore for a quote id
 *
 * Note that, since this controller is single-threaded, we do not have to worry
 * about race conditions with regards to acquiring the lock.
 */
function acquireLock( type, id, request, c, manual )
{
    type.acquire( id, function( free )
    {
        // automatically release the lock once the request completes (this is
        // also safer, as it is hopefully immune to exceptions before lock
        // release and will still work with the timeout system)
        if ( !manual )
        {
            request.once( 'end', function()
            {
                free();
            } );
        }

        // we're good!
        c( free );
    } );

    // keep the quote session alive
    touchSession( id, request.getSession() );
}

/**
 * ALWAYS USE THIS FUNCTION WHEN TRYING TO ACQUIRE BOTH A READ AND A WRITE LOCK!
 * Otherwise, the possibility for a deadlock is introduced if something else is
 * attempting to acquire both locks in the opposite order!
 */
function acquireRwLock( id, request, c, manual )
{
    acquireWriteLock( id, request, function()
    {
        acquireReadLock( id, request, c );
    }, manual );
}

function acquireWriteLock( id, request, c, manual )
{
    acquireLock( wlock, id, request, c, manual );
}

function acquireReadLock( id, request, c, manual )
{
    acquireLock( rlock, id, request, c, manual );
}

function acquireWriteLockImmediate( id, request, c, manual )
{
    if ( wlock.isLocked( id ) )
    {
        // we could not obtain the lock
        c( null );
        return;
    }

    // lock is free; acquire it
    acquireWriteLock.apply( null, arguments );
}


function touchSession( id, session )
{
    var cur = sflag[ id ];

    // do not allow touching the session if we're not the owner
    if ( cur && ( cur.agentName !== session.agentName() ) )
    {
        return;
    }

    sflag[ id ] = {
        agentName: session.agentName(),
        time:      ( new Date() ).getTime(),
    };
}

function getConcurrentSessionUser( id, session )
{
    var flag = sflag[ id ];

    // we have a flag; if we're the same user that created it (we check on name
    // because internally we all have the same agent id), then do not consider
    // this a concurrent access attempt
    if ( !flag || ( flag.agentName === session.agentName() ) )
    {
        return '';
    }

    return ( flag.agentName );
}



// in the unfortunate situation where a write lock hangs, for whatever reason,
// this will ensure that it is eventually freed; note that, since this shouldn't
// ever happen, this interval is 30s, meaning that a given lock may exist for
// just under 60s
var __wlock_stale_interval = 30e3;
setInterval( function __wlock_stale_free()
{
    // TODO: log properly and possibly kill the request
    // TODO: if the same quote repeatedly has stale locks, perhaps the
    // quote data is bad and should be locked
    wlock.freeStale( __wlock_stale_interval, function( id )
    {
        console.log( 'Freeing stale write lock: ' + id );
    } );

    rlock.freeStale( __wlock_stale_interval, function( id )
    {
        console.log( 'Freeing stale read lock: ' + id );
    } );
}, __wlock_stale_interval );


// set this to ~10s after the quicksave interval
var __sclear_interval = 70e3;
setInterval( function __sclear_timeout()
{
    var now = ( new Date() ).getTime();

    for ( var id in sflag )
    {
        // clear all session flags that have timed out
        if ( ( now - sflag[ id ].time ) > __sclear_interval )
        {
            delete sflag[ id ];
        }
    }
}, __sclear_interval );
