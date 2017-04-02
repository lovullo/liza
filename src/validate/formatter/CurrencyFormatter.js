/**
 * @license
 * Currency formatter
 *
 *  Copyright (C) 2016 LoVullo Associates, Inc.
 *
 *  This file is part of liza.
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
 * Currency of the form `$%2.f`
 *
 * @example
 *   Currency().parse( '$123' );      // => 123.00
 *   Currency().retrieve( '123.4' );  // => $123.40
 *
 * @class CurrencyFormatter
 * @mixes module:validate/formatter.Number
 * @mixes module:validate/formatter.StringFormat
 */
module.exports = require( './EchoFormatter' )
    .use( require( './Number' )( 2 ) )
    .use( require( './StringFormat' )( '$%s' ) );
