/**
 * Formatter for unordered lists
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
 * Formats delimited items as an HTML unordered list, storing as a
 * delimited string.
 */
module.exports = Trait( 'UnorderedList' )
    .implement( ValidatorFormatter )
    .extend(
{
    /**
     * Format the given data as a delimited string
     *
     * HTML list elements will be stripped and items normalized
     * (whitespace and empty items removed).
     *
     * @param {string} data data to parse
     *
     * @return {string} formatted string
     */
    'virtual abstract override public parse': function( data )
    {
        // strip HTMl elements before processing (closing li tag
        // is translated into a semicolon)
        return this.getParts(
            this.__super( data )
                .replace( /<\/li>/g, ';' )
                .replace( /\s*<.*?>\s*/g, '' )
        ).join( '; ' );
    },


    /**
     * Retrieve data that may require formatting for display
     *
     * Return formatting is optional. No formatting will be done if no pattern
     * was given when the instance was constructed.
     *
     * To ensure consistency and correctness, *any data returned by this method
     * must be reversible* --- that is, parse( retrieve( data ) ) should not
     * throw an exception.
     *
     * @param {string} data data to format for display
     *
     * @return {string} data formatted for display
     */
    'virtual abstract override public retrieve': function( data )
    {
        var parts = this.getParts( this.__super( data ) ),
            items = '';

        for ( var i = 0; i < parts.length; i++ )
        {
            var part = parts[ i ];

            items += ( part === '' )
                ? ''
                : '<li>' + part + '</li>';
        }

        return ( items  === '' )
            ? ''
            : "<ul>" + items + "</ul>";
    },


    /**
    * Get trimmed, non-empty parts of semicolon-delimited string
    *
    * @param {string} input semicolon-delimited string
    *
    * @return {Array} non-empty trimmed parts
    */
    'virtual protected getParts': function( data )
    {
        var parts = data.split( /(?:\s*;+\s*)+/ ),
            ret   = [];

        for ( var i = 0; i < parts.length; i++ )
        {
            if ( parts[ i ] !== '' )
            {
                ret.push( parts[ i ] );
            }
        }

        return ret;
    }
} );
