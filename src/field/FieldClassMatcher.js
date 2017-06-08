/**
 * Contains FieldClassMatcher class
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var Class = require( 'easejs' ).Class;


/**
 * Generates match sets for field based on their classifications and a given
 * classification set
 */
module.exports = Class( 'FieldClassMatcher',
{
    /**
     * Fields and their accepted classes
     * @type {Object.<Array.<string>>}
     */
    'private _fields': {},


    /**
     * Initialize matcher with a list of fields and their classifications
     *
     * @param {Object.<Array.<string>>} fields field names and their classes
     */
    __construct: function( fields )
    {
        this._fields = fields;
    },


    /**
     * Generate classification match array for each field
     *
     * Any index for any field will be considered to be a match if the index
     * is classified as each of the field's required classifications.
     *
     * @param {Object.<is,indexes>} classes classifications
     *
     * @param {function(Object.<any,indexes>)} callback with cmatch data
     *
     * @return {FieldClassMatcher} self
     */
    'public match': function( classes, callback )
    {
        var cmatch = {};
        cmatch.__classes = classes;

        for ( var field in this._fields )
        {
            var cur    = this._fields[ field ],
                vis    = [],
                all    = true,
                hasall = false;

            if ( cur.length === 0 )
            {
                continue;
            }

            // determine if we have a match based on the given classifications
            for ( var c in cur )
            {
                // if the indexes property is a scalar, then it applies to all
                // indexes
                var data    = ( classes[ cur[ c ] ] || {} ),
                    thisall = ( typeof data.indexes !== 'object' ),
                    alltrue = ( !thisall || data.indexes === 1 );

                // if no indexes apply for the given classification (it may be a
                // pure boolean), then this variable will be true if any only if
                // all of them are true. Note that we only want to take the
                // value of thisall if we're on our first index, as if hasall is
                // empty thereafter, then all of them certainly aren't true!
                hasall = ( hasall || ( thisall && +c === 0 ) );

                // this will ensure that, if we've already determined some sort
                // of visibility, that encountering a scalar will still manage
                // to affect previous results even if it is the last
                // classification that we are checking
                var indexes = ( thisall ) ? vis : data.indexes;

                for ( var i in indexes )
                {
                    // default to visible; note that, if we've encountered any
                    // "all index" situations (scalars), then we must only be
                    // true if the scalar value was true
                    vis[ i ] = (
                        ( !hasall || all )
                        && ( ( vis[ i ] === undefined )
                            ? 1
                            : vis[ i ]
                        )
                        && this._reduceMatch(
                            ( thisall ) ? data.indexes : data.indexes[ i ]
                        )
                    );

                    // all are true unless one is false (duh?)
                    alltrue = !!( alltrue && vis[ i ] );
                }

                all = ( all && alltrue );
            }

            // default 'any' to 'all'; this will have the effect of saying "yes
            // there are matches, but we don't care what" if there are no
            // indexes associated with the match, implying that all indexes
            // should match
            var any = all;
            for ( var i = 0, len = vis.length; i < len; i++ )
            {
                if ( vis[ i ] )
                {
                    any = true;
                    break;
                }
            }

            // store the classification match data for assertions, etc
            cmatch[ field ] = {
                all:     all,
                any:     any,
                indexes: vis
            };
        }

        // currently not asynchronous, but leaves open the possibility
        callback( cmatch );

        return this;
    },


    /**
     * Reduces the given scalar or vector
     *
     * If a scalar is provided, then it is immediately returned. Otherwise, the
     * vector is reduced using a logical or and the integer representation of
     * the boolean value returned.
     *
     * This is useful for classification matrices since each match will be a
     * vector and we wish to consider any match within that vector to be a
     * positive match.
     *
     * @param {*} result result
     *
     * @return {number} 0 if false otherwise 1 for true
     */
    'private _reduceMatch': function( result )
    {
        if ( ( result === undefined )
            || ( result === null )
            || ( result.length === undefined )
        )
        {
            return result;
        }

        var ret = false,
            i   = result.length;

        // reduce with logical or
        while( i-- )
        {
            // recurse just in case we have another array of values
            ret = ret || this._reduceMatch( result[ i ] );
        }

        return +ret;
    }
} );

