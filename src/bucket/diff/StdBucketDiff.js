/**
 * Performs a standard value-by-value diff between buckets
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
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
 *
 * This can be called a "dumb diff".
 */

var Class      = require( 'easejs' ).Class,
    ArrayDiff  = require( '../../util/ArrayDiff' ),
    BucketDiff = require( './BucketDiff' ),
    Context    = require( './BucketDiffContext' );


module.exports = Class( 'StdBucketDiff' )
    .implement( BucketDiff )
    .extend(
{
    /**
     * Constructor for diff result
     */
    'private _Result': null,

    /**
     * Responsible for a shallow diff of array values
     * @type {ArrayDiff}
     */
    'private _arrdiff': null,


    __construct: function( arrdiff, Result )
    {
        if ( !( Class.isA( ArrayDiff, arrdiff ) ) )
        {
            throw TypeError( "Expecting ArrayDiff; received " + arrdiff );
        }

        this._arrdiff = arrdiff;
        this._Result  = Result;
    },


    /**
     * Perform a diff given a diff context
     *
     * @param {BucketDiffContext} context diff context
     *
     * @return {BucketDiffResult} result of diff
     */
    'public diff': function( context )
    {
        if ( !( Class.isA( Context, context ) ) )
        {
            throw TypeError( "Expected BucketDiffContext" );
        }

        var changed = {};

        var arrdiff = this._arrdiff;
        context.forEachField( function( field, a, b )
        {
            var diff    = arrdiff.diff( a, b ),
                i       = ( a.length > b.length ) ? a.length : b.length,
                changes = [];

            while ( i-- )
            {
                changes[ i ] = ( diff[ i ] !== undefined );
            }

            changed[ field ] = changes;
        } );

        return this._Result( context, changed );
    }
} );

