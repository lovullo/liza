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

