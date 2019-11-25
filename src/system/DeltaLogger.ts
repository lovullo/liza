/**
 * Delta logger
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
 * Logger for delta events
 */

import { EventSubscriber } from "./event/EventSubscriber";

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

export class DeltaLogger
{
    /**
     * Initialize delta logger
     *
     * @param _env        - The environment ( dev, test, demo, live )
     * @param _subscriber - An event subscriber
     * @param _ts_ctr     - a timestamp constructor
     */
    constructor(
        private readonly _env:        string,
        private readonly _subscriber: EventSubscriber,
        private readonly _ts_ctr    : () => UnixTimestamp,
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
        this._registerEvent( 'mongodb-err',         LogLevel.ERROR );
        this._registerEvent( 'publish-err',         LogLevel.ERROR );
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

        this._subscriber.subscribe( event_id, logF );
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
                return ( _ ) => console.info( this._formatLog( _, level ) );
            case LogLevel.NOTICE:
                return ( _ ) => console.log( this._formatLog( _, level ) );
            case LogLevel.WARNING:
                return ( _ ) => console.warn( this._formatLog( _, level ) );
            case LogLevel.ERROR:
            case LogLevel.CRITICAL:
            case LogLevel.ALERT:
            case LogLevel.EMERGENCY:
                return ( _ ) => console.error( this._formatLog( _, level ) );
            default:
                return ( _ ) => console.log( "UNKNOWN LOG LEVEL: " + _ );
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
    private _formatLog( str: string, level: LogLevel ): StructuredLog
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
