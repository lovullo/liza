/**
 * Liza Field Context
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

import { PositiveInteger } from "../../numeric";

export type ContextContent = Element | null;


/**
 * Context responsible for a specific field in the DOM
 */
export class FieldContext
{
    /**
     * Sibling content
     **/
    private _sibling: ContextContent = null;


    /**
     * Initialize FieldContext
     *
     * @param _content field content
     * @param _position position index of content in the group
     */
    constructor(
        private readonly _content: ContextContent,
        private readonly _position: PositiveInteger
    )
    {
        this.setSiblingContent();
    }


    /**
     * Return position index
     */
    getPosition(): PositiveInteger
    {
        return this._position;
    }


    /**
     * Return sibling content
     */
    getSiblingContent(): ContextContent
    {
        return this._sibling;
    }


    /**
     * Capture the sibling label content if it exists
     *
     * This function could be removed if the HTML structure
     * changed so that fields and labels have unique container elements.
     */
    setSiblingContent(): void
    {
        if ( this._content !== null
            && this._content.previousElementSibling !== null )
        {
            const sibling: ContextContent = this._content.previousElementSibling;
            const node_name = sibling.nodeName.toUpperCase();
            this._sibling = ( sibling !== null && node_name === 'DT' ) ? sibling : null;
        }
    }
}