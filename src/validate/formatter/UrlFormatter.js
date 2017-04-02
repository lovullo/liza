/**
 * Validates URLs according to RFC 1738
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


module.exports = require( './PatternFormatter' )(
    [
        new RegExp(
            '^' +
                // optional protocol (we only permit http and ftp...no no
                // particular reason, unless you can think of a reason to accept
                // others)
                '(?:(?:ht|f)tps?://)?' +

                // hostname
                '[\\w\\d-]+[\\w\\d.-]*' +

                // optionally a filename, parameters, etc after the hostname, so
                // long as it is delimited by a forward slash
                '(?:/[\\w\\d$_.+!*\'(),%?:@=&;-]*)?' +
            '$'
        ),

        // no formatting
        '$&'
    ]
);

