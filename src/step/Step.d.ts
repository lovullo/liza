/**
 * Step abstraction
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
 *
 * @needsLove
 *   - References to "quote" should be replaced with generic terminology
 *     representing a document.
 *   - Sorting logic must be extracted, and MultiSort decoupled.
 * @end needsLove
 */

import { EventEmitter } from "events";
import { StagingBucket } from "../bucket/StagingBucket";

export type ExclusiveFields =  Record<string, boolean>;

/**
 * Represents a single step to be displayed in the UI
 */
export interface Step extends EventEmitter
{
    /**
     * Retrieve list of field names (no linked)
     */
    getExclusiveFieldNames(): ExclusiveFields


    /**
     * Return the bucket associated with this step
     *
     * XXX: Remove me; breaks encapsulation.
     */
    getBucket(): StagingBucket


    /**
     * Returns whether all the elements in the step contain valid data
     *
     * @param cmatch - cmatch data
     *
     * @return true if all elements are valid, otherwise false
     */
    isValid( cmatch: any ): boolean


    /**
     * Retrieve the next required value that is empty
     *
     * Aborts on first missing required field with its name and index.
     *
     * @param cmatch - cmatch data
     *
     * @return first missing required field
     */
    getNextRequired( cmatch: any ): Array<string | number | boolean>


    /**
     * Returns an explanation of what caused the step to be valid/invalid
     *
     * @returns an explanation of what caused the step to be valid/invalid
     */
    getValidCause(): string


    /**
     * Executes a callback on each sorted group set
     *
     * @param c - callback to run on each set
     */
    eachSortedGroupSet( c: any ): void
}