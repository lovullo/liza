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
    TokenState,
    TokenStateAcceptable,
    TokenStateDeadable,
    TokenStateDoneable,
} from "../Token";


/**
 * Token storage
 *
 * This store is used to create, read, and modify tokens.  Its API is
 * designed to constrain state transitions at compile-time.
 */
export interface TokenStore
{
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
    lookupToken( token_id: TokenId ): Promise<Token<TokenState>>;


    /**
     * Create a new token for the given document within the store's
     * namespace
     *
     * The returned token will always be `ACTIVE` and will always have
     * `last_mistmatch` set.
     */
    createToken(): Promise<Token<TokenState.ACTIVE>>;


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
        Promise<Token<TokenState.DONE>>;


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
        Promise<Token<TokenState.ACCEPTED>>;


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
        Promise<Token<TokenState.DEAD>>;
}
