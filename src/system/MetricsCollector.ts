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

import { DeltaDao } from "./db/DeltaDao";
import { Histogram, Pushgateway, Counter, Gauge } from 'prom-client';
import { EventEmitter } from "events";
import { PrometheusFactory } from './PrometheusFactory';

const client = require( 'prom-client' )

export declare type PrometheusConfig = {
    /** The hostname to connect to */
    hostname: string;

    /** The port to connect to */
    port: number;

    /** The environment ( dev, test, demo, live ) */
    env: string;

    /** The rate (in milliseconds) at which metrics are pushed */
    push_interval_ms: number;
}


export class MetricsCollector
{
    /** The prometheus PushGateway */
    private _gateway: Pushgateway;

    /** Delta processed time histogram */
    private _process_time:      Histogram;
    private _process_time_name: string = 'liza_delta_process_time';
    private _process_time_help: string = 'Delta process time in ms';

    /** Delta error counter */
    private _total_error:      Counter;
    private _total_error_name: string = 'liza_delta_error';
    private _total_error_help: string = 'Total errors from delta processing';

    /** Delta current error gauge */
    private _current_error:      Gauge;
    private _current_error_name: string = 'liza_delta_current_error';
    private _current_error_help: string =
        'The current number of documents in an error state';

    /** Delta error counter */
    private _total_processed:      Counter;
    private _total_processed_name: string = 'liza_delta_success';
    private _total_processed_help: string =
        'Total deltas successfully processed';

    /**
     * Initialize delta logger
     *
     * @param _factory - A factory to create prometheus components
     * @param _conf    - Prometheus configuration
     * @param _emitter - Event emitter
     */
    constructor(
        private readonly _factory: PrometheusFactory,
        private readonly _conf:    PrometheusConfig,
        private readonly _emitter: EventEmitter,
    ) {
        // Set labels
        client.register.setDefaultLabels( {
            env:     this._conf.env,
            service: 'delta_processor',
        } );

        // Create metrics
        this._gateway = this._factory.createGateway(
            client,
            this._conf.hostname,
            this._conf.port,
        );

        this._process_time = this._factory.createHistogram(
            client,
            this._process_time_name,
            this._process_time_help,
            0,
            10,
            10,
        );

        this._total_error = this._factory.createCounter(
            client,
            this._total_error_name,
            this._total_error_help,
        );

        this._current_error = this._factory.createGauge(
            client,
            this._current_error_name,
            this._current_error_help,
        );

        this._total_processed = this._factory.createCounter(
            client,
            this._total_processed_name,
            this._total_processed_help,
        );

        // Push metrics on a specific interval
        setInterval(
            () =>
            {
                this._gateway.pushAdd(
                    { jobName: 'liza_delta_metrics' }, this.pushCallback
                );
            }, this._conf.push_interval_ms
        );

        // Subsribe metrics to events
        this.hookMetrics();
    }


    /**
     * List to events to update metrics
     */
    private hookMetrics()
    {
        this._emitter.on(
            'delta-process-complete',
            ( val: any ) =>
            {
                this._process_time.observe( val );
                this._total_processed.inc();
            }
        );

        this._emitter.on(
            'delta-process-error',
            ( _ ) => this._total_error.inc()
        );
    }


    /**
     * Handle push error
     *
     * @param error    - Any errors that occurred
     * @param response - The http response
     * @param body     - The resposne body
     */
    private pushCallback(
        _error?:    Error | undefined,
        _response?: any,
        _body?:     any
    ): void
    {
        console.log( 'Push callback' );
        console.error( _error );
    }



    /**
     * Look for mongodb delta errors and update metrics if found
     *
     * @return any errors the occurred
     */
    checkForErrors( dao: DeltaDao ): NullableError
    {
        dao.getErrorCount()
        .then( count => { this._current_error.set( +count ); } )
        .catch( err => { return err; } );

        return null;
    }
}
