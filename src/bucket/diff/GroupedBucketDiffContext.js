/**
 * Describes a context with which diffing may take place between buckets
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

var Class                   = require( 'easejs' ).Class,
    Bucket                  = require( '../Bucket' ),
    BucketDiffContext       = require( './BucketDiffContext' ),
    BucketSiblingDescriptor = require( '../BucketSiblingDescriptor' );


/**
 * Describe a context with which diffing may take place between buckets
 *
 * This encapsulates a standard diff context and adds an additional group
 * context for performing a grouped diff on the siblings of a particular
 * group.
 */
module.exports = Class( 'GroupedBucketDiffContext' )
    .implement( BucketDiffContext )
    .extend(
{
    /**
     * Context to decorate
     * @type {BucketDiffContext}
     */
    'private _context': null,

    /**
     * Descriptor for sibling relationships
     * @type {BucketSiblingDescriptor}
     */
    'private _desc': null,

    /**
     * Identifier of group to diff
     * @type {string}
     */
    'private _gid': '',

    /**
     * Hash table of group leaders for quick reference
     * @type {Object}
     */
    'private _leaders': {},


    /**
     * Prepare a context given an existing context and a sibling descriptor
     *
     * Augments an existing context so that it will contain enough information
     * to perform a diff on a group of fields.
     *
     * @param {BucketDiffContext}       context existing context to augment
     * @param {BucketSiblingDescriptor} desc    field relationship descriptor
     * @param {string}                  gid     id of group to diff
     */
    __construct: function( context, desc, gid )
    {
        if ( !( Class.isA( BucketDiffContext, context ) ) )
        {
            throw TypeError( "Must provide a BucketDiffContext" );
        }
        else if ( !( Class.isA( BucketSiblingDescriptor, desc ) ) )
        {
            throw TypeError( "Must provide a BucketSiblingDescriptor" );
        }
        else if ( !gid )
        {
            throw Error( "Must provide a group identifier for diffing" );
        }

        this._context = context;
        this._desc    = desc;
        this._gid     = ''+gid;

        this._validateGroup();
        this._processLeaders();
    },


    /**
     * Validates that the provided group exists and has at least one leader
     *
     * @throws {Error} if group does not exist or has no leaders
     */
    'private _validateGroup': function()
    {
        // will throw an exception if group does not exist
        if ( this._desc.getGroupLeaders( this._gid ).length === 0 )
        {
            throw Error(
                "Group '" + this._gid + "' must have at least one leader"
            );
        }
    },


    /**
     * Process group leaders into a hash table for speedy referencing
     */
    'private _processLeaders': function()
    {
        var leaders = this._desc.getGroupLeaders( this._gid ),
            i       = leaders.length;

        while ( i-- )
        {
            this._leaders[ leaders[ i ] ] = true;
        }
    },


    /**
     * Invoke continuation for each field name in the intersection of the parent
     * context fields with the list of fields in our group.
     *
     * The continuation will be passed as arguments the field name followed by
     * each of the respective bucket values.
     *
     * @param {function( string, Array, Array )} callback continuation
     *
     * @return {GroupedBucketDiffContext} self
     */
    'public forEachField': function( c )
    {
        var gfields = {},
            members = this._desc.getGroupMembers( this._gid ),
            i       = members.length;

        // hash
        while ( i-- )
        {
            gfields[ members[ i ] ] = true;
        }

        // filter all but members of the group
        this._context.forEachField( function( name )
        {
            if ( !( gfields[ name ] ) )
            {
                return;
            }

            c.apply( null, arguments );
        } );
    },


    /**
     * Determines if the given field is a group leader
     *
     * @param {string} field field name
     *
     * @return {boolean} true if field is a group leader, otherwise false
     */
    'public isGroupLeader': function( field )
    {
        return this._leaders[ field ] || false;
    },


    'public proxy getFieldValues': '_context'
} );

