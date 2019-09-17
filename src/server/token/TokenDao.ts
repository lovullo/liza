/**
 * Token data access
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
 *
 * These types are used to describe the structure of the token data as it
 * is stored in Mongo.  It has a number of undesirable properties and
 * duplicates data---this was intended to make querying easier and work
 * around Mongo limitations.
 *
 * This structure can be changed in the future, but we'll need to maintain
 * compatibility with the existing data.
 */

import { TokenId, TokenNamespace } from "./Token";
import { DocumentId } from "../../document/Document";


/** Manage token updates */
export interface TokenDao
{
    updateToken(
        doc_id:   DocumentId,
        ns:       TokenNamespace,
        token_id: TokenId,
        type:     TokenType,
        data:     string | null,
    ): Promise<void>;


    getToken(
        doc_id:   DocumentId,
        ns:       TokenNamespace,
        token_id: TokenId
    ): Promise<TokenData>;
}


/**
 * Token status types as stored in the database
 */
export type TokenType = 'ACTIVE' | 'DONE' | 'ACCEPTED' | 'DEAD';


/**
 * Result of a Mongo query
 *
 * The returned property depends on the actual query.
 */
export interface TokenQueryResult
{
    readonly [propName: string]: TokenNamespaceResults | null,
}


/**
 * Token data for requested namespaces
 */
export interface TokenNamespaceResults
{
    readonly [propName: string]: TokenNamespaceData | null,
}


/**
 * Token data associated with the given namespace
 *
 * This contains duplicate information in order to work around inconvenient
 * limitations in [earlier] versions of Mongo.
 */
export interface TokenNamespaceData
{
    /**
     * Identifier of last token touched in this namespace
     */
    readonly last: TokenId,

    /**
     * Most recent token status
     *
     * This is a duplicate of the last entry in `TokenEntry#statusLog`.
     */
    readonly lastStatus: TokenStatus,

    /**
     * Tokens indexed by identifier
     *
     * These data are inconveniently placed---the type definition here is to
     * accommodate the above fields.  Anything using this should cast to
     * `TokenEntry`.
     */
    readonly [propName: string]: TokenEntry | TokenStatus | TokenId | null,
}


/**
 * Information about a given token
 */
export interface TokenEntry
{
    /**
     * Current token status
     *
     * This is a duplicate of the last element of `statusLog`.
     */
    readonly status: TokenStatus,

    /**
     * Log of all past status changes and any associated data
     *
     * This is pushed to on each status change.  The last element is
     * duplicated in `status`.
     */
    readonly statusLog: TokenStatus[],
}


/**
 * Status of the token (past or present)
 *
 * A status is a `TokenType`, along with a timestamp of occurrence and
 * optional data.
 */
export interface TokenStatus
{
    /**
     * State of the token
     */
    readonly type: TokenType,

    /**
     * Unix timestamp representing when the status change occurred
     */
    readonly timestamp: UnixTimestamp,

    /**
     * Arbitrary data associated with the status change
     *
     * For example, a token of status `DONE` may be associated with the
     * fulfillment of a request, in which case this may contain the response
     * data.
     */
    readonly data: string | null,
}


/**
 * Token information
 */
export interface TokenData
{
    id:     TokenId,
    status: TokenStatus,
}
