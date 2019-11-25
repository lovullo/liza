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

import { AmqpPublisher, AmqpConfig } from './AmqpPublisher';
import { DeltaResult } from '../bucket/delta';
import { EventEmitter } from "events";
import {
    connect as amqpConnect,
    Channel,
    Connection,
} from 'amqplib';

const avro = require( 'avro-js' );


export interface AvroSchema {
    /** Write data to a buffer */
    toBuffer( data: Record<string, any> ): Buffer | null;
}


export class DeltaPublisher implements AmqpPublisher
{
    /** The amqp connection */
    private _conn?: Connection;

    /** The amqp channel */
    private _channel?: Channel;

    /** The avro schema */
    private _type?: AvroSchema;

    /** The path to the avro schema */
    readonly SCHEMA_PATH = __dirname + '/avro/schema.avsc';

    /** A mapping of which delta type translated to which avro event */
    readonly DELTA_MAP: Record<string, string> = {
        data:     'STEP_SAVE',
        ratedata: 'RATE',
    };


    /**
     * Delta publisher
     *
     * @param _conf    - amqp configuration
     * @param _emitter - event emitter instance
     * @param _ts_ctr  - a timestamp constructor
     */
    constructor(
        private readonly _conf:    AmqpConfig,
        private readonly _emitter: EventEmitter,
        private readonly _ts_ctr:  () => UnixTimestamp,
    ) {
        this._type = avro.parse( this.SCHEMA_PATH );
    }


    /**
     * Initialize connection
     */
    connect(): Promise<null>
    {
        return new Promise<null>( ( resolve, reject ) =>
        {
            amqpConnect( this._conf )
            .then( conn =>
            {
                this._conn = conn;

                // If there is an error, attemp to reconnect
                this._conn.on( 'error', e =>
                {
                    this._emitter.emit( 'amqp-conn-error', e );

                    let reconnect_interval: NodeJS.Timer;

                    let retry_count = 0;

                    const reconnect = () =>
                    {
                        if ( ++retry_count >= this._conf.retries )
                        {
                            clearInterval( reconnect_interval );

                            this._emitter.emit(
                                'amqp-reconnect-fail',
                                'Could not re-establish AMQP connection.'
                            );

                            return;
                        }

                        this._emitter.emit(
                            'amqp-reconnect',
                            '...attempting to re-establish AMQP connection'
                        );

                        this.connect()
                        .then( _ =>
                        {
                            clearInterval( reconnect_interval );

                            this._emitter.emit(
                                'amqp-reconnect',
                                'AMQP re-connected'
                            );
                        } )
                        .catch( e =>
                        {
                            this._emitter.emit( 'amqp-conn-error', e );
                        } );
                    }

                    reconnect_interval = setInterval(
                        reconnect,
                        ( this._conf.retry_wait * 1000 )
                    );
                } );

                return this._conn.createChannel();
            } )
            .then( ( ch: Channel ) =>
            {
                this._channel = ch;

                this._channel.assertExchange(
                    this._conf.exchange,
                    'fanout',
                    { durable: true }
                );

                resolve();
                return;
            } )
            .catch( e =>
            {
                reject( e );
                return;
            } );
        } );
    }


    /**
     * Close the amqp conenction
     */
    close(): void
    {
        if ( this._conn )
        {
            this._conn.close.bind(this._conn);
        }
    }


    /**
     * Publish quote message to exchange post-rating
     *
     * @param delta - The delta to publish
     *
     * @return whether the message was published successfully
    */
    publish( delta: DeltaResult<any> ): Promise<null>
    {
        return new Promise<null>( ( resolve, reject ) =>
        {
            this.sendMessage( delta )
            .then( _ =>
            {
                this._emitter.emit(
                    'delta-publish',
                    "Published " + delta.type + " delta with ts '"
                        + delta.timestamp + "' to '" + this._conf.exchange
                        + '" exchange',
                );

                resolve();
                return;
            } )
            .catch( e =>
            {
                this._emitter.emit(
                    'publish-err',
                    "Error publishing " + delta.type + " delta with ts '"
                        + delta.timestamp + '" to "' + this._conf.exchange
                        + "' exchange: '" + e,
                )

                reject();
            } );
        } );
    }


    /**
     * Send message to exchange
     *
     * @param delta - The delta to publish
     *
     * @return whether publish was successful
     */
    sendMessage( delta: DeltaResult<any> ): Promise<null>
    {
        return new Promise<null>( ( resolve, reject ) =>
        {
            const ts          = this._ts_ctr();
            const headers     = { version: 1, created: ts };
            const delta_data  = this.avroFormat( delta.data );
            const event_id    = this.DELTA_MAP[ delta.type ];
            const avro_buffer = this.avroEncode( {
                event: {
                    id:    event_id,
                    ts:    ts,
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
            } );

            if ( !this._conn )
            {
                reject( 'Error sending message: No connection' );
                return;
            }
            else if ( !this._channel )
            {
                reject( 'Error sending message: No channel' );
                return;
            }
            else if ( !avro_buffer )
            {
                reject( 'Error sending message: No avro buffer' );
                return;
            }

            // we don't use a routing key; fanout exchange
            const published_successfully = this._channel.publish(
                this._conf.exchange,
                '',
                avro_buffer,
                { headers: headers },
            );

            if ( published_successfully )
            {
                resolve();
                return;
            }

            reject( 'Error sending message: publishing failed' );
        } );
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
            if ( !this._type )
            {
                this._emitter.emit(
                    'avro-err',
                    'No avro scheama found',
                );

                return null;
            }

            buffer = this._type.toBuffer( data );
        }
        catch( e )
        {
            this._emitter.emit(
                'avro-err',
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
