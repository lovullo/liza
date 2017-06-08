/**
 * Validator-formatter
 *
 *  Copyright (C) 2016 R-T Specialty, LLC.
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


var Interface = require( 'easejs' ).Interface;


module.exports = Interface( 'ValidatorFormatter',
{
    /**
     * Format the given data or fail if no match is found
     *
     * If the given data matches a pattern, it will be formatted with
     * respect to the first matched pattern.  Otherwise, an error will
     * be thrown indicating a validation failure.
     *
     * @param {string} data data to parse
     *
     * @return {string} formatted string, if a match is found
     */
    'public parse': [ 'data' ],


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
    'public retrieve': [ 'data' ]
} );
