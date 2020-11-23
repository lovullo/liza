/**
 * Miscellaneous types
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

/**
 * Define a nominal type
 *
 * Nominal types are types that are enforced by name.  Typescript implements
 * structural subtyping (duck typing), which means that two values with the
 * same structure are considered to be compatable.  This opens the
 * opportunity for certain classes of bugs: if we're expecting a Unix
 * timestamp, but we're given a user id, it'd be nice if we could catch that
 * at compile time.
 *
 * This uses a method the TS community calls "branding".  It is abstracted
 * behind a generic.  See example uses below.  I used the name `NominalType`
 * rather than `Brand` since searching for the former provides much better
 * literature on the topic, which will hopefully help in debugging when
 * errors are inevitable encountered.
 *
 * This also varies from other examples in the community in that the
 * tag is dynamic based on `T`; this allows for recursive covariant nominal
 * types, which works similarly to `extends`.
 *
 * Since nominal types are implemented as type definitions, they incur no
 * runtime cost (they do not exist at runtime).
 */
type NominalType<K, T extends string> = K & {__nominal__: {[P in T]: void}};

/** Unit of time in seconds */
type Seconds = NominalType<number, 'Seconds'>;

/**
 * Unix timestamp
 *
 * Number of seconds since the Unix epoch (1970-01-01 UTC).
 */
type UnixTimestamp = NominalType<Seconds, 'UnixTimestamp'>;

/** Unit of time in milliseconds */
type Milliseconds = NominalType<number, 'Milliseconds'>;

/** Unix timestamp represented in milliseconds */
type UnixTimestampMillis = NominalType<Milliseconds, 'UnixTimestampMillis'>;

/**
 * Oldschool NodeJS callback
 *
 * We should migrate to promises over time.  The purpose of this type is to
 * reduce the boilerplate of these function definitions, and to clearly
 * document that this pattern is something that used to be done frequently.
 */
type NodeCallback<T, R = void> = (e: NullableError, result: T | null) => R;

/** Nullable error */
type NullableError = Error | null;

/**
 * Common object
 *
 * Common objects are keyed with strings and can hold a value of any type.
 */
type CommonObject = Record<string, unknown>;
