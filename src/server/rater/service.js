/**
 * Rating service
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
 *
 * @todo decouple insurance terminology
 */

var child_process = require( 'child_process' ),
    child         = null;

// POSIX signal numbers
const _signum = {
    SIGHUP: 1,
    SIGINT: 2,
    SIGQUIT: 3,
    SIGILL: 4,
    SIGTRAP: 5,
    SIGABRT: 6,
    SIGIOT: 6,
    SIGBUS: 7,
    SIGFPE: 8,
    SIGKILL: 9,
    SIGUSR1: 10,
    SIGSEGV: 11,
    SIGUSR2: 12,
    SIGPIPE: 13,
    SIGALRM: 14,
    SIGTERM: 15,
    SIGSTKFLT: 16,
    SIGCHLD: 17,
    SIGCONT: 18,
    SIGSTOP: 19,
    SIGTSTP: 20,
    SIGTTIN: 21,
    SIGTTOU: 22,
    SIGURG: 23,
    SIGXCPU: 24,
    SIGXFSZ: 25,
    SIGVTALARM: 26,
    SIGPROF: 27,
    SIGWINCH: 28,
    SIGIO: 29,
    SIGPOLL: 29,
    SIGPWR: 30,
    SIGSYS: 31,
};


exports.init = function( logc, errc )
{
    if ( child !== null )
    {
        // end the child
        child.kill( 'SIGHUP' );
        return;
    }

    child = child_process.fork(
        __dirname + '/thread.js',
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

    child.on( 'message', function( msg )
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
                rateReply( msg, errc );
                break;

            default:
                errc( "Unknown message from rater thread: " + msg.cmd );
        }
    } );

    child.on( 'exit', function( excode, sig )
    {
        child = null;

        // c'mon node...use the POSIX exit status
        if ( ( excode == null ) && sig )
        {
            excode = getsignum( sig );
        }

        if ( excode !== 0 )
        {
            errc(
                "Rater thread exited with error code " + excode +
                ( ( sig ) ? " (" + sig + ")" : '' )
            );

            purgeRateRequests( "Rater thread died unexpectedly" );
        }
        else
        {
            logc( "Rater thread exited gracefully." );
        }

        // purge anything remaining in the queue (hopefully nothing; this is
        // purely a catch-all in case a request somehow snuck in due to a bug)
        purgeRateRequests( "Rater thread is being restarted." );

        // start a new thread
        logc( "Restarting rater thread..." );
        exports.init( logc, errc );
    } );
};


var _requests = {};

/**
 * Returns the rater associated with the given id
 *
 * @param {string} id rater id
 *
 * @return {Object|null} requested rater or null if it does not exist
 */
exports.byId = function( id )
{
    // temporary until refactoring is complete
    return { rate: function( quote, session, indv, success, failure )
    {
        var rqid = createRqid( quote.getId(), indv );
        _requests[ rqid ] = [ success, failure ];

        child.send( {
            cmd:      'rate',
            supplier: id,
            indv:     indv,
            rqid:     rqid,

            quote: {
                id:        quote.getId(),
                agentId:   quote.getAgentId(),
                agentName: quote.getAgentName(),
                data:      quote.getBucket().getData(),

                creditScoreRef: quote.getCreditScoreRef(),
            },

            agentId:  session.agentId(),
            internal: session.isInternal(),
        } );
    } };
}


function rateReply( msg, errc )
{
    var rqid = msg.rqid,
        rq   = _requests[ rqid ];

    // does this request exits?
    if ( !rq )
    {
        // uh...beaver?
        errc( "Reply to unknown rqid: " + rqid );
        return;
    }

    // remove the rqid from the pending request list; we now hold the only
    // reference
    delete _requests[ rqid ];

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
}


function purgeRateRequests( msg )
{
    // this is never a good thing
    for ( var rqid in _requests )
    {
        // invoke failure function
        _requests[ rqid ][ 1 ]( msg );
    }

    // clear out request references
    _requests = {};
}


function getsignum( sig )
{
    return 128 + ( _signum[ sig ] || 0 );
}


function createRqid( qid, indv )
{
    return qid + '_'
        + ( indv ? indv + '_' : '' )
        + ( new Date() ).getTime();
}

