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

import { DeltaDao } from "../system/db/DeltaDao";
import { DeltaResult, DeltaType, applyDelta } from "../bucket/delta";
import { DocumentId } from "../document/Document";
import { AmqpPublisher } from "./AmqpPublisher";
import { EventEmitter } from "events";


/**
 * Process deltas for a quote and publish to a queue
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
            .then( docs => this._processNext( docs ) )
            .catch( err => { this._emitter.emit( 'dao-err', err ) } );
    }


    private _processNext( docs: any ): Promise<void>
    {
        if ( docs.length === 0 )
        {
            return Promise.resolve();
        }

        const doc = docs.shift();

        return this._processDocument( doc )
            .then( _ => this._processNext( docs ) );
    }


    private _processDocument( doc: Record<string, any> ): Promise<void>
    {
        const deltas             = this.getTimestampSortedDeltas( doc );
        const doc_id: DocumentId = doc.id;
        const bucket             = doc.data;
        const last_updated_ts    = doc.lastUpdate;

        return this._processNextDelta( deltas, bucket, doc_id )
            .then( _ =>
                this._dao.markDocumentAsProcessed( doc_id, last_updated_ts )
            )
            .then( _ =>
            {
                this._emitter.emit(
                'document-processed',
                'Deltas on document ' + doc_id + ' processed '
                    + 'successfully. Document has been marked as '
                    + 'completely processed.'
                );
            } )
            .catch( e =>
            {
                this._emitter.emit( 'delta-err', e );
                this._dao.setErrorFlag( doc_id );
            } );
    }


    private _processNextDelta(
        deltas: DeltaResult<any>[],
        bucket: Record<string, any>,
        doc_id: DocumentId,
    ): Promise<void>
    {
        if ( deltas.length === 0 )
        {
            return Promise.resolve();
        }

        const delta = deltas.shift();

        if ( !delta )
        {
            return Promise.reject( new Error( 'Undefined delta' ) );
        }

        const delta_uid = doc_id + '_' + delta.timestamp + '_' + delta.type;

        this._emitter.emit( 'delta-process-start', delta_uid );

        const new_bucket = applyDelta( bucket, delta.data );

        return this._publisher.publish( delta, new_bucket, doc_id )
            .then( _ => this._dao.advanceDeltaIndex( doc_id, delta.type ) )
            .then( _ => this._emitter.emit( 'delta-process-end', delta_uid ) )
            .then( _ => this._processNextDelta( deltas, new_bucket, doc_id ) );
    }



    /**
     * Get sorted list of deltas
     *
     * @param doc - the document
     *
     * @return a list of deltas sorted by timestamp
     */
    getTimestampSortedDeltas( doc: any ): DeltaResult<any>[]
    {
        const data_deltas     = this.getDeltas( doc, this.DELTA_RATEDATA );
        const ratedata_deltas = this.getDeltas( doc, this.DELTA_DATA );
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
    getDeltas( doc: any, type: DeltaType ): DeltaResult<any>[]
    {
        const deltas_obj                 = doc.rdelta || {};
        const deltas: DeltaResult<any>[] = deltas_obj[ type ] || [];

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
    private _sortByTimestamp( a: DeltaResult<any>, b: DeltaResult<any> ): number
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