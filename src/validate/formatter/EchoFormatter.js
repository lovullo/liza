/**
 * Echo formatter
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

var Class              = require( 'easejs' ).Class,
    ValidatorFormatter = require( '../ValidatorFormatter' );


/**
 * Echos its input
 *
 * This formatter does nothing; it is intended to be used as a base
 * for mixing in other formatters, or for a formatting noop.
 */
module.exports = Class( 'EchoFormatter' )
    .implement( ValidatorFormatter )
    .extend(
{
    /**
     * Echo given data
     *
     * @param {string} data data to echo
     *
     * @return {string} DATA
     */
    'virtual public parse': function( data )
    {
        return data;
    },


    /**
     * Echo given data
     *
     * @param {string} data data to echo
     *
     * @return {string} DATA
     */
    'virtual public retrieve': function( data )
    {
        return data;
    }
} );
