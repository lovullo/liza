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
import { DeltaDao } from "./db/DeltaDao";
import { PositiveInteger } from "../numeric";
import { Histogram, Pushgateway, Counter, Gauge } from 'prom-client';

const client = require( 'prom-client' );


// declare type MetricStructure = {
//     path:    string;
//     code:    number;
//     service: string;
//     env:     string;
// }


export declare type PrometheusConfig = {
    /** The hostname to connect to */
    hostname: string;

    /** The port to connect to */
    port: number;

    /** The environment ( dev, test, demo, live ) */
    env: string;
}


export class MetricsCollector
{
    /** The prometheus PushGateway */
    private _gateway: Pushgateway;

    /** Metric push interval */
    private _push_interval_ms: PositiveInteger = <PositiveInteger>5000;

    /** Delta processed time histogram */
    private _process_time_hist:   Histogram;
    private _process_time_params: Pushgateway.Parameters = {
        jobName: 'liza_delta_process_time'
    };

    /** Delta error counter */
    private _process_error_count:  Counter;
    private _process_error_params: Pushgateway.Parameters = {
        jobName: 'liza_delta_error'
    };

    /** Delta current error gauge */
    private _current_error_gauge:  Gauge;
    private _current_error_params: Pushgateway.Parameters = {
        jobName: 'liza_delta_current_error'
    };

    /** Delta error counter */
    private _process_delta_count:  Counter;
    private _process_delta_params: Pushgateway.Parameters = {
        jobName: 'liza_delta_success'
    };

    /**
     * Initialize delta logger
     *
     * @param _conf       - the prometheus configuration
     * @param _subscriber - the event subscriber
     */
    constructor(
        private readonly _conf:       PrometheusConfig,
        private readonly _subscriber: EventSubscriber,
    ) {
        // Set labels
        const default_labels = {
            env:     this._conf.env,
            service: 'delta_processor',
        };

        client.register.setDefaultLabels( default_labels );

        // Create gateway
        const url     = 'http://' + this._conf.hostname + ':' + this._conf.port;
        this._gateway = new client.Pushgateway( url );

        // Create metrics
        this._process_time_hist = new client.Histogram( {
            name:       this._process_time_params.jobName,
            help:       'Time in ms for deltas to be processed',
            labelNames: [ 'env', 'service' ],
            buckets:    client.linearBuckets(0, 10, 10),
        } );

        this._process_error_count = new client.Counter( {
            name:       this._process_error_params.jobName,
            help:       'Error count for deltas being processed',
            labelNames: [ 'env', 'service' ],
        } );

        this._current_error_gauge = new client.Gauge( {
            name:       this._current_error_params.jobName,
            help:       'The current number of documents in an error state',
            labelNames: [ 'env', 'service' ],
        } );

        this._process_delta_count = new client.Counter( {
            name:       this._process_delta_params.jobName,
            help:       'Count of deltas successfully processed',
            labelNames: [ 'env', 'service' ],
        } );

        // Push metrics on a specific intervals
        setInterval(
            () =>
            {
                this._gateway.pushAdd(
                    { jobName: 'liza_delta_metrics' }, this.pushCallback
                );
            }, this._push_interval_ms
        );

        // Subsribe metrics to events
        this.subscribeMetrics();
    }


    /**
     * Subscribe metrics
     */
    private subscribeMetrics()
    {
        this._subscriber.subscribe(
            'delta-process-complete',
            ( val ) =>
            {
                this._process_time_hist.observe( val );
                this._process_delta_count.inc();
            }
        );

        this._subscriber.subscribe(
            'delta-process-error',
            ( _ ) => this._process_error_count.inc()
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
        // console.log( 'Push callback' );
        // console.error( error, response, body );
    }


    /**
     * Get structured metric object
     *
     * @param path - the endpoint being hit
     * @param code - the response code
     *
     * @returns a structured logging object
     */
    // private _formatMetricVal( label: string, val: any ): MetricStructure
    // {
    //     return <MetricStructure>{
    //         path:    path,
    //         code:    code,
    //         service: 'quote-server',
    //         env:     this._conf.env,
    //     };
    // }


    /**
     * Look for mongodb delta errors and update metrics if found
     *
     * @return any errors the occurred
     */
    checkForErrors( dao: DeltaDao ): NullableError
    {
        dao.getErrorCount()
        .then( count =>
        {
            // console.log( 'Error count: ', count );
            this._current_error_gauge.set( +count );
        } )
        .catch( err =>
        {
            return err;
        } );

        return null;
    }
}
