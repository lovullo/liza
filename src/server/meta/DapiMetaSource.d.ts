/**
 * Data-API-based metadata population
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { DataApiManager } from "../../dapi/DataApiManager";
import { PositiveInteger } from "../../numeric";

/**
 * Retrieve data for meta field using Data API
 *
 * TODO: The reason this class exists at all is to encapsulate the horrid
 * API.  Once refactored, perhaps this class will no longer be necessary.
 */
export declare class DapiMetaSource
{
    /**
     * Retrieve field data
     *
     * @param field        - field name
     * @param index        - field index
     * @param dapi_manager - manager for dapi calls
     * @param dapi         - dapi descriptor
     * @param data         - dapi input data
     *
     * @return object containing `field`, `index`, and return data
     */
    getFieldData(
        field:        string,
        index:        PositiveInteger,
        dapi_manager: DataApiManager,
        dapi:         any,
        data:         Record<string, any>,
    ): Promise<any>;
}
