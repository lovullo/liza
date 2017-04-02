/**
 * Contains ShortDateValidator VFormat instance
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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

var date_parts = require( './DateValidator' )();


/**
 * Validates and formats dates in a MM/YYYY format
 */
module.exports = require( './PatternFormatter' )(
    [
        date_parts.getDateRegExp(),

        function( match, p1, p1_str, p2, p2_str, p3 )
        {
            return date_parts.normalizeShortDate(
                match, p1, p1_str, p2, p2_str, p3
            );
        }
    ],

    // returns results formatted in MM/YYYY format
    [ /^(\d{4})-0?(\d{1,2})-0?(\d{1,2})$/, "$2/$1" ]
);

