/**
 * Automatically discard staging bucket contents
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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

var Class         = require( 'easejs' ).Class,
    StagingBucket = require( './StagingBucket' );


/**
 * When enabled, automatically discards staging bucket contents on change.
 *
 * This may be useful when the staging bucket should be put into a temporary
 * state where changes should be disallowed (e.g. in the middle of a
 * revert).
 */
module.exports = Class( 'StagingBucketAutoDiscard',
{
    /**
     * Automatically discards all staged data before it is processed for the
     * given bucket
     *
     * This deletes the data before it is even merged into the staging bucket.
     *
     * N.B.: This method silently reverts any staged data currently in the
     * bucket (without triggering any events), so it is important to handle
     * existing data properly before calling this (unless the data is garbage).
     *
     * @param {StagingBucket} bucket staging bucket to enable on
     *
     * @return {StagingBucketAutoDiscard} self
     */
    'public enable': function( bucket )
    {
        if ( !( Class.isA( StagingBucket, bucket ) ) )
        {
            throw Error( 'Required StagingBucket' );
        }

        // Unhook to prevent duplicate event hooks.
        this.disable( bucket );

        // prevent the data write from even being attempted and revert anything
        // that may be currently in the bucket (without triggering events)
        bucket
            .on( 'preStagingUpdate', this._clobberFields )
            .revert( false );

        return this;
    },


    /**
     * Disables auto-discard on the given bucket
     *
     * @param {StagingBucket} bucket staging bucket to disable on
     *
     * @return {StagingBucketAutoDiscard} self
     */
    'public disable': function( bucket )
    {
        if ( !( Class.isA( StagingBucket, bucket ) ) )
        {
            throw Error( 'Required StagingBucket' );
        }

        bucket.removeListener( 'preStagingUpdate', this._clobberFields );
        return this;
    },


    /**
     * Deletes all fields on the given object
     *
     * @param {Object} data object to clobber
     *
     * @return {undefined}
     */
    'private _clobberFields': function( data )
    {
        for ( var field in data )
        {
            // oops!
            delete data[ field ];
        }
    }
} );
