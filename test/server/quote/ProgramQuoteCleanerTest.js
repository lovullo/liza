/**
 * Tests ProgramQuoteCleaner
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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

'use strict';

const { expect } = require( 'chai' );
const Sut        = require( '../../../' ).server.quote.ProgramQuoteCleaner;


describe( 'ProgramQuoteCleaner', () =>
{
    describe( "metadata cleaning", () =>
    {
        [
            {
                label:    "populates all fields when empty",
                existing: {},
                fields:   { foo: {}, bar: {} },
                expected: { foo: [], bar: [] },
            },
            {
                label:    "populates only missing fields when non-empty",
                existing: { foo: [ 1 ], baz: [ 2 ] },
                fields:   { foo: {}, bar: {} },
                expected: { foo: [ 1 ], bar: [], baz: [ 2 ] },
            },
        ].forEach( ( { label, existing, fields, expected } ) =>
            it( label, done =>
            {
                const quote   = createStubQuote( existing );
                const program = createStubProgram( fields );

                Sut( program ).clean( quote, err =>
                {
                    expect( err ).to.equal( null );
                    expect( quote.getMetabucket().getData() )
                        .to.deep.equal( expected );

                    done();
                } );
            } )
        );
    } );
} );


function createStubQuote( metadata )
{
    return {
        getProgramId: () => 'foo',
        setData: () => {},
        getMetabucket: () => ( {
            getDataByName: name => metadata[ name ],
            getData: () => metadata,
            setValues: data =>
            {
                Object.keys( data ).forEach( field_name =>
                    metadata[ field_name ] = data[ field_name ]
                );
            },
        } ),
    };
}


function createStubProgram( meta_fields )
{
    return {
        getId: () => 'foo',
        meta: { fields: meta_fields },
    };
}
