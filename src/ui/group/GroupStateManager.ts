/**
 * GroupStateManager
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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


/**
 * Manage various states a group might have
 *
 * The GroupStateManager registers flags stored in data attributes of the
 * group's markup which are references to keys in the bucket.
 */
export class GroupStateManager
{

    /**
     * References to bucket keys that constitute a pending state
     *
     * A pending state represents when a group's content is not ready to be
     * displayed. In the meantime, the presence of a pending state allows to group
     * to display temporary content or make other informed decisions.
     */
    private _pendingWhen: string[] = [];


    /**
     * Determine if the state manager observes the bucket for a pending state
     *
     * @return if pending is observed by the manager
     */
    public observesPending(): boolean
    {
        return this._pendingWhen.length > 0;
    }


    /**
     * Read and store relevant state attributes from an HTML element
     *
     * @param target - element containing state data
     */
    public processDataAttributes( target: HTMLElement )
    {
        const pending_when = target.getAttribute( 'data-pending-when' ) || '';

        this._pendingWhen = pending_when ? pending_when.split( ' ' ) : [];
    }


    /**
     * Determine if the group's state is pending
     *
     * @param bucket - bucket
     *
     * @return if the group is pending
     */
    public isPending( bucket: any ): boolean
    {
        if ( !this.observesPending() )
        {
            return false;
        }

        for ( let index in this._pendingWhen )
        {
            let key = this._pendingWhen[ index ];
            let data = bucket.getDataByName( key ) || [];

            for ( let data_index in data )
            {
                if ( +data[ data_index ] > 0 )
                {
                    return true;
                }
            }
        }

        return false;
    }
}