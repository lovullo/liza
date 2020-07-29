/**
 * FieldResetter
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
 *
 */

import {Client} from './Client';
import {CmatchData} from './Cmatch';

/**
 * This class is responsible for changing values of fields
 */
export class FieldResetter {
  /**
   * @param _client           - main client instance
   * @param _hasSharedDefault - if all fields share the same default
   * @param _defaultValue     - default value for all fields
   */
  constructor(
    private _client: Client,
    private _hasSharedDefault: boolean = false,
    private _defaultValue: string = ''
  ) {}

  /**
   * Return fields with their reset values based on the field names input
   *
   * @param fields - key-value store that contains relevant indexes for a field
   *
   * @return key-value store of fields containing default values at each index
   */
  public reset(fields: CmatchData): CmatchData {
    const quote = this._client.getQuote();
    const update: {[index: string]: any} = {};

    for (const field in fields) {
      const cur = fields[field],
        cdata = quote.getDataByName(field),
        val = this._getValue(field);

      const data = [];

      for (const i in cur) {
        const index = cur[i];

        if (cdata[index] === val) {
          continue;
        }
        data[index] = val;
      }

      update[field] = data;
    }

    return update;
  }

  /**
   * Get the default value for a field by its name
   *
   * @param field - name of the field
   *
   * @return the default value of the field
   */
  private _getValue(field: string): string {
    return this._hasSharedDefault
      ? this._defaultValue
      : this._client.elementStyler.getDefault(field);
  }
}
