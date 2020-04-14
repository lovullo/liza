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
     * Whether field is a subfield
     */
    private _is_subfield: boolean = false;

    /**
     * Whether subfield determination has happened
     */
    private _subfield_determined: boolean = false;

    /**
     * The name of the parent field for a subfield
     */
    private _subfield_parent_name: string = '';


    /**
     * Initialize FieldContextStore
     *
     * @param _element_id field identifier
     * @param _content    field content
     * @param _sibling    sibling field content
     */
    constructor(
        private readonly _element_id: string,
        private readonly _content: ContextContent,
        private readonly _sibling: NullableContextContent = null
    ) {
        this._setContentPosition();
    }


    /**
     * Return content clone
     *
     * @param index - index of content
     *
     * @returns clone
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
     *
     * @returns sibling clone
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
     * Detaches content and sibling from its parent
     *
     * The content will stay in memory so it can be cloned
     */
    detach(): void
    {
        if ( this._content.parentElement )
        {
            this._content.parentElement.removeChild( this._content );

            if ( this._sibling !== null &&
                this._sibling.parentElement )
            {
                this._sibling.parentElement.removeChild( this._sibling );
            }
        }
    }


    /**
     * Return position index
     *
     * @return position index
     */
    get position(): PositiveInteger
    {
        return this._position;
    }


    /**
     * Sets the position of the content
     * in relation to the parent node.
     */
    private _setContentPosition(): void
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
     * Return whether the field in the content represents a sub-field
     */
    isSubField(): boolean
    {
        if ( this._subfield_determined === true )
        {
            return this._is_subfield;
        }

        return this._isSubFieldIndicator();
    }


    /**
     * Return the sub-field's parent name
     *
     * This is used by GroupContext to find
     * the parent FieldContext of a sub-field
     *
     * @return sub-field's parent name
     */
    get subFieldParentName(): string
    {
        return this._subfield_parent_name;
    }


    /**
     * Determine whether the field in the content represents a sub-field
     *
     * A sub-field is a field within a field; the distinction is important
     * because we don't want operations on a sub-field affecting
     * its parent.
     */
    private _isSubFieldIndicator(): boolean
    {
        const field_element = this._content.querySelector( "#" + this._element_id );

        this._subfield_determined = true;

        if ( field_element === null )
        {
            return this._is_subfield;
        }

        const parent = field_element.parentElement;

        // A subfield's parent has a 'widget' class value
        this._is_subfield = !!( parent && parent.classList.contains( 'widget' ) );


        if ( this._is_subfield === true && parent !== null )
        {
            // capture the subfield's parent field name
            this._subfield_parent_name = parent.getAttribute( 'data-field-name' ) || '';
        }

        return this._is_subfield;
    }


    /**
     * Sets the index (for the name attribute) of all given elements
     *
     * The name format is expected to be: name_i, where i is the index.
     *
     * @param content - the content
     *
     * @returns modified content
     */
    private _setElementIdIndexes(
        content: ContextContent,
        index: PositiveInteger
    ): ContextContent
    {
        const elements: Element[] = [].slice.call( content.getElementsByTagName( '*' ) );

        // Add the content element to the array
        elements.push( content );

        for ( let i = 0; i < elements.length; i++ )
        {
            let element = elements[ i ];
            let id      = element.getAttribute( 'id' ) || '';

            let element_data: RegExpMatchArray | null = null;


            // grab the index from the id if found
            if ( element_data = id.match( /^(.*?)(\d+)$/ ) )
            {
                // regenerate the id
                element.setAttribute( 'id', element_data[ 1 ] + index );
            }

            element.setAttribute( 'data-index', index.toString()  );
        }

        return content;
    }

}