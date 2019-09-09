/**
 * Token state management
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

import {
    TokenEntry,
    TokenNamespaceData,
    TokenNamespaceResults,
    TokenQueryResult,
    TokenStatus,
    TokenType,
} from "./TokenQueryResult";


/**
 * Token information
 */
export interface TokenData
{
    id:     string,
    status: TokenStatus,
}


/**
 * Manages token updates
 *
 * Note that this is tightly coupled with MongoDB.
 */
export default class TokenDao
{
    /**
     * Mongo database collection
     */
    private readonly _collection: MongoCollection;

    /**
     * Field storing token data, relative to document root
     */
    private readonly _rootField: string;


    /**
     * Initialize connection
     *
     * @param collection Mongo collection
     */
    constructor( collection: MongoCollection, root_field: string )
    {
        this._collection = collection;
        this._rootField  = root_field;
    }


    /**
     * Create or update a token record
     *
     * The token entry is entered in the token log, and then the current
     * entry is updated to reflect the changes.  The operation is atomic.
     *
     * @param quote_id unique quote identifier
     * @param ns       token namespace
     * @param token    token value
     * @param data     token data, if any
     * @param status   arbitrary token type
     */
    updateToken(
        quote_id: number,
        ns:       string,
        token:    string,
        type:     TokenType,
        data:     string | null,
    ): Promise<void>
    {
        const root = this._genRoot( ns ) + '.';

        // XXX: nondeterminism
        const current_ts = Math.floor( ( new Date() ).getTime() / 1000 );

        const token_entry: TokenStatus = {
            type:      type,
            timestamp: current_ts,
            data:      data,
        };

        const token_data = {
            [ root + 'last' ]:            token,
            [ root + 'lastStatus' ]:      token_entry,
            [ root + token + '.status' ]: token_entry,
        };

        const token_log = {
            [ root + token + '.statusLog' ]: token_entry,
        };

        return new Promise( ( resolve, reject ) =>
        {
            this._collection.update(
                { id: +quote_id },
                {
                    $set: token_data,
                    $push: token_log
                },
                { upsert: true },

                function ( err: Error|null )
                {
                    if ( err )
                    {
                        reject( err );
                        return;
                    }

                    resolve();
                }
            );
        } );
    }


    /**
     * Retrieve existing token under the namespace NS, if any, for the quote
     * identified by QUOTE_ID
     *
     * If a TOKEN_ID is provided, only that token will be queried; otherwise,
     * the most recently created token will be the subject of the query.
     *
     * @param quote_id quote identifier
     * @param ns       token namespace
     * @param token_id token identifier (unique to NS)
     *
     * @return token data
     */
    getToken( quote_id: number, ns: string, token_id: string ):
        Promise<TokenData|null>
    {
        const root        = this._genRoot( ns ) + '.';
        const fields: any = {};

        fields[ root + 'last' ] = 1;
        fields[ root + 'lastStatus' ] = 1;

        if ( token_id )
        {
            // XXX: injectable
            fields[ root + token_id ] = 1;
        }

        return new Promise( ( resolve, reject ) =>
        {
            this._collection.findOne(
                { id: +quote_id },
                { fields: fields },
                ( err: Error|null, data: TokenQueryResult ) =>
                {
                    if ( err || !data )
                    {
                        reject( err );
                        return;
                    }

                    const field = <TokenNamespaceResults>data[ this._rootField ]
                        || {};

                    if ( !field[ ns ] )
                    {
                        resolve( null );
                        return;
                    }

                    const ns_data = <TokenNamespaceData>field[ ns ];

                    resolve( ( token_id )
                        ? this._getRequestedToken( token_id, ns_data )
                        : this._getLatestToken( ns_data )
                    );
                }
            );
        } );
    }


    /**
     * Retrieve latest token data, or `null` if none
     *
     * @param ns_data namespace data
     *
     * @return data of latest token in namespace
     */
    private _getLatestToken( ns_data: TokenNamespaceData ): TokenData | null
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
    }


    /**
     * Retrieve latest token data, or `null` if none
     *
     * @param token_id token identifier for namespace associated with NS_DATA
     * @param ns_data  namespace data
     *
     * @return data of requested token
     */
    private _getRequestedToken(
        token_id: string,
        ns_data:  TokenNamespaceData
    ): TokenData | null
    {
        const reqtok = <TokenEntry>ns_data[ token_id ];

        if ( !reqtok )
        {
            return null;
        }

        return {
            id:     token_id,
            status: reqtok.status,
        };
    }


    /**
     * Determine token root for the given namespace
     *
     * @param ns token namespace
     *
     * @return token root for namespace NS
     */
    private _genRoot( ns: string ): string
    {
        // XXX: injectable
        return this._rootField + '.' + ns;
    }
};

