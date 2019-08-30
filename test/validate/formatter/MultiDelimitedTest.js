/**
 * Tests delimited formatting
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


var Class              = require( 'easejs' ).Class,
    liza               = require( '../../../' ),
    formatter          = liza.validate.formatter,
    Sut                = formatter.MultiDelimited,
    EchoFormatter      = formatter.EchoFormatter,
    ValidatorFormatter = liza.validate.ValidatorFormatter,
    common             = require( './common' ),
    expect             = require( 'chai' ).expect;

var DummyFormatter = Class.implement( ValidatorFormatter )
    .extend(
{
    'virtual parse': function( data )
    {
        return '+' + data;
    },

    'virtual retrieve': function( data )
    {
        return '-' + data;
    },
} );


describe( 'validate.formatter.MultiDelimited', function()
{
    var sut = DummyFormatter.use( Sut( ',', '|' ) )();

    common.testValidate( sut, {
        "":           [ "+",             "-+"             ],
        "abc":        [ "+abc",          "-+abc"          ],
        "abc,123":    [ "+abc|+123",     "-+abc,-+123"    ],
        "  1122 ":    [ "+  1122 ",      "-+  1122 "      ],
        "  1122 ,34": [ "+  1122 |+34",  "-+  1122 ,-+34" ],
    } );


    // sane default behavior
    it( 'defaults retrieve delimeter to parse delimiter', function()
    {
        var sut = DummyFormatter.use( Sut( '!' ) )();

        expect( sut.parse( "abc!123" ) )
            .to.equal( "+abc!+123" );

        expect( sut.retrieve( "abc!123" ) )
            .to.equal( "-abc!-123" );
    } );
} );
