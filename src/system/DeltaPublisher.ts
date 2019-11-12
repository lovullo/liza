/**
 * Delta Publisher
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
 * Publish delta message to a queue
 */

import { AmqpPublisher } from "./AmqpPublisher";
import { DeltaResult } from "../bucket/delta";
import {
    connect as amqpConnect,
    Options,
    Channel
} from 'amqplib';

const avro = require( 'avro-js' );


export interface AmqpConfig extends Options.Connect {
    /** The name of a queue or exchange to publish to */
    exchange: string;
}


export class DeltaPublisher implements AmqpPublisher
{
    /** The path to the avro schema */
    readonly SCHEMA_PATH = './avro/schema.avsc';

    /** A mapping of which delta type translated to which avro event */
    readonly DELTA_MAP: Record<string, string> = {
        data:     'rate',
        ratedata: 'update',
    };


    /**
     * Initialize trait
     *
     * @param _conf   - amqp configuration
     * @param _logger - logger instance
     */
    constructor(
        private readonly _conf:   AmqpConfig,
        private readonly _logger: any
    ) {}


    /**
     * Publish quote message to exchange post-rating
     *
     * @param delta - The delta to publish
    */
    publish( delta: DeltaResult<any> ): void
    {
        // check both as we transition from one to the other
        const exchange = this._conf.exchange;

        amqpConnect( this._conf )
            .then( conn =>
            {
                setTimeout( () => conn.close(), 10000 );
                return conn.createChannel();
            } )
            .then( ch => {
                ch.assertExchange( exchange, 'fanout', { durable: true } );

                return this._sendMessage( ch, exchange, delta );
            } )
            .then( () => this._logger.log(
                this._logger.PRIORITY_INFO,
                "Published " + delta.type + " delta with timestamp '" +
                    delta.timestamp + "' to quote-update exchange '"+
                    exchange + "'"
            ) )
            .catch( e => this._logger.log(
                this._logger.PRIORITY_ERROR,
                "Error publishing " + delta.type + " delta with timestamp '" +
                    delta.timestamp + "' to quote-update exchange '"+
                    exchange + "'" + ": " + e
            ) );
    }


    /**
     * Send message to exchange
     *
     * @param channel  - AMQP channel
     * @param exchange - exchange name
     * @param delta    - The delta to publish
     *
     * @return whether publish was successful
     */
    _sendMessage(
        channel:  Channel,
        exchange: string,
        delta:    DeltaResult<any>,
    ): boolean
    {
        const headers = {
            version: 1,
            created: Date.now(),
        };

        const event_id = this.DELTA_MAP[ delta.type ];

        const data = {
            delta: delta,
            event: event_id,
        };

        const avro_buffer = this._avroEncode( data );

        // we don't use a routing key; fanout exchange
        const routing_key = '';

        return channel.publish(
            exchange,
            routing_key,
            avro_buffer,
            { headers: headers },
        );
    }


    /**
     * Encode the data in an avro buffer
     *
     * @param data - the data to encode
     *
     * @return the avro buffer
     */
    _avroEncode( data: Record<string, any> ): Buffer
    {
        const type = avro.parse( this.SCHEMA_PATH );

        const buffer = type.toBuffer( data );

        return buffer;
    }
}
