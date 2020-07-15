/**
 * Reduce field predicate results into vectors and flags
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
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {ClassData} from '../client/Cmatch';

/**
 * Generate match vector for fields given field predicates and
 * classification results
 */
export declare class FieldClassMatcher {
  /**
   * Generate classification match array for each field
   *
   * Any index for any field will be considered to be a match if the index
   * is classified as each of the field's required classifications.
   */
  match(classes: ClassData, callback: (cmatch: any) => void): FieldClassMatcher;
}
