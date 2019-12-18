/**
 * Delta Processor
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { DeltaDao } from '../system/db/DeltaDao';
import { DocumentMeta } from '../document/Document';
import { AmqpPublisher } from './AmqpPublisher';
import { context, hasContext } from '../error/ContextError';
import { EventEmitter } from 'events';
import {
    DeltaType,
    applyDelta,
    DeltaDocument,
    Delta,
    ReverseDelta,
} from '../bucket/delta';

/** Deltas and state of data prior to their application */
type DeltaState = [
    Delta<any>,
    Record<string, any>,
    Record<string, any>,
];


/**
 * Process deltas for a quote and publish to a queue
 *
 * TODO: Decouple from applyDelta
 */
export class DeltaProcessor
{
    /** The ratedata delta type */
    readonly DELTA_RATEDATA: DeltaType = 'ratedata';

    /** The data delta type */
    readonly DELTA_DATA: DeltaType = 'data';


    /**
     * Initialize processor
     *
     * @param _dao       - Delta dao
     * @param _publisher - Amqp Publisher
     * @param _emitter   - Event emiter instance
     */
    constructor(
        private readonly _dao:       DeltaDao,
        private readonly _publisher: AmqpPublisher,
        private readonly _emitter:   EventEmitter,
    ) {}


    /**
     * Process unpublished deltas
     */
    process(): Promise<void>
    {
        return this._dao.getUnprocessedDocuments()
            .then( docs => this._processNext( docs ) );
    }


    /**
     * Process the next document
     *
     * @param docs - list of documents to process
     */
    private _processNext( docs: DeltaDocument[] ): Promise<void>
    {
        const doc = docs.shift();

        if ( !doc )
        {
            return Promise.resolve();
        }

        return this._processDocument( doc )
            .then( _ => this._processNext( docs ) )
    }


    /**
     * Process an individual document
     *
     * @param doc - individual document to process
     */
    private _processDocument( doc: DeltaDocument ): Promise<void>
    {
        const deltas          = this._getTimestampSortedDeltas( doc );
        const bucket          = doc.data;
        const ratedata        = doc.ratedata || {};
        const meta            = {
            id:          doc.id,
            entity_name: doc.agentName,
            entity_id:   +doc.agentEntityId,
            startDate:   doc.startDate,
            lastUpdate:  doc.lastUpdate,
        };

        const history = this._applyDeltas( deltas, bucket, ratedata );

        return this._processNextDelta( meta, history )
            .then( _ =>
                this._dao.markDocumentAsProcessed( meta.id, meta.lastUpdate )
            )
            .then( _ =>
            {
                this._emitter.emit(
                    'document-processed',
                    {
                        doc_id:   meta.id,
                        quote_id: meta.id,
                    },
                );
            } )
            .catch( ( e: Error ) =>
            {
                if ( hasContext( e ) )
                {
                    const combined_context: Record<string, any> = {};
                    const error_context = e.context;

                    Object.keys( error_context ).forEach( ( key: string ) =>
                    {
                        combined_context[ key ] = error_context[ key ];
                    } );

                    combined_context[ 'doc_id' ]   = meta.id;
                    combined_context[ 'quote_id' ] = meta.id;

                    e = context( e, combined_context );
                }

                this._emitter.emit( 'error', e );
                return this._dao.setErrorFlag( meta.id );
            } );
    }


    /**
     * Produce states of buckets at each point in history
     *
     * For bucket data, each tuple will contain the state of the bucket
     * prior to the corresponding delta having been applied.  For rate data,
     * the tuple will also contain the state of the bucket at the point of
     * rating.
     *
     * @param deltas   - deltas to apply
     * @param bucket   - current state of bucket prior to deltas
     * @param ratedata - current state of ratedata prior to deltas
     *
     * @return deltas paired with state prior to its application
     */
    private _applyDeltas(
        deltas:   Delta<any>[],
        bucket:   Record<string, any>,
        ratedata: Record<string, any>,
    ): DeltaState[]
    {
        const pairs: DeltaState[] = [];

        let bucket_state   = bucket;
        let ratedata_state = ratedata;
        let i              = deltas.length;

        while ( i-- )
        {
            let delta = deltas[ i ];

            pairs[ i ] = [
                delta,
                bucket_state,
                ( delta.type === this.DELTA_RATEDATA ) ? ratedata_state : {},
            ];

            // Don't apply the final delta, since we won't use it
            if ( i === 0 )
            {
                break;
            }

            if ( delta.type === this.DELTA_DATA )
            {
                bucket_state = applyDelta(
                    Object.create( bucket_state ),
                    deltas[ i ].data,
                );
            }
            else
            {
                ratedata_state = applyDelta(
                    Object.create( ratedata_state ),
                    deltas[ i ].data,
                );
            }
        }

        return pairs;
    }


    /**
     * Process the next delta from the history
     *
     * @param meta    - document meta data
     * @param history - a history of deltas and their buckets (data, ratedata)
     */
    private _processNextDelta(
        meta:    DocumentMeta,
        history: DeltaState[],
    ): Promise<void>
    {
        if ( history.length === 0 )
        {
            return Promise.resolve();
        }

        const [ delta, bucket, ratedata ] = history[ 0 ];

        const delta_uid = meta.id + '_' + delta.timestamp + '_' + delta.type;

        this._emitter.emit( 'delta-process-start', delta_uid );

        return this._publisher.publish( meta, delta, bucket, ratedata )
            .then( _ => this._dao.advanceDeltaIndex( meta.id, delta.type ) )
            .then( _ => this._emitter.emit( 'delta-process-end', delta_uid ) )
            .then( _ => this._processNextDelta( meta, history.slice( 1 ) ) );
    }



    /**
     * Get sorted list of deltas
     *
     * @param doc - the document
     *
     * @return a list of deltas sorted by timestamp
     */
    private _getTimestampSortedDeltas( doc: DeltaDocument ): Delta<any>[]
    {
        const data_deltas     = this._getDeltas( doc, this.DELTA_RATEDATA );
        const ratedata_deltas = this._getDeltas( doc, this.DELTA_DATA );
        const deltas          = data_deltas.concat( ratedata_deltas );

        deltas.sort( this._sortByTimestamp );

        return deltas;
    }


    /**
     * Get trimmed delta list
     *
     * @param doc  - the document
     * @param type - the delta type to get
     *
     * @return a trimmed list of deltas
     */
    private _getDeltas( doc: DeltaDocument, type: DeltaType ): Delta<any>[]
    {
        const deltas_obj           = doc.rdelta || <ReverseDelta<any>>{};
        const deltas: Delta<any>[] = deltas_obj[ type ] || [];

        // Get type specific delta index
        let published_count = 0;
        if ( doc.totalPublishDelta )
        {
            published_count = doc.totalPublishDelta[ type ] || 0;
        }

        // Only return the unprocessed deltas
        const deltas_trimmed = deltas.slice( published_count );

        // Mark each delta with its type
        deltas_trimmed.forEach( delta =>
        {
            delta.type = type;
        } );

        return deltas_trimmed;
    }


    /**
     * Sort an array of deltas by timestamp
     *
     * @param a - The first delta to compare
     * @param b - The second delta to compare
     *
     * @return a sort value
     */
    private _sortByTimestamp( a: Delta<any>, b: Delta<any> ): number
    {
        if ( a.timestamp < b.timestamp )
        {
            return -1;
        }

        if ( a.timestamp > b.timestamp ) {
            return 1;
        }

        return 0;
    }
}
