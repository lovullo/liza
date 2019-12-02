/**
 * Stdout logger
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
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
 *
 * Standard out logger implementing PSR-3 standards
 */
import { PsrLogger, LogLevel } from './PsrLogger';

declare type StructuredLog = {
    message:   string;
    timestamp: UnixTimestamp;
    service:   string;
    env:       string;
    severity:  string;
    context?:  Record<string, any>;
}

export class StandardLogger implements PsrLogger
{
    /**
     * Initialize logger
     *
     * @param _console
     * @param _ts_ctr  - a timestamp constructor
     * @param _env     - The environment ( dev, test, demo, live )
     */
    constructor(
        private readonly _console: Console,
        private readonly _ts_ctr:  () => UnixTimestamp,
        private readonly _env:     string,
    ) {}


    /**
     * Log at a debug level
     *
     * @param msg     - the message to log
     * @param context - additional message context
     */
    debug( msg: string | object, context?: object ): void
    {
        this._console.info( this._format( LogLevel.DEBUG, msg, context ) );
    }


    /**
     * Log at a debug level
     *
     * @param msg     - the message to log
     * @param context - additional message context
     */
    info( msg: string | object, context?: object ): void
    {
        this._console.info( this._format( LogLevel.INFO, msg, context ) );
    }


    /**
     * Log at a debug level
     *
     * @param msg     - the message to log
     * @param context - additional message context
     */
    notice( msg: string | object, context?: object ): void
    {
        this._console.log( this._format( LogLevel.NOTICE, msg, context ) );
    }


    /**
     * Log at a debug level
     *
     * @param msg     - the message to log
     * @param context - additional message context
     */
    warning( msg: string | object, context?: object ): void
    {
        this._console.warn( this._format( LogLevel.WARNING, msg, context ) );
    }


    /**
     * Log at a debug level
     *
     * @param msg     - the message to log
     * @param context - additional message context
     */
    error( msg: string | object, context?: object ): void
    {
        this._console.error( this._format( LogLevel.ERROR, msg, context ) );
    }


    /**
     * Log at a debug level
     *
     * @param msg     - the message to log
     * @param context - additional message context
     */
    critical( msg: string | object, context?: object ): void
    {
        this._console.error( this._format( LogLevel.CRITICAL, msg, context ) );
    }


    /**
     * Log at a debug level
     *
     * @param msg     - the message to log
     * @param context - additional message context
     */
    alert( msg: string | object, context?: object ): void
    {
        this._console.error( this._format( LogLevel.ALERT, msg, context ) );
    }


    /**
     * Log at a debug level
     *
     * @param msg     - the message to log
     * @param context - additional message context
     */
    emergency( msg: string | object, context?: object ): void
    {
        this._console.error( this._format( LogLevel.EMERGENCY, msg, context ) );
    }


    /**
     * Log a message
     *
     * @param msg     - the message to log
     * @param context - additional message context
     */
    log( level: LogLevel, msg: string | object, context?: object ): void
    {
        this._console.error( this._format( level, msg, context ) );
    }


    /**
     * Get structured log object
     *
     * @param msg   - the string or object to log
     * @param level - the log level
     *
     * @returns a structured logging object
     */
    private _format(
        level:   LogLevel,
        msg:     string | object,
        context: object = {},
    ): StructuredLog
    {
        let str: string;

        if ( msg !== null && typeof( msg ) === 'object' )
        {
            str = JSON.stringify( msg );
        }
        else
        {
            str = msg;
        }

        const structured_log = <StructuredLog>{
            message:   str,
            timestamp: this._ts_ctr(),
            service:   'quote-server',
            env:       this._env,
            severity:  LogLevel[level],
        };

        if ( Object.keys( context ).length > 0 )
        {
            structured_log[ "context" ] = context;
        }

        return structured_log;
    }
}
