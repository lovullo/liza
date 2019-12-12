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

import { Histogram, Pushgateway, Counter, Gauge } from 'prom-client';
import { EventEmitter } from 'events';
import { PrometheusFactory, PrometheusConfig } from './PrometheusFactory';

const client = require( 'prom-client' )


export type MetricTimer = (
    _start_time?: [ number, number ]
) => [ number, number ];


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

    /** Timing map */
    private _timing_map: Record<string, [ number, number ]> = {};

    private _push_interval: NodeJS.Timer;


    /**
     * Initialize delta logger
     *
     * @param _factory - A factory to create prometheus components
     * @param _conf    - Prometheus configuration
     * @param _emitter - Event emitter
     * @param _timer   - A timer function to create a tuple timestamp
     */
    constructor(
        private readonly _factory: PrometheusFactory,
        private readonly _conf:    PrometheusConfig,
        private readonly _emitter: EventEmitter,
        private readonly _timer:   MetricTimer,
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
            this._conf.buckets_start,
            this._conf.buckets_width,
            this._conf.buckets_count,
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
        this._push_interval = setInterval( () =>
            {
                this._gateway.pushAdd(
                    { jobName: 'liza_delta_metrics' },
                    this.getPushCallback( this )
                );
            }, this._conf.push_interval_ms
        );

        // Subsribe metrics to events
        this.hookMetrics();
    }


    /**
     * Stop the push interval
     */
    stop(): void
    {
        clearInterval( this._push_interval );
    }


    /**
     * List to events to update metrics
     */
    private hookMetrics(): void
    {
        this._emitter.on(
            'delta-process-start',
            ( uid: string ) => { this._timing_map[ uid ] = this._timer(); }
        );

        this._emitter.on(
            'delta-process-end',
            ( uid: string ) =>
            {
                const start_time_ms = this._timing_map[ uid ] || [ -1, -1 ];
                const t             = this._timer( start_time_ms );
                const total_time_ms = t[ 0 ] * 1000 + t[ 1 ] / 1000000;

                this._process_time.observe( total_time_ms );
                this._total_processed.inc();
            }
        );

        this._emitter.on( 'error', ( _ ) => this._total_error.inc() );
    }


    /**
     * Handle push error
     *
     * @param self - Metrics Collector object
     *
     * @return a function to handle the pushAdd callback
     */
    private getPushCallback( self: MetricsCollector ): () => void
    {
        return (
            error?:     Error | undefined,
            _response?: any,
            _body?:     any
        ): void =>
        {
            if ( error )
            {
                self._emitter.emit( 'error', error );
            }
        }
    }

    /**
     * Update metrics with current error count
     *
     * @param count - the number of errors found
     */
    updateErrorCount( count: number ): void
    {
        this._current_error.set( +count );
    }
}
