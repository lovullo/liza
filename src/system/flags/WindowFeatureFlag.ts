/**
 * UI Feature Flags
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


/**
  * Global feature flag for new UI
  *
  * TODO: replace with a proper feature flag solution
  */
export class WindowFeatureFlag
{
    private static instance: WindowFeatureFlag;


    /**
     * Initialize FeatureFlag
     */
    private constructor() {}


    /**
     * Get instance of FeatureFlag
     */
    public static getInstance(): WindowFeatureFlag
    {
        if ( !WindowFeatureFlag.instance )
        {
            WindowFeatureFlag.instance = new WindowFeatureFlag();
        }

        return WindowFeatureFlag.instance;
    }


    /**
     * Look up a feature flag by key
     *
     * @param key - the key to lookup
     *
     * @return whether or not this feature flag is enabled
     */
    isEnabled( key: string ): boolean
    {
        return ( !!(<any>window)[ key ] );
    }
}