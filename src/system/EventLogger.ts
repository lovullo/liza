/**
 * Event logger
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
 * PSR-12 style logger based on node events
 */

import { EventEmitter } from "events";

enum LogLevel {
    DEBUG,
    INFO,
    NOTICE,
    WARNING,
    ERROR,
    CRITICAL,
    ALERT,
    EMERGENCY,
};

declare type StructuredLog = {
    message:   string;
    timestamp: UnixTimestamp;
    service:   string;
    env:       string;
    severity:  string;
}

export class EventLogger
{
    /**
     * Initialize logger
     *
     * @param _env     - The environment ( dev, test, demo, live )
     * @param _emitter - An event emitter
     * @param _ts_ctr  - a timestamp constructor
     */
    constructor(
        private readonly _console: Console,
        private readonly _env:     string,
        private readonly _emitter: EventEmitter,
        private readonly _ts_ctr:  () => UnixTimestamp,
    ) {
        this.init();
    }


    /**
     * Initialize the logger to look for specific events
     */
    init(): void
    {
        this._registerEvent( 'document-processed',  LogLevel.NOTICE );
        this._registerEvent( 'delta-publish',       LogLevel.NOTICE );
        this._registerEvent( 'amqp-conn-error',     LogLevel.WARNING );
        this._registerEvent( 'amqp-reconnect',      LogLevel.WARNING );
        this._registerEvent( 'amqp-reconnect-fail', LogLevel.ERROR );
        this._registerEvent( 'avro-err',            LogLevel.ERROR );
        this._registerEvent( 'dao-err',             LogLevel.ERROR );
        this._registerEvent( 'publish-err',         LogLevel.ERROR );

        // this._registerEvent( 'log', LogLevel.INFO );
        // this._registerEvent( 'debug', LogLevel.DEBUG );
        // this._registerEvent( 'info', LogLevel.INFO );
        // this._registerEvent( 'notice', LogLevel.NOTICE );
        // this._registerEvent( 'warning', LogLevel.WARNING );
        // this._registerEvent( 'error', LogLevel.ERROR );
        // this._registerEvent( 'critical', LogLevel.CRITICAL );
        // this._registerEvent( 'alert', LogLevel.ALERT );
        // this._registerEvent( 'emergency', LogLevel.EMERGENCY );
    }


    /**
     * Register an event at a specific log level
     *
     * @param event_id - the event id
     * @param level    - the log level
     */
    private _registerEvent( event_id: string, level: LogLevel ): void
    {
        const logF = this._getLogLevelFunction( level )

        this._emitter.on( event_id, logF );
    }


    /**
     * Get a logging function for the specified log level
     *
     * @param event_id - the event id
     *
     * @return the function to log with
     */
    private _getLogLevelFunction( level: LogLevel ): ( str: string ) => void
    {
        switch( level )
        {
            case LogLevel.DEBUG:
            case LogLevel.INFO:
                return ( str ) => this._console.info( this._format( str, level ) );
            case LogLevel.NOTICE:
                return ( str ) => this._console.log( this._format( str, level ) );
            case LogLevel.WARNING:
                return ( str ) => this._console.warn( this._format( str, level ) );
            case LogLevel.ERROR:
            case LogLevel.CRITICAL:
            case LogLevel.ALERT:
            case LogLevel.EMERGENCY:
                return ( str ) => this._console.error( this._format( str, level ) );
            default:
                return ( str ) => this._console.log( "UNKNOWN LOG LEVEL: " + str );
        }
    }


    /**
     * Get structured log object
     *
     * @param str   - the string to log
     * @param level - the log level
     *
     * @returns a structured logging object
     */
    private _format( str: string, level: LogLevel ): StructuredLog
    {
        return <StructuredLog>{
            message:   str,
            timestamp: this._ts_ctr(),
            service:   'quote-server',
            env:       this._env,
            severity:  LogLevel[level],
        };
    }
}
