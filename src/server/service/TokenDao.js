/**
 * Token state management
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
 * Manages token updates
 *
 * Note that this is tightly coupled with MongoDB.
 */
module.exports = Class( 'TokenDao',
{
    /**
     * @type {MongoCollection} mongo database collection
     */
    'private _collection': null,


    /**
     * Initialize connection
     *
     * @param {MongoCollection} collection token Mongo collection
     */
    'public __construct': function( collection )
    {
        this._collection = collection;
    },


    /**
     * Create or update a token record
     *
     * The token entry is entered in the token log, and then the current
     * entry is updated to reflect the changes.  The operation is atomic.
     *
     * @param {number} quote_id unique quote identifier
     * @param {string} ns       token namespace
     * @param {string} token    token value
     * @param {string} data     token data, if any
     * @param {string} status   arbitrary token type
     *
     * @param {function(*)} callback with error or null (success)
     *
     * @return {TokenDao} self
     */
    'public updateToken': function( quote_id, ns, token, type, data, callback )
    {
        var token_data = {},
            token_log  = {},
            root       = this._genRoot( ns ) + '.',
            current_ts = Math.floor( ( new Date() ).getTime() / 1000 );

        var token_entry = {
            type:      type,
            timestamp: current_ts,
        };

        if ( data )
        {
            token_entry.data = data;
        }

        token_data[ root + 'last' ]            = token;
        token_data[ root + 'lastStatus' ]      = token_entry;
        token_data[ root + token + '.status' ] = token_entry;

        token_log[ root + token + '.statusLog' ] = token_entry;

        this._collection.update(
            { id: +quote_id },
            {
                $set: token_data,
                $push: token_log
            },
            { upsert: true },

            function ( err, docs )
            {
                callback( err || null );
            }
        );

        return this;
    },


    /**
     * Retrieve existing token under the namespace NS, if any, for the quote
     * identified by QUOTE_ID
     *
     * If a TOKEN_ID is provided, only that token will be queried; otherwise,
     * the most recently created token will be the subject of the query.
     *
     * @param {number} quote_id quote identifier
     * @param {string} ns       token namespace
     * @param {string} token_id token identifier (unique to NS)
     *
     * @param {function(?Error,{{id: string, status: string}})} callback
     *
     * @return {TokenDao} self
     */
    'public getToken': function( quote_id, ns, token_id, callback )
    {
        var _self = this;

        var root   = this._genRoot( ns ) + '.',
            fields = {};

        fields[ root + 'last' ] = 1;
        fields[ root + 'lastStatus' ] = 1;

        if ( token_id )
        {
            // XXX: injectable
            fields[ root + token_id ] = 1;
        }

        this._collection.findOne(
            { id: +quote_id },
            { fields: fields },
            function( err, data )
            {
                if ( err )
                {
                    callback( err, null );
                    return;
                }

                if ( !data || ( data.length === 0 ) )
                {
                    callback( null, null );
                    return;
                }

                var exports = data.exports || {},
                    ns_data = exports[ ns ] || {};

                callback(
                    null,
                    ( token_id )
                        ? _self._getRequestedToken( token_id, ns_data )
                        : _self._getLatestToken( ns_data )
                );
            }
        );

        return this;
    },


    /**
     * Retrieve latest token data, or `null` if none
     *
     * @param {{last: string, lastStatus: string}} ns_data namespace data
     *
     * @return {?{{id: string, status: string}}} data of latest token in
     *                                           namespace
     */
    'private _getLatestToken': function( ns_data )
    {
        var last = ns_data.last;

        if ( !last )
        {
            return null;
        }

        return {
            id:     last,
            status: ns_data.lastStatus,
        };
    },


    /**
     * Retrieve latest token data, or `null` if none
     *
     * @param {string} token_id token identifier for namespace associated
     *                           with NS_DATA
     *
     * @param {{last: string, lastStatus: string}} ns_data namespace data
     *
     * @return {?{{id: string, status: string}}} data of requested token
     */
    'private _getRequestedToken': function( token_id, ns_data )
    {
        var reqtok = ns_data[ token_id ];

        if ( !reqtok )
        {
            return null;
        }

        return {
            id:     token_id,
            status: reqtok.status,
        };
    },


    /**
     * Determine token root for the given namespace
     *
     * @param {string} ns token namespace
     *
     * @return {string} token root for namespace NS
     */
    'private _genRoot': function( ns )
    {
        // XXX: injectable
        return 'exports.' + ns;
    },
} );

