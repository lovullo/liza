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
import { EventEmitter } from 'events';
import { DocumentMeta } from '../document/Document';
import { context } from '../error/ContextError';
import { AmqpError } from '../error/AmqpError';
import { MessageWriter } from './MessageWriter';

import { AmqpConnection } from './amqp/AmqpConnection';


export class DeltaPublisher implements AmqpPublisher
{
    /**
     * Delta publisher
     *
     * @param _emitter - event emitter instance
     * @param _ts_ctr  - a timestamp constructor
     * @param _conn    - the amqp connection
     * @param _writer  - message writer
     */
    constructor(
        private readonly _emitter: EventEmitter,
        private readonly _ts_ctr:  () => UnixTimestamp,
        private readonly _conn:    AmqpConnection,
        private readonly _writer:  MessageWriter,
    ) {}


    /**
     * Publish quote message to exchange post-rating
     *
     * @param meta     - document meta data
     * @param delta    - delta
     * @param bucket   - bucket
     * @param ratedata - rate data bucket
    */
    publish(
        meta:     DocumentMeta,
        delta:    Delta<any>,
        bucket:   Record<string, any>,
        ratedata: Record<string, any>,
    ): Promise<void>
    {
        const ts          = this._ts_ctr();
        const headers     = { version: 1, created: ts };

        return this._writer.write(
            ts,
            meta,
            delta,
            bucket,
            ratedata
        ).then( ( avro_buffer: Buffer ) =>
            {
                const channel = this._conn.getAmqpChannel();

                if ( !channel )
                {
                    throw context(
                        new AmqpError( 'Error sending message: No channel' ),
                        {
                            doc_id:     meta.id,
                            quote_id:   meta.id,
                            delta_type: delta.type,
                            delta_ts:   delta.timestamp,
                        },
                    );
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
                    throw context(
                        new Error ( 'Delta publish failed' ),
                        {
                            doc_id:     meta.id,
                            quote_id:   meta.id,
                            delta_type: delta.type,
                            delta_ts:   delta.timestamp,
                        }
                    );
                }
            } )
            .then( ( _: any ) =>
            {
                this._emitter.emit(
                    'delta-publish',
                    {
                        doc_id:   meta.id,
                        quote_id: meta.id,
                        type:     delta.type,
                        delta_ts: delta.timestamp,
                        exchange: this._conn.getExchangeName(),
                    }
                );
            } );
    }
}
