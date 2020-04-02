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
import { FieldContext, ContextContent, NullableContextContent, FieldOptions } from "./FieldContext";
import { FieldContextStore } from "./FieldContextStore";
import { FieldContextFactory } from "./FieldContextFactory";
import { PositiveInteger } from "../../numeric";



export type ContextCache = Record<string, FieldContext[]>;

export type ContextStores = Record<string, FieldContextStore>;

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
     * Object containing FieldContextStore for each field
     */
    private _field_context_stores: ContextStores = {};

    /**
     * Position of all cached fields
     */
    private _field_positions: string[] = [];


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

            // Initial fields will have 0 index and position
            // The FieldContext will reset its position
            let index = <PositiveInteger>0;

            let field_content   = this._parser.parse( field, content );

            if ( field_content !== null )
            {
                let sibling_content = this._parser.findSiblingContent( field_content );

                // Create the FieldContextStore
                let field_store = this._field_context_factory
                    .createStore( field_content, sibling_content );

                let position = field_store.getPosition();

                this._field_positions[ position ] = field;

                this._field_context_stores[ field ] = field_store;

                // Create the FieldContext for the first index
                let field_context = this._field_context_factory
                    .create( field, index, index, field_content, sibling_content );

                this._field_context_cache[ field ] = [];
                this._field_context_cache[ field ][ index ] = field_context;
            }
        }
    }


    /**
     * Set Options on Select elements
     *
     * @param field_name - to attach options to
     * @param index - field index
     * @param options - list of options to set
     * @param value - value to set once options exist
     */
    setOptions(
        field_name: string,
        index: PositiveInteger,
        options: FieldOptions,
        val: string
    ): void
    {
        // If field name was never added, do nothing
        if ( this._field_context_cache[ field_name ] === undefined )
        {
            return;
        }

        const field_context = this._fromCache( field_name, index );
        field_context.setOptions( options, val );
    }

    /**
     * Attach field to DOM
     *
     * @param field_name - to attach to DOM
     * @param index - field index
     * @param to - parent context
     */
    attach(
        field_name: string,
        index: PositiveInteger,
        to: ContextContent
    ): void
    {
        // If field name was never added, do nothing
        if ( this._field_context_cache[ field_name ] === undefined )
        {
            return;
        }

        const field_context = this._fromCache( field_name, index );

        if ( field_context.isAttached() === false )
        {
            let next_element = this._getNextElement( field_name, index );
            const next_element_id = next_element?.getAttribute( 'id' ) || '';

            if ( next_element_id !== '' )
            {
                next_element = to.querySelector( "#" + next_element_id );
            }

            field_context.attach(
                to,
                next_element
            );
        }
    }


    /**
     * Detach field from DOM
     *
     * @param field_name - to detach from DOM
     * @param index - field index
     */
    detach(
        field_name: string,
        index: PositiveInteger
    ): void
    {
        // If FieldContext was never added to cache, do nothing
        if ( this._field_context_cache[ field_name ] === undefined
            || this._field_context_cache[ field_name ][ index ] === undefined )
        {
            return;
        }

        this._field_context_cache[ field_name ][ index ].detach();
    }


    /**
     * Return FieldContext from cache, or create a new one
     * and save it to the cache
     *
     * @param field_name - field name
     * @param index - field index
     */
    private _fromCache(
        field_name: string,
        index: PositiveInteger
    ): FieldContext
    {
        if ( this._field_context_cache[ field_name ][ index ] !== undefined )
        {
            return this._field_context_cache[ field_name ][ index ];
        }

        // Retrieve cloned nodes from the FieldContextStore
        const store = this._field_context_stores[ field_name ];

        const field_content   = store.getContentClone( index );
        const sibling_content = store.getSiblingContentClone( index );
        const position        = store.getPosition();

        const field_context = this._field_context_factory
            .create( field_name, index, position, field_content, sibling_content );

        this._field_context_cache[ field_name ][ index ] = field_context;

        return field_context;
    }


    /**
     * Determine the next attached element to attach before
     *
     * @param field_name - of element to find next element
     * @param index - field index
     */
    private _getNextElement(
        field_name: string,
        index: PositiveInteger
    ): NullableContextContent
    {
        const store = this._field_context_stores[ field_name ];
        let position: PositiveInteger = store.getPosition();

        position++;

        for ( let i = position; i < this._field_positions.length; i++ )
        {
            if ( this._field_positions[ i ] !== undefined )
            {
                let next_element_name = this._field_positions[ i ];
                let next_context = this._field_context_cache[ next_element_name ];

                if ( next_context[ index ] !== undefined
                    && next_context[ index ].isAttached() )
                {
                    return next_context[ index ].getFirstOfContentSet();
                }
            }
        }

        return null;
    }


}