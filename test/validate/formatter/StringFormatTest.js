/**
 * @license
 * StringFormat formatter test
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
    expect        = require( 'chai' ).expect,
    Sut           = liza.validate.formatter.StringFormat,
    EchoFormatter = liza.validate.formatter.EchoFormatter,
    common        = require( './common' );


describe( 'validate.formatter.StringFormat', function()
{
    common.testValidate( EchoFormatter.use( Sut( 'PRE%sPOST' ) )(), {
        // basic prefix/suffix
        "":           [ "",    "PREPOST" ],
        "foo":        [ "foo", "PREfooPOST" ],
        "PREfoo":     [ "foo", "PREfooPOST" ],
        "barPOST":    [ "bar", "PREbarPOST" ],
        "PREbazPOST": [ "baz", "PREbazPOST" ],

        // only prefix/suffix
        "PRE":     [ "", "PREPOST" ],
        "POST":    [ "", "PREPOST" ],
        "PREPOST": [ "", "PREPOST" ],

        // repeated prefix/suffix normalization
        "PREPREfoo":             [ "foo", "PREfooPOST" ],
        "barPOSTPOST":           [ "bar", "PREbarPOST" ],
        "PREPREbazPOSTPOSTPOST": [ "baz", "PREbazPOST" ],
        "PREPREPOSTPOST":        [ "",    "PREPOST"   ],

        // convoluted interpretations
        "PREfooPOSTPRE":    [ "fooPOSTPRE", "PREfooPOSTPREPOST"   ],
        "PREmooPREfooPOST": [ "mooPREfoo",  "PREmooPREfooPOST" ],
        "mooPREfoo":        [ "mooPREfoo",  "PREmooPREfooPOST" ],
    } );


    // only prefix format
    common.testValidate( EchoFormatter.use( Sut( 'BEG%s' ) )(), {
        "foo":    [ "foo", "BEGfoo" ],
        "BEGfoo": [ "foo", "BEGfoo" ],
    } );


    // only suffix format
    common.testValidate( EchoFormatter.use( Sut( '%sEND' ) )(), {
        "fooEND": [ "foo", "fooEND" ],
        "fooEND": [ "foo", "fooEND" ],
    } );


    // no prefix or suffix
    common.testValidate( EchoFormatter.use( Sut( '%s' ) )(), {
        "foo": [ "foo", "foo" ],
    } );


    describe( 'given multiple %s', function()
    {
        it( 'throws an error', function()
        {
            expect( function()
            {
                EchoFormatter.use( Sut( 'foo%sbar%sbaz' ) )();
            } ).to.throw( Error );
        } );
    } );


    describe( 'given no %s', function()
    {
        it( 'throws an error', function()
        {
            expect( function()
            {
                EchoFormatter.use( Sut( '' ) )();
            } ).to.throw( Error );

            expect( function()
            {
                EchoFormatter.use( Sut( 'Foo' ) )();
            } ).to.throw( Error );
        } );
    } );


    common.testMixin(
        EchoFormatter,
        Sut( 'PRE%sPOST' ),
        'base',
        'PREfooPOST',
        'basefoo',
        'PREbasePREfooPOSTPOST'
    );
} );
