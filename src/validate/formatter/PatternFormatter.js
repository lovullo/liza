/**
 * Pattern-based validator-formatter
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


var Class              = require( 'easejs' ).Class,
    ValidatorFormatter = require( '../ValidatorFormatter' );


/**
 * Data validation and formatting based on patterns and their
 * replacements
 */
module.exports = Class( 'VFormat' )
    .implement( ValidatorFormatter )
    .extend(
{
    /**
     * Pattern definition
     * @type {Array.<Array>}
     */
    'private _dfn': [],

    /**
     * Data retrieval format
     * @type {Array}
     */
    'private _retdfn': [],


    /**
     * Initialize with a pattern definition and return format definition
     *
     * The pattern definition should be an array of arrays with two elements:
     * the pattern to match against and its replacement. The patterns must be
     * regular expressions and the replacements may be either strings or
     * functions.
     *
     * The return formatter is an optional single array consisting of a pattern
     * and a replacement.
     *
     * @param {Array.<Array>} dfn    pattern definition
     * @param {Array=}        retdfn return format definition
     */
    __construct: function( dfn, retdfn )
    {
        this._dfn    = dfn;
        this._retdfn = retdfn;
    },


    /**
     * Format the given data or fail if no match is found
     *
     * If the given data matches a pattern, it will be formatted with respect to
     * the first matched pattern. Otherwise, an error will be thrown indicating
     * a validation failure.
     *
     * @param {string} data data to parse
     *
     * @return {string} formatted string, if a match is found
     */
    'public parse': function( data )
    {
        var dfn = this._dfn;

        // cast all data to a string
        data = ''+( data );

        var match;
        for ( var i = 0, len = this._dfn.length; i < len; i += 2 )
        {
            if ( match = dfn[ i ].test( data ) )
            {
                var replace = dfn[ i + 1 ];

                // minor optimization that may help on very large sets in
                // poorly performing browsers; do not perform replacement if it
                // it would result in an identical string
                try
                {
                    return ( ( replace === '$&' )
                        ? data
                        : data.replace( dfn[ i ], dfn[ i + 1 ] )
                    );
                }
                // throwing an exception within the replacement function is
                // equivalent to saying "no match" and allows for more
                // complicated logic that would otherwise overcomplicate a
                // regex; fall through to continue to the next matcher
                catch ( e ) {}
            }
        }

        throw Error( 'No match for data: ' + data );
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
    'public retrieve': function( data )
    {
        if ( !( this._retdfn ) )
        {
            return data;
        }

        return ( ''+data ).replace( this._retdfn[ 0 ], this._retdfn[ 1 ] );
    }
} );

