/**
 * Liza Group Context
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

import { ContextParser } from "./ContextParser";
import { FieldContext, ContextContent } from "./FieldContext";
import { FieldContextFactory } from "./FieldContextFactory";
import { PositiveInteger } from "../../numeric";


export type ContextCache = Record<string, FieldContext>;

/**
 * Context responsible for a group and its fields
 */
export class GroupContext
{
    /**
     * Cache of FieldContexts
     */
    private _field_context_cache: ContextCache = {};


    /**
     * Initialize GroupContext
     *
     * @param _parser - ContextParser
     * @param _field_context_factory - field context factory
     */
    constructor(
        private readonly _parser: ContextParser,
        private readonly _field_context_factory: FieldContextFactory,
    ) {}


    /**
     * Create cache of field contexts
     *
     * @param fields - exclusive field names of group
     * @param content - group content
     */
    createFieldCache(
        fields: string[],
        content: ContextContent
    ): void
    {
        for ( let i = 0; i < fields.length; i++ )
        {
            let field = fields[ i ];
            let position = <PositiveInteger>+i;

            let field_content = this._parser.parse( field, content );

            if ( field_content !== null )
            {
                let field_context = this._field_context_factory
                    .create( field, field_content, position );

                this._field_context_cache[ field ] = field_context;
            }
        }
    }

}





