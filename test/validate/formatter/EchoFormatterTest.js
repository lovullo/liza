/**
 * Tests echo list formatter
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
 */


var liza         = require( '../../../' ),
    Sut          = liza.validate.formatter.EchoFormatter,
    testValidate = require( './common' ).testValidate,
    expect       = require( 'chai' ).expect;


describe( 'EchoListFormatter', function()
{
    testValidate( Sut(), {
        "":          [ "" ],
        "foo":       [ "foo" ],
        "   123   ": [ "   123   " ],
    } );


    describe( 'as a supertype', function()
    {
        it( 'permits overriding #parse', function()
        {
            var expected = 'parsed';

            expect(
                Sut.extend(
                {
                    'override parse': function( _ ) { return expected; }
                } )().parse( 'foo' )
            ).to.equal( expected );
        } );


        it( 'permits overriding #retrieve', function()
        {
            var expected = 'retrieved';

            expect(
                Sut.extend(
                {
                    'override retrieve': function( _ ) { return expected; }
                } )().retrieve( 'foo' )
            ).to.equal( expected );
        } );
    } );
} );