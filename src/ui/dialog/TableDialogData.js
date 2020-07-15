/**
 * Table data for dialog
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

/**
 * Provides data to TableDialog for styling
 *
 * TODO: Upon move to Liza, this can be removed in favor of a more generic
 * interface that allows any arbitrary table. It could probably be implemented
 * atop of the new DataApi in Liza.
 */
module.exports = Interface('TableDialogData', {
  /**
   * Retrieve table column titles
   *
   * @return {Array.<string>} array of column titles
   */
  'public getColumnTitles': ['callback'],

  /**
   * Retrieve a list of rows
   *
   * @return {Array.<Array>} array of row data
   */
  'public getRows': ['callback'],
});
