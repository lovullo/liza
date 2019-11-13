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

import { AmqpPublisher } from './AmqpPublisher';
import { DeltaResult } from '../bucket/delta';
import { EventDispatcher } from './event/EventDispatcher';
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
    readonly SCHEMA_PATH = __dirname + '/avro/schema.avsc';

    /** A mapping of which delta type translated to which avro event */
    readonly DELTA_MAP: Record<string, string> = {
        data:     'STEP_SAVE',
        ratedata: 'RATE',
    };


    /**
     * Initialize publisher
     *
     * @param _conf    - amqp configuration
     * @param _emitter - event emitter instance
     * @param _ts_ctr  - a timestamp constructor
     */
    constructor(
        private readonly _conf:       AmqpConfig,
        private readonly _dispatcher: EventDispatcher,
        private readonly _ts_ctr    : () => UnixTimestamp,
    ) {}


    /**
     * Publish quote message to exchange post-rating
     *
     * @param delta - The delta to publish
     *
     * @return whether the message was published successfully
    */
    publish( delta: DeltaResult<any> ): Promise<null>
    {
        const exchange = this._conf.exchange;

        return new Promise<null>( ( resolve, reject ) =>
        {
            amqpConnect( this._conf )
            .then( conn =>
            {
                setTimeout( () => conn.close(), 10000 );
                return conn.createChannel();
            } )
            .then( ch =>
            {
                ch.assertExchange( exchange, 'fanout', { durable: true } );

                return this.sendMessage( ch, exchange, delta );
            } )
            .then( sentSuccessfully =>
            {
                console.log('sentSuccessfully', sentSuccessfully);
                if ( sentSuccessfully )
                {
                    this._dispatcher.dispatch(
                        'delta-publish',
                        "Published " + delta.type + " delta with ts '"
                            + delta.timestamp + "' to '" + exchange
                            + '" exchange',
                    );

                    resolve();
                }
                else
                {
                    this._dispatcher.dispatch(
                        'publish-err',
                        "Error publishing " + delta.type + " delta with ts '"
                            + delta.timestamp + "' to '" + exchange
                            + "' exchange",
                    );

                    reject();
                }
            } )
            .catch( e =>
            {
                this._dispatcher.dispatch(
                    'publish-err',
                    "Error publishing " + delta.type + " delta with ts '"
                        + delta.timestamp + '" to "' + exchange + "' exchange '"
                        + e,
                )

                reject();
            } );
        } );
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
    sendMessage(
        channel:  Channel,
        exchange: string,
        delta:    DeltaResult<any>,
    ): boolean
    {
        const headers = {
            version: 1,
            created: Date.now(),
        };

        // Convert all delta datums to string for avro
        const delta_data = this.avroFormat( delta.data );
        const event_id   = this.DELTA_MAP[ delta.type ];

        const data = {
            event: {
                id:    event_id,
                ts:    this._ts_ctr(),
                actor: 'SERVER',
                step:  null,
            },
            document: {
                id:       123123, // Fix
            },
            session: {
                entity_name: 'Foobar', // Fix
                entity_id:   123123, // Fix
            },
            data: {
                Data: {
                    bucket: delta_data,
                },
            },
            delta: {
                Data: {
                    bucket: delta_data,
                },
            },
            program: {
                Program: {
                    id:      'quote_server',
                    version: 'dadaddwafdwa', // Fix
                },
            },
        };

        const avro_buffer = this.avroEncode( data );

        if ( !avro_buffer )
        {
            return false;
        }

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
     * @return the avro buffer or null if there is an error
     */
    avroEncode( data: Record<string, any> ): Buffer | null
    {
        let buffer = null;

        try
        {
            const type   = avro.parse( this.SCHEMA_PATH );
                  buffer = type.toBuffer( data );
        }
        catch( e )
        {
            this._dispatcher.dispatch(
                'avro-parse-err',
                'Error encoding data to avro: ' + e,
            );
        }

        return buffer;
    }


    /**
     * Format the data for avro by add type specifications to the data
     *
     * @param data - the data to format
     *
     * @return the formatted data
     */
    avroFormat( data: any, top_level: boolean = true ): any
    {
        let data_formatted: any = {};

        switch( typeof( data ) )
        {
            case 'object': // Typescript treats arrays as objects
                if ( data == null )
                {
                    return null;
                }
                else if ( Array.isArray( data ) )
                {
                    let arr: any[] = [];

                    data.forEach( ( datum ) =>
                    {
                        arr.push( this.avroFormat( datum, false ) );
                    } );

                    data_formatted = ( top_level )
                        ? arr
                        : { 'array': arr };
                }
                else
                {
                    let datum_formatted: any = {};

                    Object.keys( data).forEach( ( key: string ) =>
                    {
                        const datum = this.avroFormat( data[ key ], false );

                        datum_formatted[ key ] = datum;

                    } );

                    data_formatted = ( top_level )
                        ? datum_formatted
                        : { "map": datum_formatted };
                }
                break;

            case 'boolean':
                return { 'boolean': data };

            case 'number':
                return { 'double': data };

            case 'string':
                return { 'string': data };

            case 'undefined':
                return null;
        }

        return data_formatted;
    }
}
