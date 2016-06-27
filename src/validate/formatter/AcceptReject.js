/**
 * Accept/reject styling
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
 * Applies supertype for each item in a delimited string
 */
module.exports = Trait( 'AcceptReject' )
    .implement( ValidatorFormatter )
    .extend(
{
    /**
     * Format accept/reject string as an integer boolean
     *
     * @param {string} data data to parse
     *
     * @return {string} data formatted for storage
     */
    'virtual abstract override public parse': function( data )
    {
        switch ( data )
        {
            case '0':
            case 'Rejected':
                return '0';

            case '1':
            case 'Accepted':
                return '1';

            default:
                return this.__super( data );
        }
    },


    /**
     * Format boolean integer as accept/reject string
     *
     * @param {string} data data to format for display
     *
     * @return {string} data formatted for display
     */
    'virtual abstract override public retrieve': function( data )
    {
        switch ( data )
        {
            case '0':
                return 'Rejected';

            case '1':
                return 'Accepted';

            default:
                return this.__super( data );
        }
    }
} );
