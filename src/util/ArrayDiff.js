/**
 * Interface for performing basic array diffs
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

var Interface = require('easejs').Interface;

module.exports = Interface('ArrayDiff', {
  /**
   * Return non-matching indexes and their values
   *
   * The returned array will set the value of the associated changed index to
   * an array containing both values of a and b respectively; unchanged
   * indexes will be undefined.
   *
   * @param {Array} a first array to compare
   * @param {Array} b second array to compare
   *
   * @return {Array.Array.<*>} an array of non-matching values
   */
  'public diff': ['a', 'b'],
});
