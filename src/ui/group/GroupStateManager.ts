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
 * Listing of possible states
 *
 * Pending - A pending state represents when a group's content is not ready to
 * be displayed. In the meantime, the presence of a pending state allows the
 * group to display temporary content or make other informed decisions.
 *
 * Disabled - A disabled state represents that the group is not active.
 */
enum GroupState
{
    Pending = "pending",
    Disabled = "disabled"
};

/**
 * The data standard on which stateful applications depend
 *
 * A legend depicts criteria for when a state should be enabled. It is an object
 * keyed by the state names and resolve to lists of bucket keys which enable the
 * state.
 */
type StateLegend = {
    [ K in GroupState ]: string[]
};

/**
 * Manage various states a group might have
 *
 * The GroupStateManager registers flags stored in data attributes of the
 * group's markup which are references to keys in the bucket.
 */
export class GroupStateManager
{

    /**
     * A legend that maps possible states to their bucket triggers
     */
    private _legend: StateLegend = {
        pending: [],
        disabled: []
    }


    /**
     * Determine if the state manager observes the bucket for a certain state
     *
     * @param state - state name
     *
     * @return if pending is observed by the manager
     */
    public observes( state: GroupState ): boolean
    {
        return ( this._legend[ state ]?.length ?? 0 ) > 0;
    }


    /**
     * Read and store relevant state attributes from an HTML element
     *
     * @param target - element containing state data
     */
    public processDataAttributes( target: HTMLElement )
    {
        const pending = target.getAttribute( 'data-pending-when' ) || '';
        const disabled = target.getAttribute( 'data-disabled-when' ) || '';

        this._legend[ "pending" ] = pending ? pending.split( ' ' ) : [];
        this._legend[ "disabled" ] = disabled ? disabled.split( ' ' ) : [];
    }


    /**
     * Determine if a particular state is enabled for the group
     *
     * @param state  - state to check
     * @param bucket - bucket
     *
     * @return if a group's state is enabled
     */
    public is( state: GroupState, bucket: any ): boolean
    {
        if ( !this.observes( state ) )
        {
            return false;
        }

        for ( let index in this._legend[ state ] )
        {
            let key = this._legend[ state ][ index ];
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
