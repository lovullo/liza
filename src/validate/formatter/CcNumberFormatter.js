/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Contains validator for credit card numbers
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

/**
 * Simply validates cc number length
 *
 * This does not check the validity of the data entered (that is --- we do not
 * perform a checksum).
 *
 * We do not format the output in any particular manner, as different carriers
 * may provider different styles.
 */
module.exports = require('./PatternFormatter')([
  /^[0-9 -]+$/,
  function (match) {
    // remove set delimiters
    var result = match.replace(/[ -]/g, '');

    // easier to simply check here rather than convoluting the regex
    if (result.length < 15 || result.length > 16) {
      throw Error('Invalid length');
    }

    return result;
  },
]);
