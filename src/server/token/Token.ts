/**
 * Token abstraction
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
 * A token represents some sort of long-running asynchronous process.  It
 * was designed to handle HTTP requests.
 */


/** Identifier unique to token namespace */
export type TokenId = NominalType<string, 'TokenId'>;


/** Token namespace for identifiers */
export type TokenNamespace = NominalType<string, 'TokenNamespace'>;


/**
 * Token states
 *
 * States are listed as strings for ease of {de,}serialization for storage.
 *
 * - `ACTIVE` - an outstanding token that has not yet been processed.
 * - `DONE` - a token has finished processing and result data may be
 *   available.
 * - `ACCEPTED` - a `DONE` token has been acknowledged by the requester.
 * - `DEAD` - a token has been killed and should no longer be used.
 *
 * For valid state transitions, see `TokenTransition`.
 */
export enum TokenState {
    ACTIVE   = "ACTIVE",
    DONE     = "DONE",
    ACCEPTED = "ACCEPTED",
    DEAD     = "DEAD",
};


/** Tokens that can be killed (placed into a `DEAD` state) */
export type TokenStateDeadable =
    TokenState.ACTIVE | TokenState.DONE | TokenState.DEAD;

/** Tokens that can be completed (placed into a `DONE` state) */
export type TokenStateDoneable = TokenState.ACTIVE;

/** Tokens that can be accepted (placed into an `ACCEPTED` state) */
export type TokenStateAcceptable = TokenState.DONE;


/**
 * Request token
 *
 * Tokens are basic state machines with a unique identifier, timestamp of
 * the last state transition, and associated string data.
 */
export interface Token<T extends TokenState>
{
    /** Token identifier */
    readonly id: TokenId;

    /** Token state */
    readonly state: T

    /** Timestamp of most recent state transition */
    readonly timestamp: UnixTimestamp;

    /** Data associated with last state transition */
    readonly data: string | null;

    /**
     * Whether this token id differs from the last modified for a given
     * document within a given namespace during the last database operation
     *
     * Whether or not this value is significant is dependent on the
     * caller.  For example, when a new token is created, this value will
     * always be `true`, because the last updated token couldn't possibly
     * match a new token id.  However, when updating a token, this will only
     * be `true` if another token in the same namespace for the same
     * document has been modified since this token was last modified.
     *
     * This can be used to determine whether activity on a token should be
     * ignored.  For example, a token that is not the latest may represent a
     * stale request that should be ignored.
     *
     * This value can only be trusted within a context of the most recent
     * database operation; other processes may have manipulated tokens since
     * that time.
     */
    readonly last_mismatch: boolean;
}

