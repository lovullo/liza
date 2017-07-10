/**
 * Rating process manager
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
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @todo decouple insurance terminology
 */

'use strict';

const { Class }     = require( 'easejs' );
const child_process = require( 'child_process' );

// POSIX signal numbers
const _signum = {
    SIGHUP:     1,
    SIGINT:     2,
    SIGQUIT:    3,
    SIGILL:     4,
    SIGTRAP:    5,
    SIGABRT:    6,
    SIGIOT:     6,
    SIGBUS:     7,
    SIGFPE:     8,
    SIGKILL:    9,
    SIGUSR1:    10,
    SIGSEGV:    11,
    SIGUSR2:    12,
    SIGPIPE:    13,
    SIGALRM:    14,
    SIGTERM:    15,
    SIGSTKFLT:  16,
    SIGCHLD:    17,
    SIGCONT:    18,
    SIGSTOP:    19,
    SIGTSTP:    20,
    SIGTTIN:    21,
    SIGTTOU:    22,
    SIGURG:     23,
    SIGXCPU:    24,
    SIGXFSZ:    25,
    SIGVTALARM: 26,
    SIGPROF:    27,
    SIGWINCH:   28,
    SIGIO:      29,
    SIGPOLL:    29,
    SIGPWR:     30,
    SIGSYS:     31,
};


/**
 * Manage rating process
 *
 * Handles formatting and sending requests to the rating process; and
 * processing replies.
 */
module.exports = Class( 'ProcessManager',
{
    /**
     * Pending requests indexed by id
     * @type {Object}
     */
    'private _requests': {},

    /**
     * Rating process
     * @type {ChildProcess}
     */
    'private _child': null,


    /**
     * Start rating process
     *
     * @param {function(string)}        logc logging callback
     * @param {function(string,string)} errc error callback (message and stack)
     *
     * @return {undefined}
     */
    'public init'( logc, errc )
    {
        if ( this._child !== null )
        {
            // end the child
            this._child.kill( 'SIGHUP' );
            return;
        }

        this._child = child_process.fork(
            __dirname + '/process.js',
            [],

            // pass all our arguments to the child, incrementing the debug
            // port if --debug was provided
            {
                env:      process.env,
                execArgv: process.execArgv.map( arg =>
                {
                    const debug = arg.match( /^--debug(?:=(\d+))?$/ );

                    if ( debug === null )
                    {
                        return arg;
                    }

                    // our debug port will be our parent's plus one
                    const parent_port = +debug[ 1 ] || 5858,
                        new_port    = parent_port + 1;

                    return '--debug=' + new_port;
                } ),
            }
        );

        this._child.on( 'message', msg =>
        {
            var cmd = msg.cmd;

            switch ( cmd )
            {
                case 'log':
                    logc( msg.msg );
                    break;

                case 'error':
                    errc( msg.msg, msg.stack );
                    break;

                case 'rate-reply':
                    this._rateReply( msg, errc );
                    break;

                default:
                    errc( "Unknown message from rater process: " + msg.cmd );
            }
        } );

        this._child.on( 'exit', ( excode, sig ) =>
        {
            this._child = null;

            // c'mon node...use the POSIX exit status
            if ( ( excode == null ) && sig )
            {
                excode = this._getSignum( sig );
            }

            if ( excode !== 0 )
            {
                errc(
                    "Rater process exited with error code " + excode +
                    ( ( sig ) ? " (" + sig + ")" : '' )
                );

                this._purgeRateRequests( "Rater process died unexpectedly" );
            }
            else
            {
                logc( "Rater process exited gracefully." );
            }

            // purge anything remaining in the queue (hopefully nothing; this is
            // purely a catch-all in case a request somehow snuck in due to a bug)
            this._purgeRateRequests( "Rater process is being restarted." );

            // start a new process
            logc( "Restarting rater process..." );
            exports.init( logc, errc );
        } );
    },


    /**
    * Returns the rater associated with the given id
    *
    * @param {string} id rater id
    *
    * @return {Object|null} requested rater or null if it does not exist
    */
    'public byId'( id )
    {
        // temporary until refactoring is complete
        return { rate: ( quote, session, indv, success, failure ) =>
        {
            var rqid = this._createRqid( quote.getId(), indv );
            this._requests[ rqid ] = [ success, failure ];

            this._child.send( {
                cmd:      'rate',
                supplier: id,
                indv:     indv,
                rqid:     rqid,

                quote: {
                    id:        quote.getId(),
                    agentId:   quote.getAgentId(),
                    agentName: quote.getAgentName(),
                    data:      this._genData( quote ),

                    creditScoreRef: quote.getCreditScoreRef(),
                },

                agentId:  session.agentId(),
                internal: session.isInternal(),
            } );
        } };
    },


    /**
     * Generate data to provide to rater
     *
     * Bucket data is used as-is.  Metadata are merged with a "meta:" prefix.
     *
     * @param {ServerSideQuote} quote source quote
     *
     * @return {Object} merged data
     */
    'private _genData'( quote )
    {
        const dest = {};
        const metadata = quote.getMetabucket().getData();

        Object.assign( dest, quote.getBucket().getData() );

        for ( let key in metadata )
        {
            dest[ 'meta:' + key ] = metadata[ key ];
        }

        return dest;
    },


    'private _rateReply'( msg, errc )
    {
        var rqid = msg.rqid,
            rq   = this._requests[ rqid ];

        // does this request exits?
        if ( !rq )
        {
            // uh...beaver?
            errc( "Reply to unknown rqid: " + rqid );
            return;
        }

        // remove the rqid from the pending request list; we now hold the only
        // reference
        delete this._requests[ rqid ];

        var success = rq[ 0 ],
            failure = rq[ 1 ];

        // if we did not rate succesfully, abort
        if ( msg.status !== 'ok' )
        {
            failure( msg.msg );
            return;
        }

        if ( !msg.data )
        {
            failure( "Rater indicated success, but no data was returned" );
            return;
        }

        // that's right; who da man (or wo-man)?
        success( msg.data, ( msg.actions || [] ) );
    },


    'private _purgeRateRequests'( msg )
    {
        // this is never a good thing
        for ( var rqid in this._requests )
        {
            // invoke failure function
            this._requests[ rqid ][ 1 ]( msg );
        }

        // clear out request references
        this._requests = {};
    },


    'private _getSignum'( sig )
    {
        return 128 + ( _signum[ sig ] || 0 );
    },


    'private _createRqid'( qid, indv )
    {
        return qid + '_'
            + ( indv ? indv + '_' : '' )
            + ( new Date() ).getTime();
    },
} );
