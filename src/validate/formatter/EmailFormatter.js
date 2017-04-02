/**
 * Contains e-mail address validator
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

// characters allowed in local-part, omitting dot (some of these are only
// allowed within quotes, but we're not going to bother convuluting the regex
// with that)
var local_chars = '[a-zA-Z0-9!#$%&\'*+/=?^_1{|}~()\\\\" (),:;<>@\\[\\]-]';


/**
 * Validates e-mail addresses
 *
 * See RFCs 5321, 5322 and 6531. The "Email address" Wikipedia page provides a
 * nice summary, which was used to create this regex.
 *
 * RFC 6531 supports all characters above U+007F, but this regex will *not*
 * permit them, since we make no attempt to support multibyte strings within
 * PHP (and PHP does not support them by default).
 */
module.exports = require( './PatternFormatter' )(
    [
        new RegExp(
            // begin local-part
            '^' +
                // dots cannot be the first character (negative look-ahead does
                // not consume any chars)
                '(?!\\.)' +

                // dots may appear, so long as they are not first or last in
                // local-part, and mustn't appear more than once consecutively
                // (this is not terribly efficient, but the local_chars portion
                // will match 99% of the time, avoiding most penalties...and
                // we'd be micro-optimizing, consider the use case of this
                // validator)
                '(?:' +
                    local_chars +
                    '|\\.(?!\\.)' +
                ')+' +

                // Dots may not appear at the end of local-part. The problem
                // here is that JS does not support negative look-behinds (total
                // bullshit), so we must use this ugly solution instead.
                local_chars +

            // begin domain portion
            '@' +
                // Must be a valid hostname and may contain comments in
                // parenthesis. IPs are technically allowed in brackets, but
                // we're not going to support that crap.
                '[a-zA-Z0-9-.()]+' +
            '$'
        ),

        // no special formatting will be done
        '$&'
    ]
);

