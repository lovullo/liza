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
    Channel,
    Connection,
} from 'amqplib';

const avro = require( 'avro-js' );

export interface AmqpConfig extends Options.Connect {
    /** The name of a queue or exchange to publish to */
    exchange: string;
}


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
        private readonly _conf:       AmqpConfig,
        private readonly _dispatcher: EventDispatcher,
        private readonly _ts_ctr    : () => UnixTimestamp,
    ) {
        this._type = avro.parse( this.SCHEMA_PATH );
    }


    /**
     * Initialize connection
     */
    connect(): Promise<NullableError>
    {
        return new Promise<null>( ( resolve, reject ) =>
        {
            amqpConnect( this._conf )
            .then( conn =>
            {
                this._conn = conn;

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
    publish( delta: DeltaResult<any> ): Promise<NullableError>
    {
        return new Promise<NullableError>( ( resolve, reject ) =>
        {
            const startTime = process.hrtime();

            this.sendMessage( delta )
            .then( _ =>
            {
                this._dispatcher.dispatch(
                    'delta-publish',
                    "Published " + delta.type + " delta with ts '"
                        + delta.timestamp + "' to '" + this._conf.exchange
                        + '" exchange',
                );

                console.log('#publish: '
                    + process.hrtime( startTime )[0] / 10000 );
                resolve();
                return;
            } )
            .catch( e =>
            {
                this._dispatcher.dispatch(
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
    sendMessage( delta: DeltaResult<any> ): Promise<NullableError>
    {
        return new Promise<NullableError>( ( resolve, reject ) =>
        {
            const startTime = process.hrtime();

            const ts          = this._ts_ctr();
            const headers     = { version: 1, created: ts };
            const delta_data  = this.avroFormat( delta.data );
            console.log('#sendmessage 1: '
                    + (process.hrtime( startTime )[ 1 ] / 10000) + 'ms');
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
            console.log('#sendmessage 2: '
                    + (process.hrtime( startTime )[ 1 ] / 10000) + 'ms');

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
            console.log('#sendmessage 3: '
                    + (process.hrtime( startTime )[ 1 ] / 10000) + 'ms');

            // we don't use a routing key; fanout exchange
            const published_successfully = this._channel.publish(
                this._conf.exchange,
                '',
                avro_buffer,
                { headers: headers },
            );

            if ( published_successfully )
            {
                console.log('#sendmessage 4: '
                    + (process.hrtime( startTime )[ 1 ] / 10000) + 'ms');
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
                this._dispatcher.dispatch(
                    'avro-err',
                    'No avro scheama found',
                );

                return null;
            }

            buffer = this._type.toBuffer( data );
        }
        catch( e )
        {
            this._dispatcher.dispatch(
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
