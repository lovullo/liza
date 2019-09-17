/**
 * Uniform error handling for Liza: error chaining
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

import { ___Writable } from 'naughty';


/**
 * An Error augmented to include information about an underlying cause
 *
 * To create new chains, use the `chain` function.
 *
 * Chaining should be used when an error is caught and transformed into
 * another, more specific error.  By maintaining a reference to an existing
 * error, context is not lost, which can be helpful for debugging and
 * logging.
 *
 * Chains may be nested to an arbitrary depth, but because of the nature of
 * JavaScript's errors, recursive chain type checks must be done at runtime.
 */
export interface ChainedError<T extends Error = Error> extends Error
{
    readonly chain: T,
}


/**
 * Type predicate for `ChainedError`
 *
 * This predicate can be used at runtime to determine whether an error is
 * chained.
 *
 * @param e error object
 *
 * @return whether `e` is of type ChainedError
 */
export const isChained = ( e: Error ): e is ChainedError =>
    ( <ChainedError>e ).chain !== undefined;


/**
 * Chains two `Error`s
 *
 * This is intended to be used as if it were a constructor, where the first
 * argument is a new `Error` instance.
 *
 * @param enew  new error
 * @param eprev error to chain
 *
 * @return `enew` with `eprev` chained
 */
export function chain( enew: Error, eprev: Error ): ChainedError
{
    ( <___Writable<ChainedError>>enew ).chain = eprev;
    return <ChainedError>enew;
}
