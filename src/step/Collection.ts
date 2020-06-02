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
import { GroupUi } from "../ui/group/GroupUi";

/**
 * A mediator of groups
 *
 * A collection serves as a mediator between groups. The intent is that some
 * specific behavior should exist within a collection of groups. As such, this
 * class is abstract to force specific use-cases to define their own behavior in
 * a subclass.
 */
export abstract class Collection
{
    /**
     * Groups inside of this collection
     */
    protected _groups: GroupUi[] = [];


    /**
     * Create a new collection instance
     *
     * @param _content - target collection element
     */
    constructor( protected _content: HTMLElement ) {}


    /**
     * Set groups for the collection
     *
     * When this is run, it will clear out any groups previously observed.
     *
     * @param groups    - child groups
     * @param prototype - only accept groups of this type
     *                    An undefined value has no group restrictions.
     *
     * @return if groups were added
     */
    public setGroups( groups: GroupUi[], prototype?: any )
    {
        this._groups = [];

        const group_elems = this._getGroupFieldsets();
        let group_ids     = [];

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

        // Filter groups if groupType is set
        if ( prototype !== undefined ) {
            this._groups = this._groups.filter( g => g.isA( prototype ) );
        }

        return this._groups.length > 0;
    }


    /**
     * Force subclass to implement this behavior
     *
     * @throws {Error} if the subclass doesn't implement this method
     */
    public visit()
    {
        throw new Error( "Collection subclass must implement visit method." );
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

