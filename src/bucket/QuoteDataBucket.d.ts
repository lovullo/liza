/**
 * Key/value store
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
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
 */


import { PositiveInteger } from "../numeric";


/**
 * General key/value store for document
 *
 * The term "Quote" here is an artifact from the initial design of the
 * system used for insurance quoting.  It will be renamed.
 *
 * @todo Rename to DocumentDataBucket
 */
export declare class QuoteDataBucket
{
    /**
     * Triggered when data in the bucket is updated, before it's committed
     */
    static readonly EVENT_UPDATE: string;


    /**
     * Explicitly sets the contents of the bucket
     *
     * @param data - associative array of the data
     */
    setValues( data: Record<string, any> ): this;


    /**
     * Alias of setValues
     */
    setCommittedValues(): this;


    /**
     * Clears all data from the bucket
     */
    clear(): this;


    /**
     * Overwrites values in the original bucket
     *
     * For this buckeet, overwriteValues() is an alias for setValues() without
     * index merging. However, other Bucket implementations may handle it
     * differently.
     *
     * @param data - associative array of the data
     */
    overwriteValues( data: Record<string, any> ): this;


    /**
     * Calls a function for each each of the values in the bucket
     *
     * Note: This format is intended to be consistent with Array.forEach()
     *
     * @param callback - function to call for each value in the bucket
     */
    each( callback: ( val: any, key: string) => {} ): this;


    /**
     * Calls a function for each each of the values in the bucket matching the
     * given predicate
     *
     * @param pred - predicate
     * @param c    - function to call for each value in the bucket
     */
    filter(
        pred: ( key: string ) => {},
        _c:   ( val: any, key: string) => {}
    ): this;


    /**
     * Returns the data for the requested field
     *
     * @param name - name of the field (with or without trailing brackets)
     *
     * @return data for the field, or empty array if none
     */
    getDataByName( name: string ): any;


    /**
     * Returns the data as a JSON string
     *
     * @return data represented as JSON
     */
    getDataJson(): string;


    /**
     * Return raw bucket data
     *
     * TODO: remove; breaks encapsulation
     *
     * @return raw bucket data
     */
    getData(): Record<string, any>;
}
