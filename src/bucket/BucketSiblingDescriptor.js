/**
 * Describes relationships between bucket fields
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

var Class  = require( 'easejs' ).Class;


/**
 * Describe relationships between bucket fields
 *
 * Siblings may be grouped under a given identifier. Siblings may be a part
 * of different groups. Each group can have any number of leaders which
 * together may be used as a group identifier.
 */
module.exports = Class( 'BucketSiblingDescriptor',
{
    /**
     * Fields and their group memberships
     * @type {Object}
     */
    'private _fields': {},

    /**
     * A simple hash of group names and their associated leaders
     * @type {Object}
     */
    'private _groups': {},


    /**
     * Define a new group id with optional initial members
     *
     * @param {string}         gid     group id to define
     * @param {Array.<string>} members initial group members
     *
     * @return {BucketSiblingDescriptor} self
     */
    'public defineGroup': function( gid, members )
    {
        // do not allow re-defining groups; use addGroupMember instead
        if ( this._groups[ gid ] )
        {
            throw Error( "Group '" + gid + "' already exists" );
        }

        members = members || [];

        // will store group leaders
        this._groups[ gid ] = [];

        // mark each field as a member of this group
        for ( var field in members )
        {
            this.addGroupMember( gid, members[ field ] );
        }

        return this;
    },


    /**
     * Add a field to a defined group
     *
     * @param {string} gid   defined group id
     * @param {string} field name of field
     *
     * @return {BucketSiblingDescriptor} self
     */
    'public addGroupMember': function( gid, field )
    {
        if ( !( this._groups[ gid ] ) )
        {
            throw Error( "Group '" + gid + "' does not exist" );
        }

        if ( !( this._fields[ field ] ) )
        {
            this._fields[ field ] = {};
        }

        // add group membership
        this._fields[ field ][ gid ] = true;
        return this;
    },


    /**
     * Retrieve names of all fields that are a member of the given group
     *
     * @param {string} gid group id
     *
     * @return {Array.<string>} group members
     */
    'public getGroupMembers': function( gid )
    {
        if ( !( this._groups[ gid ] ) )
        {
            throw Error( "Group '" + gid + "' does not exist" );
        }

        var members = [];

        // construct group membership from fields
        for ( var field in this._fields )
        {
            if ( this._fields[ field ][ gid ] )
            {
                members.push( field );
            }
        }

        return members;
    },


    /**
     * Retrieve a list of all defined group ids
     *
     * @return {Array.<string>} defined group ids
     */
    'public getGroupIds': function()
    {
        var gids = [];

        // can use Object.keys() in the future when all browsers support it...or
        // write our own
        for ( var group in this._groups )
        {
            gids.push( group );
        }

        return gids;
    },


    /**
     * Mark fields of a defined group as leaders
     *
     * Each new leader must be a part of the group. Once set, the leaders cannot
     * be redefined.
     *
     * @param {string}         gid         group id
     * @param {Array.<string>} new_leaders names of leaders
     */
    'public markGroupLeaders': function( gid, new_leaders )
    {
        var leaders = this._groups[ gid ];

        if ( leaders.length > 0 )
        {
            throw Error( "Group '" + gid + "' leaders already set" );
        }

        var l = new_leaders.length;
        for ( var i = 0; i < l; i++ )
        {
            var field = new_leaders[ i ];
            if ( !( ( this._fields[ field ] || {} )[ gid ] ) )
            {
                throw Error(
                    "Field '" + field + "' is not a member of group '" +
                    gid + "'"
                );
            }

            leaders.push( field );
        }

        return this;
    },


    /**
     * Return the leaders of a defined group
     *
     * @param {string} gid group id
     *
     * @return {Array.<string>} group leaders
     */
    'public getGroupLeaders': function( gid )
    {
        if ( !( this._groups[ gid ] ) )
        {
            throw Error( "Group '" + gid + "' is undefined" );
        }

        return Array.prototype.slice.call( this._groups[ gid ], 0 );
    }
} );

