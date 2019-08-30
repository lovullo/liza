/**
 * Test case for ValueSetEventHandler
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

"use strict";

const event  = require( '../../' ).client.event;
const expect = require( 'chai' ).expect;
const Class  = require( 'easejs' ).Class;

const { ValueSetEventHandler: Sut } = event;


describe( 'ValueSetEventHandler', () =>
{
    it( "sets relative indexes up until last source index", done =>
    {
        const expected = {
            foo: [ "zero", "one", "one" ],
        };

        let   qcalled = false;
        const quote   = {
            setData( data )
            {
                expect( data ).to.deep.equal( expected );
                qcalled = true;
            }
        };

        const callback = () =>
        {
            expect( qcalled ).to.be.true;
            done();
        };

        Sut( { getQuote: () => quote } )
            .handle(
                '',
                callback,
                {
                    elementName: 'foo',
                    indexes:     [ 0, 1, 2 ],
                    value:       [ "zero", "one" ],
                }
            );
    } );


    it( "sets only given indexes", done =>
    {
        const expected = {
            bar: [ , "set1", "set2" ],
        };

        let   qcalled = false;
        const quote   = {
            setData( data )
            {
                expect( data ).to.deep.equal( expected );
                qcalled = true;
            }
        };

        const callback = () =>
        {
            expect( qcalled ).to.be.true;
            done();
        };

        Sut( { getQuote: () => quote } )
            .handle(
                '',
                callback,
                {
                    elementName: 'bar',
                    indexes:     [ 1, 2 ],
                    value:       [ "ignore", "set1", "set2", "extra" ],
                }
            );
    } );
} );
