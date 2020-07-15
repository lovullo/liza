/**
 * Contains FullDateValidator VFormat instance
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

var date_parts = require('./DateValidator')();

/**
 * Normalizes the date to a common YYYY-MM-DD format
 *
 * Will format as MM/DD/YYYY for diplay in rater
 */
module.exports = require('./PatternFormatter')(
  [
    date_parts.getDateRegExp(),

    function (match, p1, p1_str, p2, p2_str, p3) {
      return date_parts.normalizeFullDate(match, p1, p1_str, p2, p2_str, p3);
    },
  ],

  // returns results formatted in MM/DD/YYYY format
  [/^(\d{4})-0?(\d{1,2})-0?(\d{1,2})$/, '$2/$3/$1']
);
