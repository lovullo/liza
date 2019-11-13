/**
 * Metrics Collector
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
 * Collect Metrics for Prometheus
 */

import { EventSubscriber } from "./event/EventSubscriber";

const client = require('prom-client');

declare type MetricStructure = {
    path:    string;
    code:    number;
    service: string;
    env:     string;
}

export class MetricsCollector
{
    /**
     * Initialize delta logger
     */
    constructor(
        private readonly _env:        string,
        private readonly _subscriber: EventSubscriber,
    ) {}


    /**
     * Initialize the logger to look for specific events
     */
    init(): void
    {
        const collectDefaultMetrics = client.collectDefaultMetrics;

        console.log( this._subscriber, collectDefaultMetrics)
        this._formatLog( '', 123 );
        // this._registerEvent( 'document-processed', LogLevel.NOTICE );
        // this._registerEvent( 'delta-publish',      LogLevel.NOTICE );
        // this._registerEvent( 'avro-parse-err',     LogLevel.ERROR );
        // this._registerEvent( 'mongodb-err',        LogLevel.ERROR );
        // this._registerEvent( 'publish-err',        LogLevel.ERROR );
    }


    /**
     * Get structured metric object
     *
     * @param path - the endpoint being hit
     * @param code - the response code
     *
     * @returns a structured logging object
     */
    private _formatLog( path: string, code: number ): MetricStructure
    {
        return <MetricStructure>{
            path:    path,
            code:    code,
            service: 'quote-server',
            env:     this._env,
        };
    }
}
