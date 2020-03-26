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

export type ContextContent = Element;
export type NullableContextContent = ContextContent | null;


/**
 * Context responsible for a specific field in the DOM
 */
export class FieldContext
{
    /**
     * Cloned content
     * Needed for additional indexes
     */
    private _content_clone: NullableContextContent = null;

    /**
     * Cloned sibling content
     * Needed for additional indexes
     */
    private _sibling_clone: NullableContextContent = null;


    /**
     * Initialize FieldContext
     *
     * @param _name field name
     * @param _index field index
     * @param _position position index of content in the group
     * @param _content field content
     * @param _sibling sibling field content
     */
    constructor(
        private readonly _name: string,
        private readonly _index: PositiveInteger,
        private readonly _position: PositiveInteger,
        private readonly _content: ContextContent,
        private _sibling: NullableContextContent = null
    )
    {
        this.processContent();
    }


    /**
     * FieldContexts with indexes higher than 0 will need
     * cloned nodes of the original content and the sibling
     * so the nodes are unique
     */
    processContent(): void
    {
        if( this._index !== 0 )
        {
            return;
        }

        this._content_clone = <ContextContent>this._content.cloneNode( true );

        this.setSiblingContent();
    }


    /**
     * Return sibling content
     */
    getSiblingContent(): NullableContextContent
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
            && this._content.previousElementSibling != null )
        {
            const sibling: ContextContent = this._content.previousElementSibling;
            const node_name = sibling.nodeName.toUpperCase();
            this._sibling = ( sibling !== null && node_name === 'DT' ) ? sibling : null;

            if ( this._sibling !== null )
            {
                this._sibling_clone = <ContextContent>this._sibling.cloneNode( true );
            }
        }
    }


    /**
     * Return content clone
     */
    getContentClone(): NullableContextContent
    {
        return this._content_clone;
    }


    /**
     * Return sibling content clone
     */
    getSiblingContentClone(): NullableContextContent
    {
        return this._sibling_clone;
    }


    /**
     * Return the field name
     */
    getName(): string
    {
        return this._name;
    }


    /**
     * Return the field index
     */
    getIndex(): PositiveInteger
    {
        return this._index;
    }


    /**
     * Return position index
     */
    getPosition(): PositiveInteger
    {
        return this._position;
    }


    /**
     * If the field is attached to the DOM
     */
    isAttached(): boolean
    {
        return ( this._content.parentElement !== null );
    }


    /**
     * Attach the field to the DOM
     *
     * @param to - Parent to attach to
     * @param next_element - Next element to attach before
     */
    attach( to: ContextContent, next_element: NullableContextContent ): void
    {
        to.insertBefore( this._content, next_element );

        if ( this._sibling !== null )
        {
            to.insertBefore( this._sibling, this._content );
        }
    }


    /**
     * Detach the field from the DOM
     *
     * @param from - Parent to detach from
     */
    detach( from: ContextContent ): void
    {
        if ( this._content.parentElement &&
            this._content.parentElement === from )
        {
            from.removeChild( this._content );

            if ( this._sibling !== null &&
                this._sibling.parentElement &&
                this._sibling.parentElement === from )
            {
                from.removeChild( this._sibling );
            }
        }
    }


    /**
     * Get the field content or sibling if it exists
     */
    getFirstOfContentSet(): ContextContent
    {
        return this._sibling || this._content;
    }


}