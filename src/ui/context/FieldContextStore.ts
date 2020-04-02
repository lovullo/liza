/**
 * Liza Field Context Store
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
import { PositiveInteger } from "../../numeric";

/**
 * Context responsible for storing the original
 * content and sibling. Clones the content
 * and resets the index attributes before returning
 */
export class FieldContextStore
{
    /**
     * Original content position relative to its parent
     */
    private _position: PositiveInteger = <PositiveInteger>0;


    /**
     * Initialize FieldContextStore
     *
     * @param _content field content
     * @param _sibling sibling field content
     */
    constructor(
        private readonly _content: ContextContent,
        private readonly _sibling: NullableContextContent = null
    ) {
        this._setContentPosition();
    }


    /**
     * Return content clone
     *
     * @param index - index of content
     */
    getContentClone( index: PositiveInteger ): ContextContent
    {
        const content_clone = <ContextContent>this._content.cloneNode( true );

        return this._setElementIdIndexes( content_clone, index );
    }


    /**
     * Return sibling content clone
     *
     * @param index - index of content
     */
    getSiblingContentClone( index: PositiveInteger ): NullableContextContent
    {
        if ( this._sibling === null )
        {
            return null;
        }

        const sibling_clone = <ContextContent>this._sibling.cloneNode( true );

        return this._setElementIdIndexes( sibling_clone, index );
    }


    /**
     * Return position index
     */
    getPosition(): PositiveInteger
    {
        return this._position;
    }


    /**
     * Sets the position of the content
     * in relation to the parent node.
     */
    private _setContentPosition()
    {
        let content = <ContextContent>this._sibling;

        if ( content === null )
        {
            content = <ContextContent>this._content;
        }

        const parent = content.parentNode;

        this._position = <PositiveInteger>Array.prototype.indexOf
            .call( parent?.children, content );
    }


    /**
     * Sets the index (for the name attribute) of all given elements
     *
     * The name format is expected to be: name_i, where i is the index.
     *
     * @param content - the content
     */
    private _setElementIdIndexes(
        content: ContextContent,
        index: PositiveInteger
    ): ContextContent
    {

        const elements = content.getElementsByTagName( "*" );

        for ( let i = 0; i < elements.length; i++ )
        {
            let element = elements[ i ];
            let id      = element.getAttribute( 'id' ) || '';

            let element_data: RegExpMatchArray | null = null;

            // grab the index from the id if found
            if ( element_data = id.match( /^([a-zA-Z0-9_]+)([0-9]+)$/ ) )
            {
                // regenerate the id
                element.setAttribute( 'id', element_data[ 1 ] + index );
            }

            element.setAttribute( 'data-index', index.toString()  );
        }

        return content;
    }

}