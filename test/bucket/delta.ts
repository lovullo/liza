/**
 * Test the delta generated from two key/value stores
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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
 *
 */
import { createDelta as sut, Kv , DeltaResult} from "../../src/bucket/delta";

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );

interface SutTestCase<T>
{
    label:     string;
    src_data:  T;
    dest_data: T;
    expected:  DeltaResult<T>;
}

describe( 'Delta', () =>
{
    ( <SutTestCase<Kv<string>>[]>[
        {
            label:     "No changes are made, key is dropped",
            src_data:  { foo: [ 'bar', 'baz' ] },
            dest_data: { foo: [ 'bar', 'baz' ] },
            expected:  {},
        },
        {
            label:     "Only the unchanged key is dropped",
            src_data:  { foo: [ 'bar', 'baz' ], bar: [ 'qwe' ] },
            dest_data: { foo: [ 'bar', 'baz' ], bar: [ 'asd' ] },
            expected:  { bar: [ 'asd' ] },
        },
        {
            label:     "Changed values are updated by index with old value",
            src_data:  { foo: [ "bar", "baz", "quux" ] },
            dest_data: { foo: [ "bar", "quuux" ], moo: [ "cow" ]  },
            expected:  { foo: [ undefined, "quuux", null ], moo: [ "cow" ] },
        },
        {
            label:     "The keys are null when they don't exist in first set",
            src_data:  {},
            dest_data: { foo: [ "bar", "quuux" ], moo: [ "cow" ] },
            expected:  { foo: [ "bar", "quuux" ], moo: [ "cow" ] },
        },
        {
            label:     "Removed keys in new set show up",
            src_data:  { foo: [ "bar" ] },
            dest_data: {},
            expected:  { foo: null },
        },
        {
            label:     "Indexes after a null terminator aren't included",
            src_data:  { foo: [ "one", "two", "three", "four" ] },
            dest_data: { foo: [ "one", "done" ] },
            expected:  { foo: [ undefined, "done", null ] },
        },
        {
            label:     "Consider nested arrays to be scalar values",
            src_data:  { foo: [ [ "one" ], [ "two", "three" ] ] },
            dest_data: { foo: [ [ "one" ], [ "two" ] ] },
            expected:  { foo: [ undefined, [ "two" ] ] },
        },
        {
            label:     "Don't evaluate zeros as falsy",
            src_data:  { foo: [ 0 ] },
            dest_data: { foo: [ 0 ] },
            expected:  {},
        },
        {
            label:     "Don't evaluate empty strings as falsy",
            src_data:  { foo: [ '' ] },
            dest_data: { foo: [ '' ] },
            expected:  {},
        },
    ] ).forEach( ( { label, src_data, dest_data, expected } ) =>
    {
        it( label, () =>
        {
            expect( sut( src_data, dest_data ) ).to.deep.equal( expected );
        } );
    } );
} );
