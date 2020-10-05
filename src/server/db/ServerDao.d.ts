/**
 * General server database operations
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
 * This interface was created to satisfy MongoServerDao and may not be
 * sufficiently general for other database abstractions.
 */

import {ClassificationData, WorksheetData} from '../rater/Rater';
import {PositiveInteger} from '../../numeric';
import {QuoteId} from '../../document/Document';
import {ServerSideQuote} from '../quote/ServerSideQuote';

/** Success or failure callback */
export type Callback = (quote: ServerSideQuote) => void;

/**
 * Database abstraction
 */
export interface ServerDao {
  /**
   * Saves a quote to the database
   *
   * A full save will include all metadata.
   *
   * @param quote     - the quote to save
   * @param success   - function to call on success
   * @param failure   - function to call if save fails
   * @param save_data - quote data to save (optional)
   * @param push_data - quote data to push (optional)
   */
  saveQuote(
    quote: ServerSideQuote,
    success?: Callback,
    failure?: Callback,
    save_data?: Record<string, any>,
    push_data?: Record<string, any>
  ): this;

  /**
   * Merges quote data with the existing (rather than overwriting)
   *
   * @param quote   - quote to save
   * @param data    - quote data
   * @param success - successful callback
   * @param failure - failure callback
   */
  mergeData(
    quote: ServerSideQuote,
    data: any,
    success?: Callback,
    failure?: Callback
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
    quote: ServerSideQuote,
    data: Record<string, any>,
    success?: Callback,
    failure?: Callback
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
    quote: ServerSideQuote,
    success?: Callback,
    failure?: Callback
  ): this;

  /**
   * Ensure the quote has pending rates
   *
   * @param quote - the quote to validate
   *
   * @returns a promise with the quote
   */
  ensurePendingRate(quote: ServerSideQuote): Promise<ServerSideQuote>;

  /**
   * Save document metadata (meta field on document)
   *
   * Only the provided indexes will be modified (that is---data will be
   * merged with what is already in the database).
   *
   * @param quote    - destination quote
   * @param new_meta - bucket-formatted data to write
   * @param success  - callback on success
   * @param failure  - callback on error
   */
  saveQuoteMeta(
    quote: ServerSideQuote,
    new_meta: Record<string, any>,
    success?: Callback,
    failure?: Callback
  ): void;

  /**
   * Saves the quote lock state to the database
   *
   * @param quote   - the quote to save
   * @param success - function to call on success
   * @param failure - function to call if save fails
   */
  saveQuoteLockState(
    quote: ServerSideQuote,
    success?: Callback,
    failure?: Callback
  ): this;

  /**
   * Set worksheet data
   *
   * @param qid      - The quote id
   * @param data     - worksheet data
   * @param failure  - a function to call on error
   */
  setWorksheets(qid: QuoteId, data: any, failure?: NodeCallback<void>): void;

  /**
   * Retrieve worksheet data
   *
   * @param qid      - the quote id
   * @param supplier - the supplier to retrieve the worksheet for
   * @param index    - the worksheet index
   *
   * @return Promise with worksheet data
   */
  getWorksheet(
    qid: QuoteId,
    supplier: string,
    index: PositiveInteger
  ): Promise<WorksheetData>;
}
