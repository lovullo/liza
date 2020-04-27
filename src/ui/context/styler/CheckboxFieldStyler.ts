/**
 * Liza Checkbox Field Styler
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

import { PositiveInteger } from "../../../numeric";
import { ContextContent } from "../FieldContext";
import { FieldStyler } from "./FieldStyler";


/**
 * Styles checkbox, radio, legacyradio and noyes DOM fields
 */
export class CheckboxFieldStyler implements FieldStyler
{
    /**
     * Initialize CheckboxFieldStyler
     *
     * @param name field name
     * @param index field index
     */
    constructor(
        protected readonly name: string,
        protected readonly index: PositiveInteger
    )
    {}


    /**
     * Set value of the checkbox, radio, legacyradio or noyes field
     *
     * @param content - field content
     * @param value - value to set
     */
    setValue( content: ContextContent, value: string ): void
    {
        const elements: NodeList = content.querySelectorAll( `[data-field-name="${this.name}"]` );

        let i = elements.length;
        while ( i-- )
        {
            const question = <HTMLInputElement>elements[ i ];

            if ( question )
            {
                question.checked = ( question.value === value );
            }
        }
    }

}
