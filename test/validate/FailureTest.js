/**
 * Test validation failure
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

var root   = require( '../../' ),
    Sut    = root.validate.Failure,
    expect = require( 'chai' ).expect;

var DummyField = require( 'easejs' ).Class
    .implement( root.field.Field )
    .extend(
{
    getName: function() {},
    getIndex: function() {},
} );


describe( 'Failure', function()
{
    it( 'throws error when not given Field for failure', function()
    {
        expect( function()
        {
            Sut( {} );
        } ).to.throw( TypeError );
    } );


    it( 'throws error when not given a Field for causes', function()
    {
        expect( function()
        {
            // not an array
            Sut( DummyField(), '', {} );
        } ).to.throw( TypeError );

        expect( function()
        {
            // one not a Field
            Sut( DummyField(), '', [ DummyField(), {} ] );
        } ).to.throw( TypeError );
    } );


    it( 'does not throw error for empty clause list', function()
    {
        expect( function()
        {
            Sut( DummyField(), '', [] );
        } ).to.not.throw( TypeError );
    } );


    describe( '#getField', function()
    {
        it( 'returns original field', function()
        {
            var field = DummyField();

            expect( Sut( field ).getField() )
                .to.equal( field );
        } );
    } );


    describe( '#getReason', function()
    {
        it( 'returns original failure reason', function()
        {
            var reason = 'solar flares';

            expect( Sut( DummyField(), reason ).getReason() )
                .to.equal( reason );
        } );


        it( 'returns empty string by default', function()
        {
            expect( Sut( DummyField() ).getReason() )
                .to.equal( '' );
        } );
    } );


    describe( '#getCauses', function()
    {
        it( 'returns original cause fields', function()
        {
            var causes = [ DummyField(), DummyField() ];

            expect( Sut( DummyField(), '', causes ).getCauses() )
                .to.equal( causes );
        } );


        // in other words: field caused itself to fail
        it( 'returns field by default', function()
        {
            var field = DummyField();

            expect( Sut( field ).getCauses() )
                .to.deep.equal( [ field ] );
        } );
    } );


    describe( 'when converted to a string', function()
    {
        it( 'produces failure reason', function()
        {
            var reason = 'bogons';

            expect( ''+Sut( DummyField(), reason ) )
                .to.equal( reason );
        } );
    } );
} );
