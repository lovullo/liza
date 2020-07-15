/**
 * Filters bucket data
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

export declare module bucket_filter {
  export type filter = {
    /**
     * Filters bucket data based on the provided types
     *
     * If a type is not provided, the data is considered to be unwanted and is
     * removed entirely. Otherwise, the filter is applied to every element in the
     * array.
     *
     * The data is modified in place.
     *
     * @param data         - data to filter
     * @param key_types    - filter types
     * @param ignore_types - types to ignore
     * @param permit_null  - Allow nulls in results
     *
     * @return Object modified data
     */
    filter(
      data: Record<string, any>,
      key_types: Record<string, any>,
      ignore_types: Record<string, boolean>,
      permit_null: boolean
    ): Record<string, any>;

    /**
     * Filter bucket data based on values
     *
     * @param values      - The values to filter
     * @param filter      - The filter to apply
     * @param permit_null - Allow nulls in results
     *
     * @return the filtered values
     */
    filterValues(
      values: string[],
      filter: string,
      permit_null: boolean
    ): string[];
  };
}
