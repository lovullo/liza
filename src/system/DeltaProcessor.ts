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
import { MongoDeltaType } from "../system/db/MongoDeltaDao";
import { DeltaResult } from "../bucket/delta";
import { DocumentId } from "../document/Document";
import { AmqpPublisher } from "./AmqpPublisher";
import { EventEmitter } from "events";

/**
 * Process deltas for a quote and publish to a queue
 */
export class DeltaProcessor
{
    /** The ratedata delta type */
    readonly DELTA_RATEDATA: MongoDeltaType = 'ratedata';

    /** The data delta type */
    readonly DELTA_DATA: MongoDeltaType = 'data';


    /**
     * Initialize processor
     *
     * @param _dao       - Mongo collection
     * @param _publisher - Amqp Publisher
     * @param _emitter   - Event emiter instance
     */
    constructor(
        private readonly _dao:       DeltaDao,
        private readonly _publisher: AmqpPublisher,
        private readonly _emitter:   EventEmitter
    ) {}


    /**
     * Process unpublished deltas
     */
    process(): void
    {
        this._dao.getUnprocessedDocuments()
        .then( docs =>
        {
            docs.forEach( doc =>
            {
                const deltas             = this.getTimestampSortedDeltas( doc );
                const doc_id: DocumentId = doc.id;
                const last_updated_ts    = doc.lastUpdate;

                for ( let i = 0; i < deltas.length; i++ )
                {
                    const delta     = deltas[ i ];
                    const startTime = process.hrtime();
                    let   error     = null;

                    this._publisher.publish( delta )
                    .then( _ =>
                    {
                        this._dao.advanceDeltaIndex( doc_id, delta.type );
                    } )
                    .catch( err =>
                    {
                        this._dao.setErrorFlag( doc_id );

                        error = err;
                    } );

                    // Do not process any more deltas for
                    // this document if there was an error
                    if ( error )
                    {
                        this._emitter.emit(
                            'delta-process-error',
                            error,
                            doc_id + delta.timestamp + delta.type
                        );

                        return;
                    }
                    else
                    {
                        const elapsedTime = process.hrtime( startTime );

                        this._emitter.emit(
                            'delta-process-complete',
                            elapsedTime[ 1 ] / 10000
                        );
                    }
                };

                this._dao.markDocumentAsProcessed( doc_id, last_updated_ts )
                .then( _ =>
                {
                    this._emitter.emit(
                        'document-processed',
                        'Deltas on document ' + doc_id + ' processed '
                            + 'successfully. Document has been marked as '
                            + 'completely processed.'
                    );
                } )
                .catch( err =>
                {
                    this._emitter.emit( 'mongodb-err', err );
                } );
            } );
        } )
        .catch( err =>
        {
            this._emitter.emit( 'mongodb-err', err );
        } );
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
    getDeltas( doc: any, type: MongoDeltaType ): DeltaResult<any>[]
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