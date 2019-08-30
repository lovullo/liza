/**
 * Describes a context with which diffing may take place between two buckets
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
 */

var Class             = require( 'easejs' ).Class,
    Bucket            = require( '../Bucket' ),
    BucketDiffContext = require( './BucketDiffContext' );


/**
 * Context with which diffing may take place between two buckets
 *
 * This does not describe the diffing algorithm---it merely desribes the
 * context for performing the diff.
 */
module.exports = Class( 'StdBucketDiffContext' )
    .implement( BucketDiffContext )
    .extend(
{
    /**
     * The bucket representing the current state to diff
     * @type {Bucket}
     */
    'private _head': null,

    /**
     * The bucket to diff against
     * @type {Bucket}
     */
    'private _prev': null,


    /**
     * Initialize context with two buckets to be compared
     *
     * @param {Bucket} head current bucket state to diff
     * @param {Bucket} prev prior bucket state to diff against
     */
    __construct: function( head, prev )
    {
        if ( !( Class.isA( Bucket, head ) ) )
        {
            throw TypeError( "Expected head of type Bucket; given " + head );
        }
        else if ( !( Class.isA( Bucket, prev ) ) )
        {
            throw TypeError( "Expected prev of type Bucket; given " + prev );
        }

        this._head = head;
        this._prev = prev;
    },


    /**
     * Invoke continuation for each unique field name in either bucket (the
     * union of bucket field names)
     *
     * The continuation will be passed as arguments, respectively, the field
     * name, the head value, and the prev value.
     *
     * @param {function( string, Array, Array )} callback continuation
     *
     * @return {StdBucketDiffContext} self
     */
    'public forEachField': function( callback )
    {
        var _self = this,
            headf = {},
            slice = Array.prototype.slice;

        // first, go through each of the fields in the head and compare the
        // values in each
        this._head.each( function( data, field )
        {
            callback( field,
                slice.call( data ),
                slice.call( _self._prev.getDataByName( field ), 0 )
            );

            // mark this field as having been recognized
            headf[ field ] = true;
        } );

        // finally, report back any fields in prev that are not in head
        this._prev.each( function( data, field )
        {
            if ( headf[ field ] )
            {
                return;
            }

            callback( field,
                slice.call( _self._head.getDataByName( field ), 0 ),
                slice.call( data )
            );
        } );
    },


    /**
     * Return an array [ current, prev ] of the values associated with the given
     * field
     *
     * @type {string} field field name
     *
     * @return {Array.<string>} field values for head and prev
     */
    'public getFieldValues': function( field )
    {
        var slice = Array.prototype.slice;

        return [
            slice.call( this._head.getDataByName( field ), 0 ),
            slice.call( this._prev.getDataByName( field ), 0 ),
        ];
    }
} );

