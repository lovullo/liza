/**
 * Number formatter test
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

var liza          = require( '../../../' ),
    Sut           = liza.validate.formatter.Number,
    EchoFormatter = liza.validate.formatter.EchoFormatter,
    common        = require( './common' );


describe( 'validate.formatter.Number', function()
{
    // default case, no decimal places
    common.testValidate( EchoFormatter.use( Sut )(), {
        "1":           [ "1",      "1"     ],
        "001":         [ "1",      "1"     ],
        "123":         [ "123",    "123"   ],
        "12345":       [ "12345", "12,345" ],
        "12,345":      [ "12345", "12,345" ],
        ",12,345":     [ "12345", "12,345" ],
        "12,345,":     [ "12345", "12,345" ],
        "  12,345  ,": [ "12345", "12,345" ],
        "  1,  ,":     [ "1",     "1"      ],

        // strip decimals
        "1.234":       [ "1",     "1"      ],
        "  1,  ,.":    [ "1",     "1"      ],

        // non-numbers
        "foo":    false,
        "123foo": false,
    } );


    // decimal places
    common.testValidate( EchoFormatter.use( Sut( 3 ) )(), {
        "1":           [ "1.000",   "1.000"   ],
        "001":         [ "1.000",   "1.000"   ],
        "123":         [ "123.000", "123.000" ],
        "123.1":       [ "123.100", "123.100" ],
        "0123.1":      [ "123.100", "123.100" ],
        "123.155":     [ "123.155", "123.155" ],
        "123.":        [ "123.000", "123.000" ],
        ".123":        [ "0.123",   "0.123"   ],

        // truncate, not round (leave that to another formatter)
        "123.1554":    [ "123.155", "123.155" ],
        "123.1556":    [ "123.155", "123.155" ],

        "12,345":      [ "12345.000", "12,345.000" ],
        "  1,  ,.":    [ "1.000",     "1.000"      ],

        // non-numbers
        "1.foo":      false,
        "123foo.012": false,
    } );


    // really long decimals should be unstyled
    common.testValidate( EchoFormatter.use( Sut( 10 ) )(), {
        "0.1234567890": [ true, true ],
    } );


    // negative scale strips trailing zeroes
    common.testValidate( EchoFormatter.use( Sut( -5 ) )(), {
        "1":          [ "1",         "1"         ],
        "01":         [ "1",         "1"         ],
        "1.0":        [ "1",         "1"         ],
        "1.0100":     [ "1.01",      "1.01"      ],
        "123.155":    [ "123.155",   "123.155"   ],
        "123.123456": [ "123.12345", "123.12345" ],
    } );


    common.testMixin(
        EchoFormatter,
        Sut,
        '123',
        '4567',
        '1234567',
        '1,234,567'
    );
} );
