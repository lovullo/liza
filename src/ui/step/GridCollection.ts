/**
 *  Grid Collection
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
 *
 *  This file is part of liza.
 *
 *  liza is free software: you can redistribute it and/or modify
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
import { Collection } from "./Collection";
import { ConditionalStyler } from "../styler/ConditionalStyler";
import { GridGroupUi } from "../group/GridGroupUi";
import { GroupUi } from "../group/GroupUi";


/**
 * The only type of group this collection may contain
 */
const REQUIRED_GROUP_TYPE = require( "../group/GridGroupUi" );

/**
 * HTML section tag
 */
const SECTION_TAG = "SECTION";

/**
 * HTML fieldset tag
 */
const FIELDSET_TAG = "FIELDSET";

/**
 * Escape key
 */
const ESCAPE_KEY = 'Escape';

/**
 * Escape keycode
 */
const ESCAPE_KEYCODE = 27;

/**
 * HTMLElement type that allows null values
 */
type NullableHTMLElement = HTMLElement | null;

/**
 * A list of groups keyed by their ID
 */
export type GroupList = {
    [ id: string ] : GroupUi;
}

/**
 * A mediator of grid groups
 */
export class GridCollection implements Collection
{
    /**
     * Groups inside of this collection
     */
    protected _groups: GridGroupUi[] = [];


    /**
     * Create a new GridCollection instance
     *
     * @param _content - target collection element
     * @param groups - list of groups
     * @param _document - DOM
     * @param _styler - conditional styler
     */
    constructor(
        private _content: HTMLElement,
        groups: GroupList,
        private readonly _document: Document,
        private readonly _styler: ConditionalStyler
    ) {
        this._setGroups( groups );

        this._content.addEventListener( 'click', ( e: MouseEvent ) =>
        {
            if ( e.target )
            {
                this._handleClick( e.target );
            }
        } );

        this._document.addEventListener( 'keydown', ( e: KeyboardEvent ) =>
        {
            this._handleKeyEvent( e );
        } );
    }


    /**
     * Trigger visitation of the collection
     *
     * It's assumed that the groups will have been visited before the
     * collection's visit method is called. If not, the children may not have
     * properly updated data.
     */
    public visit()
    {
        const column_count = this._getColumnCount();

        this._setColumnClass( column_count );
    }


    /**
     * Get the count of columns in the grid
     *
     * @return the number of columns
     */
    private _getColumnCount()
    {
        const unique = ( type: string, i: number, children: string[] ) =>
        {
            return children.indexOf( type ) === i;
        };

        return this._groups
            .filter( group => group.isVisible() )
            .map( child => child.getXType() )
            .filter( unique )
            .length;
    }


    /**
     * Set a column class on the group
     *
     * Remove existing column classes.
     *
     * @param number - the number of columns
     */
    private _setColumnClass( number: number )
    {
        const class_class = /col-\d+/;
        const classes     = this._content.classList;

        for ( let index = 0; index < classes.length; index++ )
        {
            const value = classes[ index ];

            if ( class_class.test( value ) )
            {
                this._content.classList.remove( value );
            }
        }

        this._content.classList.add( 'col-' + number );
    }


    /**
     * Handle the click event for the collection
     *
     * @param target - click target
     */
    private _handleClick( target: EventTarget )
    {
        const element = <HTMLElement> target;
        const section = this._getGridSection( element );
        const group   = this._getGridGroup( element );

        if ( !section || !group )
        {
            return;
        }

        this._handleSelection( section, group );
    }


    /**
     * Handle selection of a group
     *
     * @param section       - section of the group that was clicked
     * @param group_element - group that was clicked
     */
    private _handleSelection( section: HTMLElement, group_element: HTMLElement )
    {
        const is_disabled = group_element.classList.contains( "disabled" );
        const is_content  = section.classList.contains( "content" );
        const is_actions  = section.classList.contains( "actions" );
        const group       = this._getGroupFromElement( group_element );

        // If the group is disabled we don't take any action on selection
        if ( is_disabled || !group )
        {
            return;
        }

        if ( is_content )
        {
            this._groups.forEach( g =>
            {
                if ( g === group )
                {
                    g.isSelected() ? g.deselect() : g.select();
                }
                else if ( this._groupsConflict( g, group ) )
                {
                    g.deselect();
                }
            } );
        }

        if ( is_actions )
        {
            this._groups.forEach( g =>
            {
                if ( g === group )
                {
                    g.areDetailsOpen()
                        ? g.closeDetails()
                        : g.openDetails( this._styler );
                }
                else
                {
                    g.closeDetails();
                }
            } );
        }
    }


