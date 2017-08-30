/**
 * Tests ProgramInit
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

'use strict';

const chai                 = require( 'chai' );
const expect               = chai.expect;
const { ProgramInit: Sut } = require( '../../' ).program;

chai.use( require( 'chai-as-promised' ) );


describe( 'ProgramInit', () =>
{
    [
        {
            label:    "initializes defaults",
            defaults: { a: "one", b: "two" },
            doc_data: {},
            expected: {
                a: [ "one" ],
                b: [ "two" ],
            },
        },
        {
            label:    "does nothing with no data or defaults",
            defaults: {},
            doc_data: {},
            expected: {},
        },
        {
            label:    "produces empty object given undefined data",
            defaults: {},
            doc_data: undefined,
            expected: {},
        },
        {
            label:    "keeps existing data with defaults",
            defaults: { foo: "init" },
            doc_data: { bar: [ "baz" ] },
            expected: {
                foo: [ "init" ],
                bar: [ "baz" ],
            },
        },
        {
            label:    "keeps existing doc data with no defaults",
            defaults: {},
            doc_data: { foo: [ "bar" ] },
            expected: {
                foo: [ "bar" ],
            },
        },
        {
            label:    "does not overwrite existing data with defaults",
            defaults: { foo: "init" },
            doc_data: { foo: [ "bar" ] },
            expected: {
                foo: [ "bar" ],
            },
        },
    ].forEach( ({ label, doc_data, id, defaults, expected }) =>
    {
        it( label, () =>
        {
            const sut = Sut( null );

            const program = {
                id:       "foo",
                defaults: defaults,
            };

            return expect( sut.init( program, doc_data ) )
                .to.eventually.deep.equal( expected );
        } );
    } );
} );
