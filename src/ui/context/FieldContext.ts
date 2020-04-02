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

export type FieldOptions = FieldOption[];
export type FieldOption = {
    value: string,
    label: string,
    label_id: string
}


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
     * If content has been cloned
     */
    private _content_cloned: boolean = false;

    /**
     * If sibling content has been cloned
     */
    private _sibling_cloned: boolean = false;

    /**
     * Field element within the content
     */
    private _field_element: NullableContextContent = null;

    /**
     * Parent of field element within the content
     */
    private _field_parent_element: NullableContextContent = null;

    /**
     * Field element ID prefix
     */
    private _field_id_prefix: string = 'q_';

    /**
     * If field is a subfield
     */
    private _is_subfield: boolean = false;


    /**
     * Initialize FieldContext
     *
     * @param _name field name
     * @param _index field index
     * @param _position field position
     * @param _content field content
     * @param _sibling sibling field content
     * @param _document to create Document elements
     */
    constructor(
        private readonly _document: Document,
        private readonly _name: string,
        private readonly _index: PositiveInteger,
        private _position: PositiveInteger,
        private readonly _content: ContextContent,
        private _sibling: NullableContextContent = null
    )
    {
        this.processContent();
    }


    /**
     * Each element in the content need unique element ids
     *
     * FieldContexts with indexes higher than 0 will need
     * cloned nodes of the original content and the sibling
     * so the nodes are unique
     */
    processContent(): void
    {
        if ( this._index === 0 )
        {
            this._setContentPosition();
        }

        this._setElementIdIndexes( this._content );
        this._setElementIdIndexes( this._sibling );

        // Set subfield flag for re-attaching
        this._is_subfield = this._isSubField();
    }


    /**
     * Sets the index (for the name attribute) of all given elements
     *
     * The name format is expected to be: name_i, where i is the index.
     *
     * @param content - the content
     */
    private _setElementIdIndexes( content: NullableContextContent ): void
    {
        if ( content === null )
        {
            return;
        }

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
                element.setAttribute( 'id', element_data[ 1 ] + this._index );
            }

            element.setAttribute( 'data-index', this._index.toString()  );
        }
    }


    /**
     * Sets the position of the content
     * in relation to the parent node.
     *
     * Used by GroupContext when re-attaching
     *
     * This should only be called on the first index
     * of a specific field to capture the original position
     */
    private _setContentPosition()
    {
        const content = <ContextContent>this.getFirstOfContentSet();
        const parent = content.parentNode;

        this._position = <PositiveInteger>Array.prototype.indexOf
            .call( parent?.children, content );
    }


    /**
     * Return content clone
     *
     * Create new clone from base clone each time method is called
     */
    getContentClone(): ContextContent
    {
        if ( !this._content_cloned
            || this._content_clone === null  )
        {
            this._content_clone = this._setContentBaseClone();
        }

        return <ContextContent>this._content_clone.cloneNode( true );
    }


    /**
     * Return sibling content clone
     *
     * Create new clone from base clone each time method is called
     */
    getSiblingContentClone(): NullableContextContent
    {
        if ( !this._sibling_cloned )
        {
            this._sibling_clone = this._setSiblingContentBaseClone();
        }

        if ( this._sibling_clone === null )
        {
            return null;
        }

        return <ContextContent>this._sibling_clone.cloneNode( true );
    }


    /**
     * Set base clone for content and sibling
     *
     * This should only be done once and only
     * on the first index of a field
     * since cloneNode is not very performant.
     */
    private _setContentClones(): void
    {
        if ( this._index > 0
            && this._content_cloned
            && this._sibling_cloned )
        {
            return;
        }

        this._content_clone = this._setContentBaseClone();
        this._sibling_clone = this._setSiblingContentBaseClone();
    }


    /**
     * Set base clone for content
     *
     * This should only be done for the first index
     * of a field since cloneNode is not very performant.
     */
    private _setContentBaseClone(): ContextContent
    {
        this._content_cloned = true;

        return <ContextContent>this._content.cloneNode( true );
    }


    /**
     * Set base clone for sibling
     *
     * This should only be done for the first index
     * of a field since cloneNode is not very performant.
     */
    private _setSiblingContentBaseClone(): NullableContextContent
    {
        this._sibling_cloned = true;

        if ( this._sibling === null )
        {
            return null;
        }

        return <ContextContent>this._sibling.cloneNode( true );
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
     * If the field (or subfield) is attached to the DOM
     */
    isAttached(): boolean
    {
        return ( this._is_subfield === true )
            ? ( this._field_element?.parentElement !== null )
            : ( this._content.parentElement !== null )
    }


    /**
     * Set Options on Select elements
     *
     * @param options - list of options to set
     * @param value - value to set once options exist
     */
    setOptions( options: FieldOptions, value?: string ): void
    {
        const element_id = this._field_id_prefix + this._name + '_' + this._index;
        const field_element = <HTMLSelectElement>this._content.querySelector( "select#" + element_id );

        if ( field_element === null )
        {
            return;
        }

        // if new value is not provided reset the old value
        const value_to_set = value || field_element?.value;
        field_element.innerHTML = '';

        for ( let item in options )
        {
            let opt_value = options[ item ]?.value;
            const option_value = opt_value || '';
            const opt = this._document.createElement( 'option' );
            opt.value = option_value;
            opt.text = options[ item ].label;
            field_element.appendChild( opt );
        }

        field_element.value = value_to_set;
    }


    /**
     * Attach the field to the DOM
     *
     * @param to - Parent to attach to
     * @param next_element - Next element to attach before
     */
    attach( to: ContextContent, next_element: NullableContextContent ): void
    {
        // Create content clones if not set
        this._setContentClones();

        if ( this._is_subfield )
        {
            return this._attachSubField();
        }

        to.insertBefore( this._content, next_element );

        if ( this._sibling !== null )
        {
            to.insertBefore( this._sibling, this._content );
        }
    }


    /**
     * Detach the field from the DOM
     */
    detach(): void
    {
        if ( this._is_subfield )
        {
            return this._detachSubField();
        }

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
     * Get the field content or sibling if it exists
     */
    getFirstOfContentSet(): ContextContent
    {
        return this._sibling || this._content;
    }


    /**
     * Determine whether field element represents a sub-field
     *
     * A sub-field is a field within a field; the distinction is important
     * because we don't want operations on a sub-field affecting
     * its parent.
     */
    private _isSubField(): boolean
    {
        const element_id = this._field_id_prefix + this._name + '_' + this._index;

        this._field_element = this._content.querySelector( "#" + element_id );

        if ( this._field_element === null )
        {
            return false;
        }

        const parent = this._field_element?.parentElement;

        // A subfield's parent has a 'widget' class value
        return !!( parent && /\bwidget\b/.test( parent.className ) );
    }


    /**
     * Attach the subfield to its parent
     */
    private _attachSubField(): void
    {
        if ( this._field_element !== null
            && this._field_parent_element !== null )
        {
            this._field_parent_element.appendChild( this._field_element );
        }
    }


    /**
     * Detach the subfield from its parent
     */
    private _detachSubField(): void
    {
        if ( this._field_element !== null
            && this._field_element.parentElement !== null )
        {
            this._field_parent_element = this._field_element.parentElement;

            this._field_parent_element.removeChild( this._field_element );
        }
    }


}