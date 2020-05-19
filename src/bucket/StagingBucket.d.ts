/**
 * StagingBucket class
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

import { PositiveInteger } from "../numeric";
import { EventEmitter } from "events";


export type StagingBucketConstructor = (
    bucket: StagingBucket
) => StagingBucket;


/**
 * Stages and merges values into underlying key/value store
 */
export declare class StagingBucket extends EventEmitter
{
    /**
     * Analgous to setValues(), but immediately commits the changes
     *
     * This still calls setValues() to ensure all events are properly kicked
     * off.
     *
     * @param data - data to set and commit
     */
    setCommittedValues( data: Record<string, any> ): this;


    /**
     * Prevent #setCommittedValues from bypassing staging
     *
     * When set, #setCommittedValues will act as an alias of #setValues.
     */
    forbidBypass(): this;


    /**
     * Explicitly sets the contents of the bucket
     *
     * Because JSON serializes all undefined values to `null`, only the
     * final null in a diff is considered terminating; the rest are
     * converted into `undefined`.  Therefore, it is important that all
     * truncations include no elements in the vector after the truncating null.
     *
     * @param given_data - associative array of the data
     */
    setValues( given_data: Record<string, any> ): this;


    /**
     * Overwrites values in the original bucket
     *
     * @param data - associative array of the data
     */
    overwriteValues( data: Record<string, any> ): this;


    /**
     * Returns staged data
     *
     * @return staged data
     */
    getDiff(): Record<string, any>;


    /**
     * Returns a field-oriented diff filled with all values rather than a
     * value-oriented diff
     *
     * Only the fields that have changed are returned. Each field contains its
     * actual value---not the diff representation of what portions of the field
     * have changed.
     *
     * @return filled diff
     */
    getFilledDiff(): Record<string, any>;


    /**
     * Reverts staged changes, preventing them from being committed
     *
     * This will also generate a diff and raise the same events that would be
     * raised by setting values in the conventional manner, allowing reverts to
     * transparently integrate with the remainder of the system.
     *
     * @param evented - whether to emit events as part of the revert
     */
    revert( evented?: boolean ): this;


    /**
     * Commits staged changes, merging them with the bucket
     *
     * @param store - object to save old staged values to
     */
    commit( store?: { old: Record<string, any> } ): this


    /**
     * Clears all data from the bucket
     */
    clear(): this;


    /**
     * Calls a function for each each of the values in the bucket
     *
     * @param callback - function to call for each value in the bucket
     */
    each( callback: ( value: any, name: string ) => void ): this;


    /**
     * Returns the data for the requested field
     *
     * WARNING: This can be a potentially expensive operation if there is a
     * great deal of staged data. The staged data is merged with the bucket data
     * on each call. Do not make frequent calls to retrieve the same data. Cache
     * it instead.
     *
     * @param name - field name (with or without trailing brackets)
     *
     * @return data for the field, or empty array if none
     */
    getDataByName( name: string ): Record<string, any>;


    /**
     * Returns original bucket data by name, even if there is data staged atop
     * of it
     *
     * There is no additional overhead of this operation versus getDataByName()
     *
     * @param name - field name (with or without trailing brackets)
     *
     * @return data for the field, or empty array if none
     */
    getOriginalDataByName( name: string ): Record<string, any>;


    /**
     * Returns the data as a JSON string
     *
     * @return data represented as JSON
     */
    getDataJson(): string;


    /**
     * Return raw bucket data
     *
     * todo: remove; breaks encapsulation
     *
     * @return raw bucket data
     */
    getData(): Record<string, any>;


    /**
     * Calls a function for each each of the values in the bucket matching the
     * given predicate
     *
     * @param pred - predicate
     * @param c    - function to call for each value in the bucket
     */
    filter(
        pred: ( name: string ) => boolean,
        c:    ( value: any, name: string ) => void
    ): this;


    /**
     * Returns true if the index for the given key exists
     *
     * @param name - the data key
     * @param i    - the index
     *
     * @return whether the key exists
     */
    hasIndex( name: string, i: PositiveInteger ): boolean;


    /**
     * Returns true if the bucket has been changed and not saved
     *
     * @return true if the bucket has been changed and not saved
     */
    isDirty(): boolean;
}
