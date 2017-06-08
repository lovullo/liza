/**
 * Generic logger
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
 */


var fs      = require( 'fs' ),
    sprintf = require( 'php' ).sprintf,
    Class   = require( 'easejs' ).Class;


/**
 * Base logging class
 */
module.exports = Class( 'Log',
{
    /**
     * File descriptor (if any)
     * @var String|null
     */
    'private _fd': null,

    /**
     * Name of file that is being logged to (if any)
     * @var String
     */
    'private _filename': '',

    /**
     * Log to standard out
     * @var Boolean
     */
    stdout: true,

    /**
     * Log to standard error
     * @var Boolean
     */
    stderr: false,


    set filename( val )
    {
        if ( val === null )
        {
            this._file = null;
            return;
        }

        // must be a string if not null
        var fn = ''+( val );

        this._filename  = fn;
        this._fdWaiting = true;

        // open synchronously (logs are important, yo! - which is why we also
        // aren't going to enclose this in a try/catch block)
        this._fd = fs.openSync( fn, 'a' );
    },

    get filename()
    {
        return this._filename;
    },


    /**
     * Initializes access log
     *
     * @param String filename file to log output to
     *
     * @return undefined
     */
    'virtual public __construct': function( filename )
    {
        if ( filename )
        {
            this.filename = ''+( filename );
        }
    },


    /**
     * Writes to log in sprintf-style manner
     *
     * @return Log self
     */
    'public write': function()
    {
        // convert arguments to an array
        var args = Array.prototype.slice.call( arguments );

        // log to standard out?
        if ( this.stdout === true )
        {
            console.log.apply( this, args );
        }

        // log to file?
        if ( this._fd !== null )
        {
            var buffer = new Buffer( sprintf.apply( this, args ) + "\n" );
            fs.write( this._fd, buffer, 0, buffer.length, null );
        }

        return this;
    },
} );

