/**
 * Accept/reject formatter test
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

var liza               = require( '../../../' ),
    Class              = require( 'easejs' ).Class,
    Sut                = liza.validate.formatter.AcceptReject,
    EchoFormatter      = liza.validate.formatter.EchoFormatter,
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


describe( 'validate.formatter.Number', function()
{
    common.testValidate( EchoFormatter.use( Sut )(), {
        "":         [ ''              ],
        "0":        [ "0", "Rejected" ],
        "1":        [ "1", "Accepted" ],
        "Rejected": [ "0", "Rejected" ],
        "Accepted": [ "1", "Accepted" ],

        // arbitrary text left alone
        "foo": [ "foo" ],
    } );


    describe( '#parse', function()
    {
        it( 'considers accept/reject before supertype formatting', function()
        {
            // will equal +Accepted if supertype is called first
            expect( DummyFormatter.use( Sut )().parse( 'Accepted' ) )
                .to.equal( '1' );

            // will equal +1 if supertype is called first
            expect( DummyFormatter.use( Sut )().parse( '1' ) )
                .to.equal( '1' );
        } );
    } );


    describe( '#retrieve', function()
    {
        it( 'considers accept/reject before supertype formatting', function()
        {
            // will equal -1 if supertype is called first
            expect( DummyFormatter.use( Sut )().retrieve( '1' ) )
                .to.equal( 'Accepted' );
        } );
    } );


    common.testMixin(
        EchoFormatter,
        Sut,
        'asdf',
        'given',
        'asdfgiven',
        'asdfgiven'
    );
} );
