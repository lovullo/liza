/**
 * Default Feature Flag
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

import {FeatureFlag, FeatureFlagConditions} from './FeatureFlag';

/**
 * Default feature flag
 */
export class DefaultFeatureFlag implements FeatureFlag {
  /**
   * Initialize FeatureFlag
   */
  constructor(private readonly _defaults: FeatureFlagConditions) {}

  /**
   * No connections or variables to resolve
   */
  close(): void {}

  /**
   * Look up a feature flag by key
   *
   * @param key - the key to lookup
   *
   * @return whether or not this feature flag is enabled
   */
  isEnabled(key: string): Promise<boolean> {
    const value = this._defaults[key];

    if (value === undefined) {
      return Promise.reject('Feature flag "' + key + '" is undefined');
    }

    return Promise.resolve(!!value);
  }
}
