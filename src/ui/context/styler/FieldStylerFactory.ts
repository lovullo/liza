/**
 * Liza Field Styler Factory
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
import { QuestionTypes } from "../../../program/Program";
import { FieldStyler } from "./FieldStyler";
import { CheckboxFieldStyler } from "./CheckboxFieldStyler";
import { DefaultFieldStyler } from "./DefaultFieldStyler";


export class FieldStylerFactory
{

    /**
     * Initialize FieldStylerFactory
     *
     * @param _qtypes - question types
     */
    constructor(
        private readonly _qtypes: QuestionTypes
    ) {}


    /**
     * Create field styler based on the question type
     *
     * @param name - field name
     * @param index - field index
     */
    create( name: string, index: PositiveInteger ): FieldStyler
    {
        let qtype = '';

        if ( this._qtypes[ name ] !== undefined )
        {
            qtype = this._qtypes[ name ].type;
        }

        switch ( qtype ) {
            case 'radio':
            case 'legacyradio':
            case 'noyes':
            case 'checkbox':
                return new CheckboxFieldStyler( name, index );
            default:
                return new DefaultFieldStyler( name, index );
        }
    }
}
