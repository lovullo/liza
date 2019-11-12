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
 * These types are used to describe the structure of the token data as it
 * is stored in Mongo.  It has a number of undesirable properties and
 * duplicates data---this was intended to make querying easier and work
 * around Mongo limitations.
 *
 * This structure can be changed in the future, but we'll need to maintain
 * compatibility with the existing data.
 */

import { DocumentId } from "../../document/Document";
import { PositiveInteger } from "../../numeric";


/** Manage deltas */
export interface DeltaDao
{
    /**
     * Get documents in need of processing
     *
     * @return documents in need of processing
     */
    getUnprocessedDocuments(
        callback: ( data: Record<string, any>[] ) => void,
    ): this;


    /**
     * Set the document's processed index
     *
     * @param doc_id - The document whose index will be set
     * @param index  - The index to set
     */
    advanceDeltaIndexByType(
        doc_id:   DocumentId,
        type:     string,
        index:    PositiveInteger,
        callback: ( err: NullableError, indexHasAdvanced: boolean ) => void,
    ): this;


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
        callback: ( err: NullableError, markedSuccessfully: boolean ) => void,
    ): this;
}

