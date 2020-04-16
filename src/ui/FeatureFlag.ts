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
export class FeatureFlag
{
    /**
     * Toggle new DOM performance features which include
     * use of GroupContext to attach/detach elements from the DOM
     */
    getDomPerfFlag(): boolean
    {
        return ( !!(<any>window).dom_perf_flag )
    }
}