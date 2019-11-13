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

import { DocumentId } from "../../document/Document";
import { DeltaDao } from "./DeltaDao";
import { MongoCollection } from "mongodb";

export type MongoDeltaType = 'ratedata' | 'data';


/** Manage deltas */
export class MongoDeltaDao implements DeltaDao
{
    /** Collection used to store quotes */
    readonly COLLECTION: string = 'quotes';

    /** The ratedata delta type */
    static readonly DELTA_RATEDATA: string = 'ratedata';

    /** The data delta type */
    static readonly DELTA_DATA: string = 'data';

    /** The mongo quotes collection */
    private _collection?: MongoCollection | null;


    /**
     * Initialize connection
     *
     * @param _db Mongo db
     */
    constructor(
        private readonly _db: any,
    ) {}


    /**
     * Attempts to connect to the database
     *
     * connectError event will be emitted on failure.
     *
     * @return any errors that occured
     */
    init(): Promise<NullableError>
    {
        var dao = this;

        return new Promise( ( resolve, reject ) =>
        {
            // attempt to connect to the database
            this._db.open( function( err: any, db: any )
            {
                // if there was an error, don't bother with anything else
                if ( err )
                {
                    // in some circumstances, it may just be telling us that we're
                    // already connected (even though the connection may have been
                    // broken)
                    if ( err.errno !== undefined )
                    {
                        reject( 'Error opening mongo connection: ' + err );
                        return;
                    }
                }

                // quotes collection
                db.collection(
                    dao.COLLECTION,
                    function(
                        _err:       any,
                        collection: MongoCollection,
                    ) {
                        // for some reason this gets called more than once
                        if ( collection == null )
                        {
                            return;
                        }

                        // initialize indexes
                        collection.createIndex(
                            [ ['id', 1] ],
                            true,
                            function( err: any, _index: { [P: string]: any } )
                            {
                                if ( err )
                                {
                                    reject( 'Error creating index: ' + err );
                                    return;
                                }

                                // mark the DAO as ready to be used
                                dao._collection = collection;
                                resolve();
                                return;
                            }
                        );
                    }
                );
            });
        } );
    }


    /**
     * Get documents in need of processing
     *
     * @return documents in need of processing
     */
    getUnprocessedDocuments(): Promise<Record<string, any>[]>
    {
        var self = this;

        return new Promise( ( resolve, reject ) =>
        {
            if ( !self._collection )
            {
                reject( 'Database not ready' );
                return;
            }


            this._collection!.find(
                { published: false },
                {},
                function( _err, cursor )
                {
                    cursor.toArray( function( _err: NullableError, data: any[] )
                    {
                        // was the quote found?
                        if ( data.length == 0 )
                        {
                            resolve( [] );
                            return;
                        }

                        // return the quote data
                        resolve( data );
                    });
                }
            )
        } );
    }


    /**
     * Set the document's processed index
     *
     * @param doc_id   - Document whose index will be set
     * @param type     - Delta type
     */
    advanceDeltaIndex(
        doc_id:   DocumentId,
        type:     MongoDeltaType,
    ): Promise<NullableError>
    {
        return new Promise( ( resolve, reject ) =>
        {
            const inc_data: Record<string, any> = {};

            inc_data[ 'lastPublishDelta.' + type ] = 1;

            this._collection!.update(
                { id: doc_id },
                { $inc: inc_data },
                { upsert: false },
                function( err )
                {
                    if ( err )
                    {
                        reject( 'Error advancing delta index: ' + err )
                        return;
                    }

                    resolve();
                    return;
                }
            );
        } );
    }


    /**
     * Mark a given document as processed. First does a check to make sure that
     * the document does not have a newer update timestamp than the provided one
     *
     * @param doc_id         - The document to mark
     * @param last_update_ts - The last time this document was updated
     *
     * @return true if the document was successfully marked as processed
     */
    markDocumentAsProcessed(
        doc_id:         DocumentId,
        last_update_ts: UnixTimestamp,
    ): Promise<NullableError>
    {
        return new Promise( ( resolve, reject ) =>
        {
            this._collection!.update(
                { id: doc_id, lastUpdate: { $lte: last_update_ts } },
                { $set: { published: true } },
                { upsert: false },
                function( err )
                {
                    if ( err )
                    {
                        reject( "Error marking document as processed: " + err );
                        return;
                    }

                    resolve();
                    return;
                }
            );

        } );
    }
}

