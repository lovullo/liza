/**
 * A delta
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
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/** The data structure expected for a document's internal key/value store */
export type Kv<T = any> = Record<string, T[]>;

/** Possible delta values for Kv array indexes */
export type DeltaDatum<T> = T | null | undefined;


/**
 * The constructor type for a delta generating function
 *
 * @param src  - the source data set
 * @param dest - the destination data set
 *
 * @return the delta which transforms src to dest
 */
export type DeltaConstructor<T = any, U extends Kv<T> = Kv<T>, V extends Kv<T> = U> = (
    src:  U,
    dest: V,
) => DeltaResult<U & V>;


/** Transform type T to hold possible delta values */
export type DeltaResult<T> = { [K in keyof T]: DeltaDatum<T[K]> | null };


 /**
 * Create delta to transform from src into dest
 *
 * @param src  - the source data set
 * @param dest - the destination data set
 *
 * @return the delta
 */
export function createDelta<T, U extends Kv<T>, V extends Kv<T>>(
    src:  U,
    dest: V,
): DeltaResult<U & V>
{
    const delta: DeltaResult<any> = {};

    // Loop through all keys
    const key_set = new Set(
        Object.keys( src ).concat( Object.keys( dest ) ) );

    key_set.forEach( key =>
    {
        const src_data  = src[ key ];
        const dest_data = dest[ key ];

        // If source does not contain the key, use entire dest data
        if ( !src_data || !src_data.length )
        {
            delta[ key ] = dest_data;

            return;
        }

        // If the key no longer exists in dest then nullify this key
        if ( !dest_data || !dest_data.length )
        {
            delta[ key ] = null;

            return;
        }

        // If neither condition above is true then create the key iteratively
        const delta_key = _createDeltaKey( src_data, dest_data );

        if ( delta_key.changed )
        {
            delta[ key ] = delta_key.data;
        }
    } );

    return <DeltaResult<U & V>>delta;
}


/**
 * Build the delta key iteratively
 *
 * @param src  - the source data array
 * @param dest - the destination data array
 *
 * @return an object with an identical flag and a data array
 */
function _createDeltaKey<T>(
    src:  T[],
    dest: T[],
): { changed: boolean, data: DeltaDatum<T>[] }
{
    const data     = [];
    const max_size = Math.max( dest.length, src.length );

    let changed: boolean = false;

    for ( let i = 0; i < max_size; i++ )
    {
        const dest_datum = dest[ i ];
        const src_datum  = src[ i ];

        // terminate the key if we don't have a dest value
        if ( dest_datum === undefined )
        {
            changed   = true;
            data[ i ] = null;

            break;
        }
        else if ( _deepEqual( dest_datum, src_datum ) )
        {
            data[ i ] = undefined;
        }
        else
        {
            changed   = true;
            data[ i ] = dest_datum;
        }
    }

    return {
        changed: changed,
        data:    data,
    };
}


/**
 * Compare two arrays by index
 *
 * @param a - the first array to compare
 * @param b - the second array to compare
 */
function _deepEqual( a: any, b: any ): boolean
{
    if ( Array.isArray( a ) )
    {
        if ( !Array.isArray( b ) || ( a.length !== b.length ) )
        {
            return false;
        }

        return a.every( ( item, i ) => _deepEqual( item, b[ i ] ) );
    }

    return a === b;
}