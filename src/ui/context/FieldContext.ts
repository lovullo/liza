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
     * Is attached on the DOM
     */
    protected is_attached: boolean = false;


    /**
     * Is field visible to the user
     */
    protected is_visible: boolean = false;


    /**
     * Initialize FieldContext
     *
     * @param document to create Document elements
     * @param element_id field identifier
     * @param content field content
     * @param sibling sibling field content
     */
    constructor(
        protected readonly document: Document,
        protected readonly element_id: string,
        protected content: ContextContent,
        protected sibling: NullableContextContent = null
    )
    {}


    /**
     * Return the element identifier as used on the DOM
     *
     * @returns identifier
     */
    getElementId(): string
    {
        return this.element_id;
    }


    /**
     * If the field is attached to the DOM
     */
    isAttached(): boolean
    {
        return this.is_attached;
    }


    /**
     * If the field is visible
     */
    isVisible(): boolean
    {
        return this.is_attached && this.is_visible;
    }


    /**
     * Set Options on Select elements
     *
     * @param options - list of options to set
     * @param value - value to set once options exist
     */
    setOptions( options: FieldOptions, value?: string ): void
    {
        const field_element = <HTMLSelectElement>this.content.querySelector( "select#" + this.element_id );

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
            const opt = this.document.createElement( 'option' );
            opt.value = option_value;
            opt.text = options[ item ].label;
            field_element.appendChild( opt );
        }

        field_element.value = value_to_set;
    }


    /**
     * Show the field
     *
     * @param to - Parent to attach to
     * @param next_element - Next element to attach before
     */
    show( to: ContextContent, next_element: NullableContextContent ): void
    {
        this.attach( to, next_element );
    }


    /**
     * Show the field
     *
     * @param to - Parent to attach to
     * @param next_element - Next element to attach before
     */
    protected attach( to: ContextContent, next_element: NullableContextContent ): void
    {
        to.insertBefore( this.content, next_element );

        if ( this.sibling !== null )
        {
            to.insertBefore( this.sibling, this.content );
        }

        this.is_attached = true;
        this.is_visible  = true;
    }


    /**
     * Hide the field
     */
    hide(): void
    {
        this.detach();
    }


    /**
     * Detach the field from the DOM
     */
    protected detach(): void
    {
        if ( this.content.parentElement )
        {
            this.content.parentElement.removeChild( this.content );

            if ( this.sibling !== null &&
                this.sibling.parentElement )
            {
                this.sibling.parentElement.removeChild( this.sibling );
            }
        }

        this.is_attached = false;
        this.is_visible  = false;
    }


    /**
     * Get the field content or sibling if it exists
     *
     * @returns first in set
     */
    getFirstOfContentSet(): ContextContent
    {
        return this.sibling || this.content;
    }


    /**
     * Get the field content
     *
     * @returns content
     */
    getContent(): ContextContent
    {
        return this.content;
    }
}