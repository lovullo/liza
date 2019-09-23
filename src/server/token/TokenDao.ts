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

import { TokenId, TokenNamespace, TokenState } from "./Token";
import { DocumentId } from "../../document/Document";


/** Manage token updates */
export interface TokenDao
{
    updateToken(
        doc_id:   DocumentId,
        ns:       TokenNamespace,
        token_id: TokenId,
        type:     TokenState,
        data:     string | null,
    ): Promise<TokenData>;


    getToken(
        doc_id:   DocumentId,
        ns:       TokenNamespace,
        token_id: TokenId
    ): Promise<TokenData>;
}


/**
 * Result of a Mongo query
 *
 * The returned property depends on the actual query.
 */
export interface TokenQueryResult
{
    readonly [propName: string]: TokenNamespaceResults | undefined,
}


/**
 * Token data for requested namespaces
 */
export interface TokenNamespaceResults
{
    readonly [propName: string]: TokenNamespaceData | undefined,
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
    readonly [propName: string]: TokenEntry | TokenStatus | TokenId | undefined,
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
 */
export interface TokenStatus
{
    /**
     * State of the token
     */
    readonly type: TokenState,

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
 * Token information returned from database queries
 *
 * This attempts to provide raw data without making assumptions as to how it
 * may be used.  For example, rather than returning whether the token was
 * the last modified, it returns the last token before the database
 * operation took place (`prev_last`).  Note that this interface is
 * recursively defined, but will only be a maximum of two levels deep (there
 * will be no `prev_last.prev_last !== null`).
 */
export interface TokenData
{
    /** Token identifier */
    id: TokenId,

    /** Status of token after the database operation */
    status: TokenStatus,

    /**
     * Status of token before the database operation
     *
     * If the operation is to retrieve a token (rather than to update it),
     * then this status will be identical to `status`.
     */
    prev_status: TokenStatus | null,

    /**
     * Token data of the last updated token for this document id and
     * namespace before the last database operation
     *
     * This is derived from the value of `TokenNamespaceData.last` and
     * `TokenNamespaceData.lastStatus` prior to the most recent operation
     * (e.g. Mongo's `findAndModify` with `new` set to `false`).
     */
    prev_last: TokenData | null,
}
