/**
 * Rating thread
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
 * This thread permits both asynchronous rating (in the case of JS raters) as
 * well as hassle-free runtime reloading of raters withour risk of memory leaks
 * that may be caused by deleting entries from node's module cache.
 */

var map = {},
    fs  = require( 'fs' );

var rater_path = process.env.RATER_PROGRAM_PATH;


function forEachProgram( c )
{
    fs.readdirSync( rater_path )
        .forEach( function( filename )
        {
            // ignore non-js files
            if ( !( filename.match( /\.js$/ ) ) )
            {
                return;
            }

            c( filename, ( rater_path + '/' + filename ) );
        } );
}

// sent by parent to indicate that we should exit (we should never receive this
// signal from any sort of shell or anything)
try
{
    process.on( 'SIGHUP', function()
    {
        // we're good
        process.exit( 0 );
    } );
}
catch ( e )
{
    sendLog(
        "WARNING: OS does not support signal handlers; thread will always " +
        "appear to exit in error if reload is requested"
    );
}


process.on( 'message', function( msg )
{
    switch ( msg.cmd )
    {
        case 'rate':
            doRate( msg );
            break;

        default:
            logError( "Unknown command from parent: " + msg.cmd );
    }
} );


process.on( 'uncaughtException', function( e )
{
    sendError( e );
} );


// load raters
forEachProgram( function( filename, path )
{
    var rater = null;

    try
    {
        rater = require( path );
        sendLog( 'Loaded rater: ' + filename );
    }
    catch ( e )
    {
        sendError( e );
    }

    var name = filename.replace( /\.js$/, '' );
    map[ name ] = rater;
} );


sendLog( 'Rating process ready (PID ' + process.pid + ').' );


function doRate( data )
{
    var quote = data.quote,
        rqid  = data.rqid,
        rater = map[ data.supplier ];

    if ( !rater )
    {
        process.send( {
            cmd: 'rate-reply',
            rqid: rqid,

            status: 'error',
            msg:    "Unknown supplier: " + data.supplier,
        } );

        return;
    }

    // TODO: temporary, until refactoring is complete
    var imported_flag = false;
    var rate_quote = {
        getId: function()
        {
            return quote.id;
        },

        getAgentId: function()
        {
            return quote.agentId;
        },

        getAgentName: function()
        {
            return quote.agentName;
        },

        getCreditScoreRef: function()
        {
            return quote.creditScoreRef;
        },

        getBucket: function()
        {
            return {
                getData: function()
                {
                    return quote.data;
                }
            };
        },

        setImported: function( val )
        {
            val = ( val === undefined ) ? true : !!val;
            imported_flag = val;
        },
    };

    var rate_session = {
        agentId: function()
        {
            return data.agentId;
        },

        isInternal: function()
        {
            return data.internal;
        },
    };

    // perform rating
    rater.rate( rate_quote, rate_session, data.indv,
        function( rdata, actions )
        {
            process.send( {
                cmd:  'rate-reply',
                rqid: rqid,

                status:  'ok',
                data:    rdata,
                actions: actions,

                // not used by all raters
                imported: imported_flag,
            } );
        },

        function( msg )
        {
            process.send( {
                cmd:  'rate-reply',
                rqid: rqid,

                status: 'error',
                msg:    msg,
            } );
        }
    );
}


function sendLog( msg )
{
    process.send( { cmd: 'log', msg: msg } );
}


function sendError( e )
{
    process.send( {
        cmd: 'error',
        msg: e.message,
        stack: e.stack
    } );
}

