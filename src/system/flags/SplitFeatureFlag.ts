/**
 * Split Feature Flag
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

import { FeatureFlag, FeatureFlagConditions } from "./FeatureFlag";


/**
 * The Split Client
 */
export type SplitClient = {
    destroy:      () => void
    getTreatment: (
        split: string,
        key: string,
        atts: FeatureFlagConditions
    ) => Promise<string>
}


/**
  * Global feature flag for Split
  */
export class SplitFeatureFlag implements FeatureFlag
{
    /**
     * Initialize FeatureFlag
     */
    constructor(
        private readonly _default:         FeatureFlag,
        private readonly _base_conditions: FeatureFlagConditions = {},
        private readonly _client:          SplitClient,
    )
    {}


    /**
     * Close the Split connection
     */
    close(): void
    {
        this._client.destroy();
    }


    /**
     * Look up a feature flag by key
     *
     * @param key        - the key to lookup
     * @param conditions - optional conditions to specify
     *
     * @return whether or not this feature flag is enabled
     */
    isEnabled(
        key:        string,
        conditions: FeatureFlagConditions = {}
    ): Promise<boolean>
    {
        return new Promise<boolean>( ( resolve ) =>
        {
            // Add base conditions but don't override passed in values
            const atts = this._base_conditions;

            Object.keys( conditions ).forEach( ( cond_key ) =>
            {
                atts[ cond_key ] = conditions[ cond_key ];
            } );

            this._client.getTreatment( ''+atts.user || '', key, atts )
            .then( ( treatment: string ) =>
            {
                if ( treatment === 'on' )
                {
                    resolve( true );
                    return;
                }
                else if ( treatment === 'off' )
                {
                    resolve( false );
                    return;
                }

                resolve( this._default.isEnabled( key ) );
            } );
        } );
    }
}
