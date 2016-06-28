/**
 * Number formatter
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

var Trait              = require( 'easejs' ).Trait,
    ValidatorFormatter = require( '../ValidatorFormatter' );


/**
 * Formats insurance limit(s)
 */
module.exports = Trait( 'Number' )
    .implement( ValidatorFormatter )
    .extend(
{
    /**
     * Parse item as a number
     *
     * @param {string} data data to parse
     *
     * @return {string} data formatted for storage
     */
    'virtual abstract override public parse': function( data )
    {
        return this.__super( data ).replace( /[ ,]/g, '' );
    },


    /**
     * Format number with thousands separators
     *
     * @param {string} data data to format for display
     *
     * @return {string} data formatted for display
     */
    'virtual abstract override public retrieve': function( data )
    {
        return this.styleNumber( this.__super( data ) );
    },


    /**
     * Style number with thousands separators
     *
     * @param {string} number number to style (digits only)
     *
     * @return {string} formatted number
     */
    'virtual protected styleNumber': function( number )
    {
        var i     = number.length,
            ret   = [],
            chunk = '';

        do
        {
            i -= 3;

            // the second argument will adjust the length of the chunk
            // if I is negative (e.g. 3 + -2 = 1)
            chunk = number.substr(
                ( i < 0 ) ? 0 : i,
                Math.min( 3, 3 + i )
            );

            ret.unshift( chunk );
        } while ( i > 0 );

        return ret.join( ',' );
    }
} );