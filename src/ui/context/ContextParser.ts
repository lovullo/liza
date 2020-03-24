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
            || content.querySelector( '#' + element_id )
            || content.querySelector( '#q_' + element_id + "_0" )
            || null;
    }

}