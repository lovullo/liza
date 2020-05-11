/**
 * Augments a quote with additional data for use by the quote server
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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
 * @todo Use ``document'' terminology in place of ``quote''
 */

import { Program } from "../../program/Program";
import { BaseQuote } from "../../quote/BaseQuote";
import { QuoteDataBucket } from "../../bucket/QuoteDataBucket";
import { RateResult } from "../rater/Rater";


export declare class ServerSideQuote extends BaseQuote
{
    /**
     * Last rated date, if any
     *
     * @return last rated date
     */
    getRatedDate(): UnixTimestamp;


    /**
     * Set the timestamp of the first time quote was rated
     *
     * @param timestamp - Unix timestamp representing first rated date
     *
     * @return self
     */
    setRatedDate( timestamp: UnixTimestamp ): this;


    /**
     * Set rating bucket
     *
     * @param bucket - the data bucket
     */
    setRateBucket( bucket: QuoteDataBucket ): this;


    /**
     * Set rating data
     *
     * @param data - rating data
     */
    setRatingData( data: Record<string, any> ): this;


    /**
     * Get rating data
     *
     * @return rating data
     */
    getRatingData(): RateResult;


    /**
     * Metadata bucket
     *
     * @return the metadata bucket
     */
    getMetabucket(): QuoteDataBucket;


    /**
     * Get the program version
     *
     * @return program version
     */
    getProgramVersion(): string;


    /**
     * Set metabucket data
     *
     * @param data - key/value data
     */
    setMetadata( data: Record<string, any> ): this


    /**
     * Set the number of retries attempted
     *
     * @param {number} attempts the number of attempts
     */
    setRetryAttempts( attempts: number ): this;


    /**
     * Get the number of retries attempted
     *
     * @return {number} the number of attempts that have been made
     */
    getRetryAttempts(): number;


    /**
     * Increments the number of retries attempted
     *
     * @return {ServerSideQuote} self
     */
    retryAttempted(): this;

    /**
     * Retrieve the number of raters that are pending
     *
     * @param data (optional) Rate data
     *
     * @return the number of retries pending
     */
    getRetryCount( data?: Record<string, any> ): number;

    /**
     * Sets the quote's initial rated date
     *
     * @param time initial rated date as a Unix timestamp
     */
    setInitialRatedDate( time: number ): this;

    /**
     * Returns the quote's expiration date
     *
     * @return quote's expiration date
     */
    getExpirationDate(): number;
}
