/**
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

var Trait              = require( 'easejs' ).Trait,
    ValidatorFormatter = require( '../ValidatorFormatter' );


/**
 * Formats amount as currency
 *
 * This does not guarantee that the value is a number; this should be
 * mixed in atop of a formatter that does guarantee such.
 */
module.exports = Trait( 'Currency' )
    .implement( ValidatorFormatter )
    .extend(
{
    /**
     * Parse item as currency
     *
     * @param {string} data data to parse
     *
     * @return {string} data formatted for storage
     */
    'virtual abstract override public parse': function( data )
    {
        return this.__super( data ).replace( /^\$*/g, '' );
    },


    /**
     * Format amount as a currency
     *
     * @param {string} data data to format for display
     *
     * @return {string} data formatted for display
     */
    'virtual abstract override public retrieve': function( data )
    {
        return this.styleCurrency( this.__super( data ) );
    },


    /**
     * Style amount with currency symbol
     *
     * @param {string} amount amount to style
     *
     * @return {string} formatted number
     */
    'virtual protected styleCurrency': function( amount )
    {
        return ( ''+amount === '' )
            ? amount
            : '$' + amount;
    },
} );
