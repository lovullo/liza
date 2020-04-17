/**
 * TableCellField Context
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
export class TableCellFieldContext extends FieldContext
{
    /**
     * Attach the field to the DOM or make it visible if already attached
     *
     * @param to - Parent to attach to
     * @param next_element - Next element to attach before
     */
    show( to: ContextContent, next_element: NullableContextContent ): void
    {
        this.is_visible = true;

        if ( this.isAttached() === false )
        {
            this.attach( to, next_element );
        }
    }


    /**
     * Table cell fields must not be detached
     *
     * Only set the visibility flag
     * and let the TableGroup do its thing
     */
    hide(): void
    {
        this.is_visible = false;
    }
}