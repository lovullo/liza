/**
 * Mongo DB DAO for program server
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

import { ClassificationData, WorksheetData } from "../rater/Rater";
import { PositiveInteger } from "../../numeric";
import { QuoteId } from "../../document/Document";
import { ServerSideQuote } from "../quote/ServerSideQuote";

/** Success or failure callback */
type Callback = ( quote: ServerSideQuote ) => void;


/**
 * MongoDB-backed data store
 */
export declare class MongoServerDao
{
    /**
     * Saves a quote to the database
     *
     * A full save will include all metadata.
     *
     * @param quote     - the quote to save
     * @param success   - function to call on success
     * @param failure   - function to call if save fails
     * @param save_data - quote data to save (optional)
     */
    saveQuote(
        quote:     ServerSideQuote,
        success:   Callback,
        failure:   Callback,
        save_data: Record<string, any>,
    ): this;


    /**
     * Merges bucket data with the existing bucket (rather than overwriting the
     * entire bucket)
     *
     * @param quote   - quote to save
     * @param data    - bucket data
     * @param success - successful callback
     * @param failure - failure callback
     */
    mergeBucket(
        quote:   ServerSideQuote,
        data:    Record<string, any>,
        success: Callback,
        failure: Callback,
    ): this;


    /**
     * Save quote classification data
     *
     * @param quote   - quote to save
     * @param classes - classification data
     * @param success - successful callback
     * @param failure - failure callback
     */
    saveQuoteClasses(
        quote:   ServerSideQuote,
        classes: ClassificationData,
        success: Callback,
        failure: Callback,
    ): this;


    /**
     * Saves the quote state to the database
     *
     * The quote state includes the current step, the top visited step and the
     * explicit lock message.
     *
     * @param quote   - the quote to save
     * @param success - function to call on success
     * @param failure - function to call if save fails
     */
    saveQuoteState(
        quote:   ServerSideQuote,
        success: Callback,
        failure: Callback,
    ): this;


    /**
     * Saves the quote lock state to the database
     *
     * @param quote   - the quote to save
     * @param success - function to call on success
     * @param failure - function to call if save fails
     */
    saveQuoteLockState(
        quote:   ServerSideQuote,
        success: Callback,
        failure: Callback,
    ): this


    /**
     * Save worksheet data
     *
     * @param qid      - quote identifier
     * @param data     - worksheet data
     * @param callback - callback
     */
    setWorksheets(
        qid:      QuoteId,
        data:     WorksheetData,
        callback: NodeCallback<void>,
    ): this;


    /**
     * Retrieve worksheet data
     *
     * @param qid      - quote identifier
     * @param supplier - supplier id
     * @param index    - worksheet index
     * @param callback - callback
     */
    getWorksheet(
        qid:      QuoteId,
        supplier: string,
        index:    PositiveInteger,
        callback: ( data: WorksheetData | null ) => void,
    ): this;
}
