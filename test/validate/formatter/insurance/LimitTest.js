/**
 * Tests insurance limit formatter
 *
 *  Copyright (C) 2016 LoVullo Associates, Inc.
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
    liza               = require( '../../../../' ),
    Sut                = liza.validate.formatter.insurance.Limit,
    EchoFormatter      = liza.validate.formatter.EchoFormatter,
    ValidatorFormatter = liza.validate.ValidatorFormatter,
    common             = require( '../common' ),
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


describe( 'validate.formatter.insurance.Limit', function()
{
    common.testValidate( DummyFormatter.use( Sut )(), {
        // plain strings are ignored (and do not invoke supertype)
        "":     [ ""     ],
        "abc":  [ "abc"  ],
        "abc_": [ "abc_" ],
        "_ -":  [ "_ -"  ],

        // numbers >3 digits echoed
        "1234":   [ "+1234",     "-+1234"    ],
        "123456": [ "+123456",   "-+123456"  ],
    } );


    // 3-digit abbreviations are converted *on retrieval* (we'll often
    // be styling existing data, so we don't want to rely on prior
    // conversion)
    common.testValidate( EchoFormatter.use( Sut )(), {
        "100": [ "100", "100000" ],
        "500": [ "500", "500000" ],
    } );
} );
