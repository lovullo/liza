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
import { PositiveInteger } from "../../numeric";
import { MongoCollection } from "mongodb";
import { DeltaDao } from "./DeltaDao";


export type MongoDeltaType = 'ratedata' | 'data';


/** Manage deltas */
export class MongoDeltaDao implements DeltaDao
{
    /** The ratedata delta type */
    static readonly DELTA_RATEDATA: string = 'ratedata';

    /** The data delta type */
    static readonly DELTA_DATA: string = 'data';


    /**
     * Initialize connection
     *
     * @param _collection Mongo collection
     */
    constructor(
        private readonly _collection: MongoCollection,
    ) {}


    /**
     * Get documents in need of processing
     *
     * @return documents in need of processing
     */
    getUnprocessedDocuments(
        callback: ( data: Record<string, any>[] ) => void,
    ): this
    {
        var self = this;

        this._collection.find(
            { published: false },
            {},
            function( _err, cursor )
            {
                cursor.toArray( function( _err: NullableError, data: any[] )
                {
                    // was the quote found?
                    if ( data.length == 0 )
                    {
                        callback.call( self, [] );

                        return;
                    }

                    // return the quote data
                    callback.call( self, data );
                });
            }
        )

        return this;
    }


    /**
     * Set the document's processed index
     *
     * @param doc_id   - Document whose index will be set
     * @param type     - Delta type
     * @param index    - Index to set
     * @param callback - Callback function
     */
    advanceDeltaIndexByType(
        doc_id:   DocumentId,
        type:     MongoDeltaType,
        index:    PositiveInteger,
        callback: ( err: NullableError, indexAdvanced: boolean ) => void,
    ): this
    {
        var self = this;

        const set_data: Record<string, any> = {};

        set_data[ 'lastPublishDelta.' + type ] = index;

        this._collection.update(
            { id: doc_id },
            { $set: set_data },
            { upsert: true },
            function( err )
            {
                if ( err )
                {
                    callback.call( self, err, false );

                    return;
                }

                callback.call( self, null, true );

                return;
            }
        );

        return this;
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
        doc_id:          DocumentId,
        last_update_ts:  UnixTimestamp,
        callback:        ( err: NullableError, indexAdvanced: boolean ) => void,
    ): this
    {
        var self = this;

        this._collection.update(
            { id: doc_id, lastUpdate: { $gt: last_update_ts } },
            { $set: { processed: true } },
            { upsert: false },
            function( err, result )
            {
                if ( err )
                {
                    callback.call( self, err, false );

                    return;
                }

                console.log( '-------', result );

                callback.call( self, null, true );

                return;
            }
        );

        return this;
    }
}

