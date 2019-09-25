/**
 * Token management
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
    Token,
    TokenId,
    TokenNamespace,
    TokenState,
    TokenStateAcceptable,
    TokenStateDeadable,
    TokenStateDoneable,
} from "./Token";

import { TokenDao, TokenData } from "./TokenDao";
import { DocumentId } from "../../document/Document";


/**
 * Token storage
 *
 * This store is used to create, read, and modify tokens.  Its API is
 * designed to constrain state transitions at compile-time.
 *
 * Stores are initialized with a given document id and namespace, and DAOs
 * are initialized with a root field.  Consequently, a new `TokenStore` must
 * be created for each group (namespace) of tokens that needs to be operated
 * on per document.
 *
 * A nullary token id generator must be provided.  Given that it takes no
 * arguments, this means that it is nondeterministic.  This function must
 * generate a unique token id at the namespace level or higher.
 *
 * The philosophy of this store is that any token within a given namespace
 * can be updated at any time, but each namespace has a unique "last" token
 * by document that represents the last token to have been updated within
 * that context.  When performing any operation on that namespace,
 * information regarding that "last" token will be provided so that the
 * caller can determine whether other tokens within that same context have
 * been modified since a given token was last updated, which may indicate
 * that a token has been superceded by another.
 *
 * As an example, consider the following sequence of events within some
 * namespace "location" for some document 1000:
 *
 *   1. A token `A` is created for a request to a service.  `last` is updated
 *      to point to `A`.
 *
 *   2. The user changes information about the location.
 *
 *   3. Another token `B` is created to request information for the new
 *      location data.  `last` is updated to point to `B`.
 *
 *   4. The response for token `A` returns and `A` is updated.
 *
 *   5. The caller for token `A` sees that `last` no longer points to `A` (by
 *      observing `last_mistmatch`), and so ignores the reply, understanding
 *      that `A` is now stale.
 *
 *   6. The response for  `B` returns and `B` is updated.
 *
 *   7. The caller notices that `last_mistmatch` is _not_ set, and so
 *      proceeds to continue processing token `B`.
 *
 * For more information on tokens, see `Token`.
 */
export class TokenStore
{
    /** Data access layer for underlying token data */
    private readonly _dao: TokenDao;

    /** Identifier of document to which store is constrained */
    private readonly _doc_id: DocumentId;

    /** Token namespace used for grouping per document */
    private readonly _token_ns: TokenNamespace;

    /** Token id generator (nullary, nondeterministic) */
    private readonly _idgen: () => TokenId;


    /**
     * Initialize store
     *
     * @param dao      data access layer
     * @param doc_id   constrain store to given document id
     * @param token_ns token namespace
     * @param idgen    token id generator
     */
    constructor(
        dao:      TokenDao,
        doc_id:   DocumentId,
        token_ns: TokenNamespace,
        idgen:    () => TokenId
    )
    {
        this._dao      = dao;
        this._doc_id   = doc_id;
        this._token_ns = token_ns;
        this._idgen    = idgen;
    }


    /**
     * Look up an existing token by id
     *
     * This looks up the given token id `token_id` for the document,
     * constrained to this store's namespace and document id.
     *
     * The state of the returned token cannot be determined until runtime,
     * so the caller is responsible for further constraining the type.
     *
     * @param token_id token id
     *
     * @return requested token, if it exists
     */
    lookupToken( token_id: TokenId ): Promise<Token<TokenState>>
    {
        return this._dao.getToken( this._doc_id, this._token_ns, token_id )
            .then( data => this._tokenDataToToken( data, data.status.type ) );
    }


    /**
     * Create a new token for the given document within the store's
     * namespace
     *
     * The returned token will always be `ACTIVE` and will always have
     * `last_mistmatch` set.
     */
    createToken(): Promise<Token<TokenState.ACTIVE>>
    {
        return this._dao.updateToken(
            this._doc_id, this._token_ns, this._idgen(), TokenState.ACTIVE, null
        )
            .then( data => this._tokenDataToToken( data, TokenState.ACTIVE ) );
    }


    /**
     * Convert raw token data to a higher-level `Token`
     *
     * The token state must be provided in addition to the token data for
     * compile-time type checking, where permissable.
     *
     * A token will have `last_mistmatch` set if the last token before a
     * database operation does not match `data.id`.
     *
     * @param data  raw token data
     * @param state token state
     *
     * @return new token
     */
    private _tokenDataToToken<T extends TokenState>( data: TokenData, state: T ):
        Token<T>
    {
        return {
            id:            data.id,
            state:         state,
            timestamp:     data.status.timestamp,
            data:          data.status.data,
            last_mismatch: this._isLastMistmatch( data ),
        };
    }


    /**
     * Determine whether the given token data represents a mismatch on the
     * previous last token id
     *
     * For more information on what this means, see `Token.last_mistmatch`.
     *
     * @param data raw token data
     */
    private _isLastMistmatch( data: TokenData ): boolean
    {
        return ( data.prev_last === null )
            || ( data.id !== data.prev_last.id );
    }


    /**
     * Complete a token
     *
     * Completing a token places it into a `DONE` state.  Only certain
     * types of tokens can be completed (`TokenStateDoneable`).
     *
     * A token that in a `DONE` state means that processing has completed
     * and is waiting acknowledgement from the system responsible for
     * handling the response.
     *
     * @param src  token to complete
     * @param data optional response data
     *
     * @return token in `DONE` state
     */
    completeToken( src: Token<TokenStateDoneable>, data: string | null ):
        Promise<Token<TokenState.DONE>>
    {
        return this._dao.updateToken(
            this._doc_id, this._token_ns, src.id, TokenState.DONE, data
        )
            .then( data => this._tokenDataToToken( data, TokenState.DONE ) );
    }


    /**
     * Acknowledge a token as accepted
     *
     * Accepting a token places it into an `ACCEPTED` state.  Only certain
     * types of tokens can be accepted (`TokenStateAcceptable`).
     *
     * A token that in an `ACCEPTED` state means that a previously completed
     * token has been acknowledged and all resources related to the
     * processing of the token can be freed.
     *
     * @param src  token to accept
     * @param data optional accept reason
     *
     * @return token in `ACCEPTED` state
     */
    acceptToken( src: Token<TokenStateAcceptable>, data: string | null ):
        Promise<Token<TokenState.ACCEPTED>>
    {
        return this._dao.updateToken(
            this._doc_id, this._token_ns, src.id, TokenState.ACCEPTED, data
        )
            .then( data => this._tokenDataToToken( data, TokenState.ACCEPTED ) );
    }


    /**
     * Kill a token
     *
     * Killing a token places it into a `DEAD` state.  Only certain types of
     * tokens can be killed (`TokenStateDeadable`).
     *
     * A token that in a `DEAD` state means that any processing related to
     * that token should be aborted.
     *
     * @param src  token to kill
     * @param data optional kill reason
     *
     * @return token in `DEAD` state
     */
    killToken( src: Token<TokenStateDeadable>, data: string | null ):
        Promise<Token<TokenState.DEAD>>
    {
        return this._dao.updateToken(
            this._doc_id, this._token_ns, src.id, TokenState.DEAD, data
        )
            .then( data => this._tokenDataToToken( data, TokenState.DEAD ) );
    }
}
