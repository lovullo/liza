/**
 *  Collection
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
import { GridGroupUi } from "../ui/group/GridGroupUi";

/**
 * A mediator of groups
 */
export class Collection
{
    /**
     * Groups inside of this collection
     */
    private _groups: GridGroupUi[] = [];


    /**
     * Create a new collection instance
     *
     * @param _content - target collection element
     */
    constructor( private _content: HTMLElement ) {}


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
     * Set groups for the collection
     *
     * When this is run, it will clear out any groups previously observed.
     *
     * @param groups - child groups
     *
     * @return if groups were added
     */
    public setGroups( groups: GridGroupUi[] )
    {
        const group_elems = this._getGroupFieldsets();
        let group_ids  = [];
        this._groups = [];

        if ( group_elems.length === 0 )
        {
            return false;
        }

        for ( let i = 0; i < group_elems.length; i++ )
        {
            const element = <HTMLElement>group_elems[ i ];

            if ( element )
            {
                group_ids.push( element.getAttribute( "id" ) );
            }
        }

        group_ids = group_ids.filter( id => id !== null && id !== "" );

        for ( let group in groups )
        {
            const groupui = groups[ group ];
            const is_child_id = group_ids.indexOf( groupui.getGroupId() ) !== -1;

            if ( is_child_id )
            {
                this._groups.push( groupui );
            }
        }

        return this._groups.length > 0;
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
        const classes = this._content.classList;

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
     * Get group fieldsets
     *
     * @return group fieldsets
     */
    private _getGroupFieldsets(): NodeList
    {
        return this._content.querySelectorAll( "fieldset" );
    }
}

