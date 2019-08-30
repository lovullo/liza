/**
 * Multi-dimensional array formatting test
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
    Sut                = formatter.MultiDimension,
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


describe( 'validate.formatter.MultiDimension', function()
{
    describe( '#parse', function()
    {
        it( 'splits on delimiter into vector', function()
        {
            expect(
                DummyFormatter.use( Sut( '||' ) )()
                    .parse( 'foo||bar||baz' )
            ).to.deep.equal( [ '+foo', '+bar', '+baz' ] );
        } );


        it( 'produces vector for non-delimited strings', function()
        {
            expect(
                DummyFormatter.use( Sut( '||' ) )()
                    .parse( 'foo' )
            ).to.deep.equal( [ '+foo' ] );
        } );
    } );


    describe( '#retrieve', function()
    {
        it( 'applies formatting to each element in vector', function()
        {
            expect(
                DummyFormatter.use( Sut( '||' ) )()
                    .retrieve( [ 'one', 'two', 'three' ] )
            ).to.equal( '-one||-two||-three' );
        } );


        it( 'treats scalars as single-element vectors', function()
        {
            expect(
                DummyFormatter.use( Sut( '||' ) )()
                    .retrieve( 'one' )
            ).to.equal( '-one' );
        } );


        describe( 'given identical elements', function()
        {
            it( 'combines if all elements are identical', function()
            {
                expect(
                    DummyFormatter.use( Sut( '||' ) )()
                        .retrieve( [ 'foo', 'foo', 'foo' ] )
                ).to.equal( '-foo' );
            } );


            it( 'does not combine if not all are identical', function()
            {
                expect(
                    DummyFormatter.use( Sut( '||' ) )()
                        .retrieve( [ 'foo', 'foo', 'bar' ] )
                ).to.equal( '-foo||-foo||-bar' );
            } );
        } );
    } );
} );
