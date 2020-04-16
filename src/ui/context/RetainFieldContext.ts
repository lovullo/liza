/**
 * Retain Field Context
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
export class RetainFieldContext extends FieldContext
{
    /**
     * Attach the field to the DOM or make it visible if already attached
     *
     * @param to - Parent to attach to
     * @param next_element - Next element to attach before
     */
    show( to: ContextContent, next_element: NullableContextContent): void
    {
        this.content.classList.remove( "hidden" );

        if (this.sibling !== null) {
            this.sibling.classList.remove( "hidden" );
        }

        this.is_visible = true;
        this._attach( to, next_element );
    }


    /**
     * Hide field on DOM, retainable fields must not be detached
     */
    hide(): void
    {
        this.content.classList.add( "hidden" );

        if (this.sibling !== null)
        {
            this.sibling.classList.add( "hidden" );
        }

        this._attach( <ContextContent>this.content.parentElement, null );
        this.is_visible = false;
    }


    /**
     * Retain fields should always be attached to the DOM
     *
     * @param to - Parent to attach to
     * @param next_element - Next element to attach before
     */
    private _attach( to: ContextContent, next_element: NullableContextContent ): void
    {
        if ( this.isAttached() === false )
        {
            this.attach( to, next_element );
        }
    }
}