    /**
     * Handle keyboard events
     *
     * TODO: Remove keyCode reference once support for IE11 is dropped
     *
     * @param event - Keyboard event
     */
    private _handleKeyEvent( event: KeyboardEvent )
    {
        if ( event.key === ESCAPE_KEY || event.keyCode === ESCAPE_KEYCODE )
        {
            // Escape key closes any open group detail panes
            this._groups.forEach( g =>
            {
                g.closeDetails();
            } );
        }
    }


    /**
     * Get the grid group's section element from an HTML element
     *
     * @param element - target element
     *
     * @return grid's section element
     */
    private _getGridSection( element: HTMLElement )
    {
        const isGridSection = ( elem: HTMLElement ): boolean =>
        {
            return elem.tagName === SECTION_TAG && (
                elem.classList.contains( "content" ) ||
                elem.classList.contains( "actions" )
            );
        };

        return this._getClosestElement( element, this._content, isGridSection );
    }


    /**
     * Get the grid group root from an HTML element
     *
     * @param element - target element
     *
     * @return grid group's root fieldset element
     */
    private _getGridGroup( element: HTMLElement )
    {
        const isGridGroup = ( elem: HTMLElement ): boolean =>
        {
            return elem.tagName === FIELDSET_TAG &&
                elem.classList.contains( "grid" );
        };

        return this._getClosestElement( element, this._content, isGridGroup );
    }


    /**
     * Get the GridGroup that corresponds to a group element
     *
     * @param element - target element
     *
     * @return group
     */
    private _getGroupFromElement( element: HTMLElement ): GridGroupUi
    {
        const id = element.getAttribute( "id" );

        return this._groups.filter( group => group.getGroupId() === id )[ 0 ];
    }


    /**
     * Get the closest element that matches a test
     *
     * @param elem   - starting element
     * @param stopAt - element to stop looking at
     * @param test   - test to conduct
     *
     * @return closest found element
     */
    private _getClosestElement(
        elem: NullableHTMLElement,
        stopAt: HTMLElement,
        test: (elem: HTMLElement) => boolean,
    ): NullableHTMLElement {
        while ( elem ) {
            if ( elem === stopAt )
            {
                return null;
            }

            if ( test( elem ) ) {
                return elem;
            }

            elem = elem.parentElement;
        }

        return null;
    }


    /**
     * Set groups for the collection
     *
     * @param groups    - child groups
     */
    private _setGroups( groups: GroupList )
    {
        const group_elems = this._getGroupFieldsets();

        if ( group_elems.length === 0 )
        {
            return;
        }

        const group_ids = group_elems
            .map( ( element: HTMLElement ) => element.getAttribute( "id" ) )
            .filter( id => !!id );

        for ( let id in groups )
        {
            const group = groups[ id ];
            const is_child_id = ( group_ids.indexOf( id ) > -1 );

            if ( is_child_id && group.isA( REQUIRED_GROUP_TYPE ) )
            {
                this._groups.push( <GridGroupUi> group );
            }
        }
    }


    /**
     * Get group fieldsets
     *
     * @return group fieldsets
     */
    private _getGroupFieldsets(): HTMLElement[]
    {
        return Array.prototype.slice.call(
            this._content.querySelectorAll( "fieldset" )
        );
    }


    /**
     * Determine if the groups conflict
     *
     * Groups conflict when they share a category.
     *
     * @param g1 - first group
     * @param g2 - second group
     *
     * @return if the groups conflict
     */
    private _groupsConflict( g1: GridGroupUi, g2: GridGroupUi ): boolean
    {
        return g1.getCategories().filter( ( category: string ) =>
        {
            return ( g2.getCategories().indexOf( category ) > -1 );
        } ).length > 0;
    }
}

