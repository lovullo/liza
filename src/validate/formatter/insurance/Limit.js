/**
 * Insurance limit formatter
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
    ValidatorFormatter = require( '../../ValidatorFormatter' );


/**
 * Formats insurance limit(s)
 */
module.exports = Trait( 'Limit' )
    .implement( ValidatorFormatter )
    .extend(
{    /**
     * Parse item as a number
     *
     * @param {string} data data to parse
     *
     * @return {string} data formatted for storage
     */
    'virtual abstract override public parse': function( data )
    {
        return ( isNaN( parseInt( data ) ) )
            ? data
            : this.__super( data );
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
        var number     = parseFloat( data ),
            is_numeric = !isNaN( number );

        if ( !is_numeric )
        {
            return data;
        }

        return this.__super(
            ( number < 1000 )
                ? ''+( number * 1000 )
                : data
        );
    }
} );
