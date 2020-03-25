/**
 * Liza Field Context Factory
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

import { FieldContext, ContextContent, NullableContextContent } from "./FieldContext";
import { PositiveInteger } from "../../numeric";


export class FieldContextFactory
{
    /**
     * Creates a new FieldContext
     *
     * @param name - field name
     * @param index - field index
     * @param position - position index of content in the group
     * @param content - field HTML content
     * @param sibling - field HTML sibling content
     */
    create(
        name: string,
        index: PositiveInteger,
        position: PositiveInteger,
        content: ContextContent,
        sibling: NullableContextContent = null
    ): FieldContext
    {
        return new FieldContext(
            name,
            index,
            position,
            content,
            sibling
        );
    }

}