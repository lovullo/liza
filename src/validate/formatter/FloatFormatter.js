/**
 * Validates float format
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

module.exports = require('./PatternFormatter')([
  /^([0-9, ]*)(?:\.([0-9]{1,2})?)?$/,
  function (_, number, decimals) {
    decimals = decimals || '00';

    // return as %.2f, stripping commas, spaces and leading
    // zeros
    return (
      number.replace(/[, ]/g, '').replace(/^0*?(0)?$|^0*/, '$1') +
      '.' +
      (decimals.length === 2 ? decimals : decimals + '0')
    );
  },
]);
