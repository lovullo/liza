/**
 * Transitionary module for invalid bucket state
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
 *
 *  This file is part of liza.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * The purpose of this module is to serve as a single location in which to
 * aggregate logic regarding invalid field state, until a time where it can
 * be properly encapsulated.
 *
 * This must be accessible to both the server and the client, which at the
 * time of writing, have slightly different requirements with respect to
 * environment and availability of modules (e.g. fp-ts).
 */

/**
 * Prefix representing a universally invalid field
 *
 * This is the ASCII NACK character, which typically means that the provided
 * data was not accepted and needs to be resent.  In this case, it means
 * that the provided data is invalid and needs to be re-entered by the user
 * (or calling system).
 *
 * A control character was chosen because this will never be a valid
 * character entered by the user.  Further, it can be used to prefix an
 * invalid value so that the value entered by the user can be retained in
 * the bucket while at the same time being explicitly invalid.  (However,
 * note the comments in `INVALID_VALUE` below.)
 */
const INVALID_PREFIX = '\x15';

/**
 * Human-readable, printable value to mark invalid values
 *
 * The only character actually needed for invalid values is the leading NACK
 * (0x15), which states that the field's value is invalid and should be
 * changed.
 *
 * However, rather than maintaining whatever value is in the bucket, we
 * explicitly set the next bytes of the value to a string that is clearly
 * invalid.  The reason for this is that, at least at the time of writing,
 * there are a number of systems that read directly from the database, or
 * otherwise circumvent the system.  By providing a printable representation
 * of invalid state, we ensure that the field, if it makes its way into a
 * situation visible to the user (e.g. an insurance form!), indicates that
 * something isn't quite right.
 *
 * Once that situation is resolved, then ideally we'd only prefix the
 * existing value with NACK so that the original value is retained.
 *
 * You should not used this value directly; use the functions below to
 * construct and interpret these values.
 */
const INVALID_PRINTABLE_MARKER = '#!INVALID!#';

/**
 * Explicitly mark a value as invalid
 *
 * This will eventually be replaced with invalidateWithoutPrintable.
 */
export const invalidate = (value: string) =>
  INVALID_PREFIX + INVALID_PRINTABLE_MARKER + value;

/**
 * Explicitly mark a value as invalid without the printable marker
 *
 * DO NOT USE THIS YET!  See rational for `INVALID_PRINTABLE_MARKER`.
 */
export const invalidateWithoutPrintableMarker = (value: string) =>
  INVALID_PREFIX + value;

/** Whether the provided value is explicitly marked as invalid */
export const isInvalid = (value: unknown): value is string =>
  typeof value === 'string' ? value[0] === INVALID_PREFIX : false;

/**
 * Recover a value from a potentially invalid string
 *
 * If the provided value is not actually invalid, then the value will be
 * returned as-is.
 *
 * This accounts for the possibility that the long invalid prefix may no
 * longer be in use, and will work in either case (loosely---it doesn't
 * check only the beginning of the string).
 */
export const recoverValue = (maybe_invalid: string) =>
  isInvalid(maybe_invalid)
    ? maybe_invalid.slice(1).replace(INVALID_PRINTABLE_MARKER, '')
    : maybe_invalid;

/** Clear the provided value if it is invalid, otherwise return unchanged */
export const clearInvalid = (value: unknown) => (isInvalid(value) ? '' : value);
