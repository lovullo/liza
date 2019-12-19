/**
 * Message Writer
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
 * Write a message to be published to a queue
 */
import { DocumentMeta } from '../../document/Document';
import { Delta } from '../../bucket/delta';
import { AvroEncoderCtr } from '../avro/AvroFactory';
import { AvroSchema } from 'avro-js';
import { MessageWriter } from '../MessageWriter';
import { context } from '../../error/ContextError';


export class V1MessageWriter implements MessageWriter
{
    /** A mapping of which delta type translated to which avro event */
    readonly DELTA_MAP: Record<string, string> = {
        data:     'STEP_SAVE',
        ratedata: 'RATE',
    };


    /**
     * Delta publisher
     *
     * @param _encoder_ctr - a factory function to create an avro encoder
     * @param _conn        - the amqp connection
     */
    constructor(
        private readonly _encoder_ctor: AvroEncoderCtr,
        private readonly _schema:       AvroSchema,
    ) {}


    /**
     * Write the data to a message
     *
     * @param ts       - timestamp
     * @param meta     - document meta data
     * @param delta    - current delta
     * @param bucket   - data bucket
     * @param ratedata - ratedata bucket
     */
    write(
        ts:          UnixTimestamp,
        meta:        DocumentMeta,
        delta:       Delta<any>,
        bucket:      Record<string, any>,
        ratedata:    Record<string, any>,
    ): Promise<Buffer>
    {
        const avro_object = this._avroFormat(
            ts,
            meta,
            delta,
            bucket,
            ratedata,
        );

        return this.avroEncode( avro_object );
    }


    /**
     * Format the avro data with data type labels
     *
     * @param ts       - timestamp
     * @param meta     - document meta data
     * @param delta    - current delta
     * @param bucket   - data bucket
     * @param ratedata - ratedata bucket
     *
     * @return the formatted data
     */
    private _avroFormat(
        ts:          UnixTimestamp,
        meta:        DocumentMeta,
        delta:       Delta<any>,
        bucket:      Record<string, any>,
        ratedata:    Record<string, any>,
    ): any
    {
        const delta_formatted    = this.setDataTypes( delta.data );
        const bucket_formatted   = this.setDataTypes( bucket );
        const ratedata_formatted = this.setDataTypes( ratedata );
        const event_id           = this.DELTA_MAP[ delta.type ];
        const start_date_ms      = { "long": meta.startDate * 1000 };
        const last_update_ms     = { "long": meta.lastUpdate * 1000 };
        const ts_ms              = ts * 1000;

        return {
            event: {
                id:    event_id,
                ts:    ts_ms,
                actor: 'SERVER',
                step:  null,
            },
            document: {
                id:       meta.id,
                created:  start_date_ms,
                modified: last_update_ms,
            },
            session: {
                Session: {
                    entity_id:   meta.entity_id,
                    entity_name: meta.entity_name,
                },
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
                    id:      meta.program,
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
                this._schema.isValid(
                    data,
                    {
                        errorHook: ( keys: any, vals: any) =>
                        {
                            throw context(
                                new Error( 'Invalid Avro Schema' ),
                                {
                                    invalid_paths: keys,
                                    invalid_data:  vals,
                                }
                            );
                        }
                    }
                );

                const encoder = this._encoder_ctor( this._schema )

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
     * @param data      - the data to format
     * @param top_level - whether we are at the top level of the recursion
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
                        // Do not include "private" keys
                        if ( key.startsWith( '__' ) )
                        {
                            return;
                        }

                        const datum = this.setDataTypes( data[ key ], false );

                        datum_formatted[ key ] = datum;

                    } );

                    data_formatted = ( top_level )
                        ? datum_formatted
                        : { 'map': datum_formatted };
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