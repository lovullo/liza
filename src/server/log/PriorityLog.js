/**
 * Priority log
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
 */

var Class = require( 'easejs' ).Class;


/**
 * Logs messages only if they meet the requested priority (allowing for varying
 * levels of verbosity)
 */
module.exports = Class( 'PriorityLog' )
    .extend( require( './Log' ),
{
    'PRIORITY_ERROR':     0,
    'PRIORITY_IMPORTANT': 1,
    'PRIORITY_DB':        2,
    'PRIORITY_INFO':      3,
    'PRIORITY_SOCKET':    5,

    /**
     * Highest priority to log
     * @var Integer
     */
    'private _priority': 10,


    /**
     * Initialize logger with filename and priorities to log
     *
     * @param String  filename file to log to
     * @param Integer priority highest priority to log
     *
     * @return undefined
     */
    'override public __construct': function( filename, priority )
    {
        this.priority = +priority || this.priority;

        // call the parent constructor
        this.__super( filename );
    },


    /**
     * Write to the log at the given priority
     *
     * If the priority is less than or equal to the set priority for this
     * object, it will be logged. Otherwise, the message will be ignored.
     *
     * The first argument should be the priority. The remaining arguments should
     * be provided in a sprintf()-style fashion
     *
     * @return void
     */
    'public log': function()
    {
        var args     = Array.prototype.slice.call( arguments ),
            priority = +args.shift();

        // don't log if the provided priority is outside the scope that was
        // requested
        if ( priority > this._priority )
        {
            return this;
        }

        // if this was an error, prefix it with the error char (easy grepping)
        var status_char = ' ';
        switch ( priority )
        {
            case this.PRIORITY_IMPORTANT:
                status_char = '*';
                break;

            case this.PRIORITY_ERROR:
                status_char = '!';
                break;

            case this.PRIORITY_DB:
                status_char = '%';
                break;

            case this.PRIORITY_SOCKET:
                status_char = '>';
                break;
        }

        // timestamp
        args[0] = status_char + '[' + ( new Date() ).toString() + '] ' +
            args[0];

        // forward to write method
        this.write.apply( this, args );

        return this;
    },
} );

