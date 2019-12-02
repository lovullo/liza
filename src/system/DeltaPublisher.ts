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
import { Delta } from '../bucket/delta';
import { EventEmitter } from "events";
import { DocumentId } from '../document/Document';
import { context } from '../error/ContextError';
import { AmqpError } from '../error/AmqpError';
import { AvroSchema, AvroEncoderCtr } from './avro/AvroFactory';
import { AmqpConnection } from './amqp/AmqpConnection';


const avro = require( 'avro-js' );

export class DeltaPublisher implements AmqpPublisher
{
    /** The avro schema */
    private _schema: AvroSchema;

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
     * @param _emitter     - event emitter instance
     * @param _ts_ctr      - a timestamp constructor
     * @param _encoder_ctr - a factory function to create an avro encoder
     * @param _conn        - the amqp connection
     */
    constructor(
        private readonly _emitter:     EventEmitter,
        private readonly _ts_ctr:      () => UnixTimestamp,
        private readonly _encoder_ctr: AvroEncoderCtr,
        private readonly _conn:        AmqpConnection,
    ) {
        this._schema = avro.parse( this.SCHEMA_PATH );
    }


    /**
     * Publish quote message to exchange post-rating
     *
     * @param doc_id   - The doc_id
     * @param delta    - The delta
     * @param bucket   - The bucket
     * @param ratedata - The ratedata bucket
    */
   publish(
        doc_id:   DocumentId,
        delta:    Delta<any>,
        bucket:   Record<string, any>,
        ratedata: Record<string, any> = {},
    ): Promise<void>
    {
        return this._sendMessage( doc_id, delta, bucket, ratedata )
            .then( _ =>
            {
                this._emitter.emit(
                    'delta-publish',
                    {
                        delta: delta,
                        exchange: this._conn.getExchangeName(),
                    }
                );
            } );
    }


    /**
     * Send message to exchange
     *
     * @param doc_id   - The doc_id
     * @param delta    - The delta to publish
     * @param bucket   - The bucket
     * @param ratedata - The ratedata bucket
     *
     * @return whether publish was successful
     */
    private _sendMessage(
        doc_id:   DocumentId,
        delta:    Delta<any>,
        bucket:   Record<string, any>,
        ratedata: Record<string, any>,
    ): Promise<void>
    {
        const ts          = this._ts_ctr();
        const headers     = { version: 1, created: ts };
        const avro_object = this._avroFormat(
            ts,
            doc_id,
            delta,
            bucket,
            ratedata,
        );

        return this.avroEncode( avro_object )
            .then( ( avro_buffer ) =>
            {
                const channel = this._conn.getAmqpChannel();

                if ( !channel )
                {
                    return Promise.reject( context (
                        new AmqpError( 'Error sending message: No channel' ),
                        {
                            doc_id:     doc_id,
                            delta_type: delta.type,
                            delta_ts:   delta.timestamp,
                        },
                    ) );
                }

                // we don't use a routing key; fanout exchange
                const published_successfully = channel.publish(
                    this._conn.getExchangeName(),
                    '',
                    avro_buffer,
                    { headers: headers },
                );

                if ( !published_successfully )
                {
                    return Promise.reject( context(
                        new Error ( 'Delta publish failed' ),
                        {
                            doc_id:     doc_id,
                            delta_type: delta.type,
                            delta_ts:   delta.timestamp,
                        }
                    ) );
                }

                return Promise.resolve();
            } );
    }


    /**
     * Throw an error with specific information if the schema is invalid
     *
     * @param schema - Avro schema
     * @param data   - Data to encode
     */
    private _assertValidAvro(
        schema: AvroSchema,
        data: Record<string, any>,
    ): void
    {
        schema.isValid( data, { errorHook: hook } );

        function hook( keys: any, vals: any) {
            throw context( new Error( 'Invalid Avro Schema' ),
                {
                    invalid_paths: keys,
                    invalid_data:  vals,
                }
            );
        }
    }


    /**
     * Format the avro data with data type labels
     *
     * @param ts       - a timestamp
     * @param doc_id   - the document id
     * @param delta    - the current delta
     * @param bucket   - the data bucket
     * @param ratedata - the ratedata bucket
     *
     * @return the formatted data
     */
    private _avroFormat(
        ts:       UnixTimestamp,
        doc_id:   DocumentId,
        delta:    Delta<any>,
        bucket:   Record<string, any>,
        ratedata: Record<string, any>,
    ): any
    {
        const delta_formatted    = this.setDataTypes( delta.data );
        const bucket_formatted   = this.setDataTypes( bucket );
        const ratedata_formatted = this.setDataTypes( ratedata );
        const event_id           = this.DELTA_MAP[ delta.type ];

        return {
            event: {
                id:    event_id,
                ts:    ts,
                actor: 'SERVER',
                step:  null,
            },
            document: {
                id: doc_id
            },
            data: {
                Data: {
                    bucket: bucket_formatted,
                },
            },
            ratedata: {
                Data: {
                    bucket: ratedata_formatted,
                },
            },
            delta: {
                Data: {
                    bucket: delta_formatted,
                },
            },
            program: {
                Program: {
                    id:      'quote_server',
                    version: '',
                },
            },
        }
    }


    /**
     * Encode the data in an avro buffer
     *
     * @param data - the data to encode
     *
     * @return the avro buffer or null if there is an error
     */
    avroEncode( data: Record<string, any> ): Promise<Buffer>
    {
        return new Promise<Buffer>( ( resolve, reject ) =>
        {
            const bufs: Buffer[] = [];

            try
            {
                this._assertValidAvro( this._schema, data )

                const encoder = this._encoder_ctr( this._schema )

                encoder.on('data', ( buf: Buffer ) => { bufs.push( buf ) } )
                encoder.on('error', ( err: Error ) => { reject( err ); } )
                encoder.on('end', () => { resolve( Buffer.concat( bufs ) ) } )
                encoder.end( data );
            }
            catch ( e )
            {
                reject( e );
            }
        } );
    }


    /**
     * Format the data for avro by add type specifications to the data
     *
     * @param data - the data to format
     *
     * @return the formatted data
     */
    setDataTypes( data: any, top_level: boolean = true ): any
    {
        let data_formatted: any = {};

        switch( typeof( data ) )
        {
            case 'object':
                if ( data == null )
                {
                    return null;
                }
                else if ( Array.isArray( data ) )
                {
                    let arr: any[] = [];

                    data.forEach( ( datum ) =>
                    {
                        arr.push( this.setDataTypes( datum, false ) );
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
                        const datum = this.setDataTypes( data[ key ], false );

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
