/**
 * Currency formatter test
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
    Sut           = liza.validate.formatter.Currency,
    EchoFormatter = liza.validate.formatter.EchoFormatter,
    common        = require( './common' );


describe( 'validate.formatter.Currency', function()
{
    common.testValidate( EchoFormatter.use( Sut )(), {
        // should format anything given to it, with or without prefix
        "1":            [ "1",     "$1"     ],
        "foo":          [ "foo",   "$foo"   ],
        "+":            [ "+",     "$+"     ],
        "$foo":         [ "foo",   "$foo"   ],

        // empty shouldn't format as anything
        "":             [ "",      ""       ],
        "$":            [ "",      ""       ],
        "$$":           [ "",      ""       ],

        // make sure these aren't considered to be empty
        "0":            [ "0",      "$0"    ],
        "$0":           [ "0",      "$0"    ],

        // be lax on input
        "$$foo":        [ "foo",   "$foo"   ],
        "$$$$$$$12.34": [ "12.34", "$12.34" ],
    } );


    common.testMixin(
        EchoFormatter,
        Sut,
        'foo',
        '123',
        'foo123',
        '$foo123'
    );
} );
