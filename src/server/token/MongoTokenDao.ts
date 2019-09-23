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
    TokenDao,
    TokenData,
    TokenEntry,
    TokenNamespaceData,
    TokenNamespaceResults,
    TokenQueryResult,
    TokenStatus,
} from "./TokenDao";

import { DocumentId } from "../../document/Document";
import { TokenId, TokenNamespace, TokenState } from "./Token";
import { UnknownTokenError } from "./UnknownTokenError";
import { context } from "../../error/ContextError";


/**
 * Manages token updates
 *
 * This uses MongoDB as the underlying database.
 */
export class MongoTokenDao implements TokenDao
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
     * Retrieve a Unix timestamp
     *
     * This is used for timestampping token updates.
     */
    private readonly _getTimestamp: () => UnixTimestamp;


    /**
     * Initialize connection
     *
     * @param collection Mongo collection
     * @param root_field topmost field in mongo document
     * @param date_ctor  Date constructor
     */
    constructor(
        collection:   MongoCollection,
        root_field:   string,
        getTimestamp: () => UnixTimestamp,
    )
    {
        this._collection   = collection;
        this._rootField    = root_field;
        this._getTimestamp = getTimestamp;
    }


    /**
     * Create or update a token record
     *
     * The token entry is entered in the token log, and then the current
     * entry is updated to reflect the changes.  The operation is atomic.
     *
     * @param doc_id   unique document identifier
     * @param ns       token namespace
     * @param token    token value
     * @param data     token data, if any
     * @param status   arbitrary token type
     *
     * @return token data
     */
    updateToken(
        doc_id:   DocumentId,
        ns:       TokenNamespace,
        token_id: TokenId,
        type:     TokenState,
        data:     string | null,
    ): Promise<TokenData>
    {
        const root = this._genRoot( ns ) + '.';

        const token_entry: TokenStatus = {
            type:      type,
            timestamp: this._getTimestamp(),
            data:      data,
        };

        const token_data = {
            [ root + 'last' ]:               token_id,
            [ root + 'lastStatus' ]:         token_entry,
            [ root + token_id + '.status' ]: token_entry,
        };

        const token_log = {
            [ root + token_id + '.statusLog' ]: token_entry,
        };

        return new Promise( ( resolve, reject ) =>
        {
            this._collection.findAndModify(
                { id: +doc_id },
                [],
                {
                    $set: token_data,
                    $push: token_log
                },
                {
                    upsert: true,
                    new:    false,
                    fields: {
                        [ root + 'last' ]:               1,
                        [ root + 'lastStatus' ]:         1,
                        [ root + token_id + '.status' ]: 1,
                    },
                },

                ( err: Error|null, prev_data ) =>
                {
                    if ( err )
                    {
                        reject( err );
                        return;
                    }

                    const prev_result = <TokenNamespaceResults>
                        prev_data[ this._rootField ] || {};

                    const prev_ns = prev_result[ ns ];

                    resolve( {
                        id:          token_id,
                        status:      token_entry,
                        prev_status: this._getPrevStatus( prev_ns, token_id ),
                        prev_last:   this._getPrevLast( prev_ns ),
                    } );
                }
            );
        } );
    }


    /**
     * Determine previous token status, or produce `null`
     *
     * @param prev_ns  previous namespace data
     * @param token_id token identifier
     *
     * @return previous token status
     */
    private _getPrevStatus(
        prev_ns: TokenNamespaceData | undefined,
        token_id: TokenId
    ): TokenStatus | null
    {
        if ( prev_ns === undefined )
        {
            return null;
        }

        const entry = <TokenEntry>( prev_ns[ token_id ] );

        return ( entry === undefined )
            ? null
            : entry.status;
    }


    /**
     * Determine previous last updated token for namespace, otherwise `null`
     *
     * @param prev_ns previous namespace data
     *
     * @return previous last token data
     */
    private _getPrevLast(
        prev_ns: TokenNamespaceData | undefined
    ): TokenData | null
    {
        if ( prev_ns === undefined || ( prev_ns || {} ).last === undefined )
        {
            return null;
        }

        return {
            id:          prev_ns.last,
            status:      prev_ns.lastStatus,
            prev_status: null,
            prev_last:   null,
        };
    }


    /**
     * Retrieve existing token under the namespace NS, if any, for the doc
     * identified by DOC_ID
     *
     * If a TOKEN_ID is provided, only that token will be queried; otherwise,
     * the most recently created token will be the subject of the query.
     *
     * @param doc_id   document identifier
     * @param ns       token namespace
     * @param token_id token identifier (unique to NS)
     *
     * @return token data
     */
    getToken( doc_id: DocumentId, ns: TokenNamespace, token_id: TokenId ):
        Promise<TokenData>
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
                { id: +doc_id },
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

                    const ns_data = field[ ns ];

                    if ( !ns_data )
                    {
                        reject( context(
                            new UnknownTokenError(
                                `Unknown token namespace '${ns}' for document '${doc_id}`
                            ),
                            {
                                doc_id: doc_id,
                                ns:     ns,
                            }
                        ) );

                        return;
                    }

                    resolve( ( token_id )
                        ? this._getRequestedToken( doc_id, ns, token_id, ns_data )
                        : this._getLatestToken( doc_id, ns, ns_data )
                    );
                }
            );
        } );
    }


    /**
     * Retrieve latest token data
     *
     * @param doc_id  document id
     * @param ns      token namespace
     * @param ns_data namespace data
     *
     * @return data of latest token in namespace
     *
     * @throws UnknownTokenError if last token data is missing
     */
    private _getLatestToken(
        doc_id:  DocumentId,
        ns:      TokenNamespace,
        ns_data: TokenNamespaceData
    ): TokenData
    {
        var last = ns_data.last;

        if ( !last )
        {
            throw context(
                new UnknownTokenError(
                    `Failed to locate last token for namespace '${ns}'` +
                        `on document '${doc_id}'`
                ),
                {
                    doc_id: doc_id,
                    ns:     ns,
                },
            );
        }

        return {
            id:          last,
            status:      ns_data.lastStatus,
            prev_status: ns_data.lastStatus,
            prev_last:   this._getPrevLast( ns_data ),
        };
    }


    /**
     * Retrieve latest token data
     *
     * @param doc_id   document id
     * @param ns       token namespace
     * @param token_id token identifier for namespace associated with NS_DATA
     * @param ns_data  namespace data
     *
     * @return data of requested token
     *
     * @throws UnknownTokenError if token data is missing
     */
    private _getRequestedToken(
        doc_id:   DocumentId,
        ns:       TokenNamespace,
        token_id: TokenId,
        ns_data:  TokenNamespaceData
    ): TokenData
    {
        const reqtok = <TokenEntry>ns_data[ <string>token_id ];

        if ( !reqtok )
        {
            throw context(
                new UnknownTokenError(
                    `Missing data for requested token '${ns}.${token_id}'` +
                        `for document '${doc_id}'`
                ),
                {
                    doc_id:   doc_id,
                    ns:       ns,
                    token_id: token_id,
                },
            );
        }

        return {
            id:          token_id,
            status:      reqtok.status,
            prev_status: reqtok.status,
            prev_last:   this._getPrevLast( ns_data ),
        };
    }


    /**
     * Determine token root for the given namespace
     *
     * @param ns token namespace
     *
     * @return token root for namespace NS
     */
    private _genRoot( ns: TokenNamespace ): string
    {
        // XXX: injectable
        return this._rootField + '.' + ns;
    }
};

