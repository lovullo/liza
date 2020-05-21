/**
 * General UI logic for groups
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
 *   - Dependencies need to be liberated: Styler; Group.
 *   - This class is doing too much.
 * @end needsLove
 */

import { PositiveInteger } from "../../numeric";

/**
 * Styles a group for display in the UI
 */
export declare class GroupUi
{
    /**
     * Retrieve the current index count
     *
     * This should be one more than the current 0-based index (like an array
     * length). Subtypes may override this if they do not wish to use the
     * built-in index tracking.
     */
    getCurrentIndexCount(): PositiveInteger;


    /**
     * Sets element value given a name and index
     *
     * This has the performance benefit of searching *only* within the group
     * rather than scanning the entire DOM (or a much larger subset)
     *
     * @param name         - element name
     * @param index        - index to set
     * @param value        - value to set
     * @param change_event - whether to trigger change event
     */
    setValueByName(
        name:         string,
        index:        number,
        value:        string,
        change_event: boolean
    ):this

    hasChildren(): boolean;

    setChildren(): void;
}