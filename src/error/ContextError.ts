/**
 * Uniform error handling for Liza: error context
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
 * This context system is intended to play nicely with how Error objects are
 * typically used in JavaScript.  As such, rather than creating new error
 * prototypes / subclasses, these rely on structural typing to augment
 * existing `Error` objects.
 */

import {___Writable} from 'naughty';

/**
 * Error with additional context regarding its cause
 *
 * Errors may be augmented with key/value data (see `ErrorContext`)
 * containing data that will be helpful for debugging the cause of the
 * error.  The context should be expected to appear in structured logs, so
 * it shouldn't include sensitive data without some mitigation layer.
 *
 * A context may be optionally typed, but note that such context will
 * generally be lost any time promises are used, so type predicates will
 * need to be used to restore the type with information at runtime.
 *
 * Since the context is intended primarily for debugging, it shouldn't be
 * relied on to drive control flow unless absolutely necessary, in which
 * case an explicit context should be used.
 */
export interface ContextError<T extends ErrorContext = ErrorContext>
  extends Error {
  readonly context: T;
}

/**
 * Key/value context for an error
 *
 * Rather than accepting data of an arbitrary type, we force key/value for
 * reasons of extensibility and consistency: if more information is needed
 * in the future, the type will remain unchanged.  The values, however, may
 * include any arbitrary data.
 */
export type ErrorContext = {readonly [P: string]: any};

/**
 * Type predicate for `ContextError`
 *
 * Note that this is a predicate for a generic `ContextError`, type, which
 * is equivalent to `ContextError<ErrorContext>`.  Other contexts must
 * define their own predicates.
 *
 * @param e error object
 *
 * @return whether `e` is of type `ContextError`
 */
export const hasContext = (e: Error): e is ContextError =>
  (<ContextError>e).context !== undefined;

/**
 * Adds context to an error
 *
 * This is intended to be used as if it were a constructor, where the first
 * argument is a new `Error` instance.
 *
 * @param enew    error object to add context to
 * @param context key/value context information
 */
export function context<T = ErrorContext>(
  enew: Error,
  context: T
): ContextError<T> {
  (<___Writable<ContextError<T>>>enew).context = context;
  return <ContextError<T>>enew;
}
