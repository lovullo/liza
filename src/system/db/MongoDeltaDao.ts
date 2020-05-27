/**
 * Delta data access
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
 *
 * Get deltas from the mongo document in order to process and publish them
 */

import { DocumentId } from '../../document/Document';
import { DeltaDao } from './DeltaDao';
import { MongoCollection } from 'mongodb';
import { context } from '../../error/ContextError';
import { DaoError } from '../../error/DaoError';
import { DeltaType, DeltaDocument } from '../../bucket/delta';

/** Manage deltas */
export class MongoDeltaDao implements DeltaDao
{
    /** The ratedata delta type */
    static readonly DELTA_RATEDATA: string = 'ratedata';

    /** The data delta type */
    static readonly DELTA_DATA: string = 'data';

    /** The document fields to read */
    readonly RESULT_FIELDS: Record<string, number> = {
        id:                1,
        programId:         1,
        agentName:         1,
        agentEntityId:     1,
        startDate:         1,
        lastUpdate:        1,
        quoteExpDate:      1,
        quoteSetId:        1,
        data:              1,
        ratedata:          1,
        rdelta:            1,
        totalPublishDelta: 1,
    };


    /**
     * Initialize connection
     *
     * @param _collection - Mongo db collection
     */
    constructor(
        private readonly _collection: MongoCollection,
        private readonly _env:        string,
    ) {}


    /**
     * Get documents in need of processing
     *
     * @return documents in need of processing
     */
    getUnprocessedDocuments(): Promise<DeltaDocument[]>
    {
        return new Promise( ( resolve, reject ) =>
        {
            // documents that have rates pending should not be processed yet
            this._collection.find(
                {
                    published:  false,
                    deltaError: { $ne: true },
                    'ratedata.__rate_pending': { $in: [ [ 0 ], null ] },
                    env:        this._env,
                },
                { fields: this.RESULT_FIELDS },
                ( e, cursor ) =>
                {
                    if ( e )
                    {
                        reject(
                            new DaoError(
                                'Error fetching unprocessed documents: ' + e
                            )
                        );
                        return
                    }

                    cursor.toArray( ( e: Error, data: DeltaDocument[] ) =>
                    {
                        if ( e )
                        {
                            reject(
                                new DaoError(
                                    'Error fetching array from cursor: ' + e
                                )
                            );
                            return;
                        }

                        resolve( data );
                    } );
                }
            )
        } );
    }


    /**
     * Set the document's processed index
     *
     * @param doc_id - Document whose index will be set
     * @param type   - Delta type
     */
    advanceDeltaIndex( doc_id: DocumentId, type: DeltaType ): Promise<void>
    {
        return new Promise( ( resolve, reject ) =>
        {
            const inc_data: Record<string, any> = {};

            inc_data[ 'totalPublishDelta.' + type ] = 1;

            this._collection.update(
                { id: doc_id },
                { $inc: inc_data },
                { upsert: false },
                e =>
                {
                    if ( e )
                    {
                        reject( context(
                            new DaoError( 'Error advancing delta index: ' + e ),
                            {
                                doc_id:   doc_id,
                                quote_id: doc_id,
                                type:     type,
                            }
                        ) );
                        return;
                    }

                    resolve();
                }
            );
        } );
    }


    /**
     * Mark a given document as processed.
     *
     * First does a check to make sure that
     * the document does not have a newer update timestamp than the provided one
     *
     * @param doc_id         - The document to mark
     * @param last_update_ts - The last time this document was updated
     */
    markDocumentAsProcessed(
        doc_id:         DocumentId,
        last_update_ts: UnixTimestamp,
    ): Promise<void>
    {
        return new Promise( ( resolve, reject ) =>
        {
            this._collection.update(
                { id: doc_id, lastUpdate: { $lte: last_update_ts } },
                { $set: { published: true } },
                { upsert: false },
                e =>
                {
                    if ( e )
                    {
                        reject( context(
                            new DaoError(
                                'Error marking document as processed: ' + e
                            ),
                            {
                                doc_id:         doc_id,
                                quote_id:       doc_id,
                                last_update_ts: last_update_ts,
                            }
                        ) );
                        return;
                    }

                    resolve();
                    return;
                }
            );
        } );
    }


    /**
     * Flag the document as being in an error state
     *
     * @param doc_id - The document to flag
     *
     * @return any errors that occurred
     */
    setErrorFlag( doc_id: DocumentId ): Promise<void>
    {
        return new Promise( ( resolve, reject ) =>
        {
            this._collection.update(
                { id: doc_id },
                { $set: { deltaError: true } },
                { upsert: false },
                e =>
                {
                    if ( e )
                    {
                        reject( context(
                            new DaoError(
                                'Failed setting error flag: ' + e
                            ),
                            {
                                doc_id:   doc_id,
                                quote_id: doc_id,
                            }
                        ) );
                        return;
                    }

                    resolve();
                    return;
                }
            );
        } );
    }


    /**
     * Get a count of documents in an error state
     *
     * @return a count of the documents in an error state
     */
    getErrorCount(): Promise<number>
    {
        return new Promise( ( resolve, reject ) =>
        {
            this._collection.find(
                {
                    deltaError: true,
                    env:        this._env,
                },
                {},
                ( e, cursor ) =>
                {
                    if ( e )
                    {
                        reject(
                            new Error(
                                'Failed getting error count: ' + e
                            )
                        );
                        return;
                    }

                    cursor.toArray( ( e: NullableError, data: any[] ) =>
                    {
                        if ( e )
                        {
                            reject( context(
                                new DaoError(
                                    'Failed getting error count: ' + e
                                ),
                                {
                                    cursor: cursor,
                                }
                            ) );
                            return;
                        }

                        resolve( data.length );
                    });
                }
            )
        } );
    }
}

