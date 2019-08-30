/**
 * Reduce field predicate results into vectors and flags
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

'use strict';

const { Class } = require( 'easejs' );


/**
 * Generate match vector for fields given field predicates and
 * classification results
 *
 * TODO: Support for multiple predicates on fields is for
 * backwards-compatibility with older classification systems; newer systems
 * generate a single classification representing the visibility of the
 * field, allowing the classification reduction complexity and logic to stay
 * within TAME.  Much of the complexity in this class can therefore be
 * removed in the future.
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
    constructor( fields )
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
    'public match'( classes, callback )
    {
        // currently not asynchronous, but leaves open the possibility
        callback(
            Object.keys( this._fields ).reduce(
                ( cmatch, id ) =>
                {
                    cmatch[ id ] = this._reduceFieldMatches(
                        this._fields[ id ],
                        classes
                    ), cmatch;

                    return cmatch;
                },
                { __classes: classes }
            )
        );

        return this;
    },


    /**
     * Reduce field class matches to a vector
     *
     * All field predicates in FIELDC will be reduced and combined into a
     * single vector representing the visibility of each index.
     *
     * @param {Array}  fieldc  field predicate class names
     * @param {Object} classes cmatch results
     *
     * @return {Object} all, any, indexes
     */
    'private _reduceFieldMatches'( fieldc, classes )
    {
        const vis = [];

        let all    = true;
        let hasall = false;

        // determine if we have a match based on the given classifications
        for ( let c in fieldc )
        {
            // if the indexes property is a scalar, then it applies to all
            // indexes
            const data    = ( classes[ fieldc[ c ] ] || {} );
            const thisall = !Array.isArray( data.indexes );

            let alltrue = ( !thisall || data.indexes === 1 );

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
            const indexes = ( thisall ) ? vis : data.indexes;

            for ( let i in indexes )
            {
                // default to visible; note that, if we've encountered any
                // "all index" situations (scalars), then we must only be
                // true if the scalar value was true
                vis[ i ] = +(
                    ( !hasall || all )
                    && ( ( vis[ i ] === undefined )
                        ? 1
                        : vis[ i ]
                    )
                    && this._reduceMatch(
                        ( thisall ) ? data.indexes : data.indexes[ i ]
                    )
                );
            }

            alltrue = alltrue && vis.every( x => x );
            all     = ( all && alltrue );
        }

        // store the classification match data for assertions, etc
        return {
            all:     all,
            any:     all || vis.some( x => !!x ),
            indexes: vis
        };
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
    'private _reduceMatch'( result )
    {
        if ( !Array.isArray( result ) )
        {
            return !!result;
        }

        return +result.some( x => this._reduceMatch( x ) );
    }
} );
