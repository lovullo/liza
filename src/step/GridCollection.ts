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
import { GridGroupUi } from "../ui/group/GridGroupUi";
import { Collection } from "./Collection";
import { GroupUi } from "../ui/group/GroupUi";

const GridPrototype = require( "../ui/group/GridGroupUi" );

/**
 * A mediator of grid groups
 */
export class GridCollection extends Collection
{
    /**
     * Groups inside of this collection
     */
    protected _groups: GridGroupUi[] = [];

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
     * Set groups for the grid collection
     *
     * @param groups - child groups
     *
     * @return if groups were added
     */
    public setGroups( groups: GroupUi[] )
    {
        return super.setGroups( groups, GridPrototype );
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
}

