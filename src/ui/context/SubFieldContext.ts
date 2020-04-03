/**
 * SubField Context
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

import { ContextContent, FieldContext, NullableContextContent } from "./FieldContext";


/**
 * Context responsible for a specific field in the DOM
 */
export class SubFieldContext extends FieldContext
{
    /**
     * Parent of field element within the content
     */
    private _field_parent_element: NullableContextContent = null;

    /**
     * Field element within the content
     */
    private _field_element: NullableContextContent = null;


    /**
     * If the subfield is attached to the DOM
     */
    isAttached(): boolean
    {
        const field_element = this.content.querySelector( "#" + this.element_id );

        return ( !!field_element?.parentElement );
    }


    /**
     * Attach the subfield to its parent
     *
     * @param to - Parent to attach to
     * @param next_element - Next element to attach before
     */
    attach( _to: ContextContent, _next_element: NullableContextContent ): void
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
    detach(): void
    {
        this._field_element = this.content.querySelector( "#" + this.element_id );

        if ( this._field_element !== null
            && this._field_element.parentElement !== null )
        {
            // save its parent before detaching
            this._field_parent_element = this._field_element.parentElement;

            this._field_parent_element.removeChild( this._field_element );
        }
    }
}