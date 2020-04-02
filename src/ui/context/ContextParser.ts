/**
 * Liza Context content parser
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

import { ContextContent, NullableContextContent } from "./FieldContext";


export class ContextParser
{
    /**
     * Parses HTML content into content associated only with
     * the bucket name, so that a FieldContext can be created
     * with it's associated content
     *
     * @param element_id - ID of the element (bucket name)
     * @param content    - HTML content
     */
    parse(
        element_id: string,
        content: ContextContent
    ): NullableContextContent
    {
        if ( content === null )
        {
            return null;
        }

        return content.querySelector( '#qcontainer_' + element_id )
            || this._fallbackQuery( content, '[data-field-name="' + element_id + '"]' )
            || this._fallbackQuery( content, '#' + element_id  )
            || this._fallbackQuery( content, '#q_' + element_id + "_0" )
            || null;
    }


    /**
     * Find the sibling label content if it exists
     *
     * This sibling content and its logic could be removed if the HTML structure
     * changed so that fields and labels have unique container elements.
     */
    findSiblingContent( content: ContextContent ): NullableContextContent
    {
        if ( content.previousElementSibling === null )
        {
            return null;
        }

        const sibling: ContextContent = content.previousElementSibling;
        const node_name = sibling.nodeName.toUpperCase();
        return ( sibling !== null && node_name === 'DT' ) ? sibling : null;
    }


    /**
     * Fallback query for sub-questions,
     * displays, answers, stand-alone labels
     * and static elements
     *
     * If the content query returns an element,
     * return the parent of the element
     * unless it's a stand-alone label (DT)
     *
     * @param content - HTML content
     * @param query - query string
     */
    private _fallbackQuery(
        content: ContextContent,
        query: string
    ): NullableContextContent
    {
        const element: NullableContextContent = content.querySelector( query );

        if ( element === null )
        {
            return null;
        }

        // Some elements are standalone labels
        if ( 'DT' === element.nodeName.toUpperCase() )
        {
            return element;
        }

        return this._getContentParent( element );
    }


    /**
     * Get the content parent (either a DD or a TD)
     *
     * @param element - HTML element
     */
    private _getContentParent( element: ContextContent ): ContextContent
    {
        const parent = <ContextContent>element.parentElement;

        switch ( parent.nodeName.toUpperCase() )
        {
            case 'DD':
            case 'TD':
                return parent;
        }

        // otherwise, keep looking
        return this._getContentParent( parent );
    }

}