/**
 * Test pattern-based validator-formatter
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

var liza   = require( '../../../' ),
    Sut    = liza.validate.formatter.PatternFormatter,
    VFmt   = liza.validate.ValidatorFormatter,
    Class  = require( 'easejs' ).Class,
    expect = require( 'chai' ).expect,
    assert = require( 'assert' ),
    dfn    = [
        /^kitten/,   '$&s',
        /^[a-z]+/,   'Foo',
        /^[0-9]([0-9]+)/, '$1',
    ];


describe( 'PatternFormatter', function()
{
    it( 'is a ValidatorFormatter', function()
    {
        expect( Class.isA( VFmt, createSut( [] ) ) )
            .to.be.true;
    } );


    describe( '#parse', function()
    {
        it( 'formats string according to given definition', function()
        {
            var sut = createSut( dfn );

            // this first test also ensures that the very first match
            // in dfn takes precedence
            [
                [ 'kitten', 'kittens' ],
                [ 'abcd',   'Foo' ],
                [ '0123',   '123' ],
            ].forEach( function( test )
            {
                assert.equal( sut.parse( test[ 0 ] ), test[ 1 ] );
            } );
        } );


        // validation error
        it( 'throws an exception if no match is found', function()
        {
            assert.throws( function()
            {
                // cannot possibly match anything
                createSut( [] ).parse( 'foo' );
            }, Error );
        } );


        /**
         * To support complex logic that may be difficult to express
         * (or not worth expressing due to verbosity required with JS's
         * regex impl.), we permit throwing an exception in a
         * replacement function to result in the equivalent of "no
         * match".
         */
        it( 'yields no match given exception during replacement', function()
        {
            var val = 'bar',
                sut = createSut( [
                    /^fo/,  function() { throw Error( 'ignore me' ); },
                    /^foo/, val,
                ] );

            assert.equal( val, sut.parse( 'foo' ),
                "Should ignore matches that throw exceptions"
            );
        } );
    } );


    describe( '#retrieve', function()
    {
        it( 'retrieval does not format data by default', function()
        {
            var str = 'foo';
            assert.equal( createSut( [] ).retrieve( str ), str );
        } );


        it( 'formats return data according to given definition', function()
        {
            // the dfn is technically not required, but for the sake
            // of a "proper" demonstration, it will be included
            var dfn    = [ [ /-/, '' ] ],
                retdfn = [ /[a-z]/g, '$&-' ];

            assert.equal(
                createSut( dfn, retdfn ).retrieve( 'foo' ),
                'f-o-o-'
            );
        } );
    } );
} );


function createSut( dfn, retdfn )
{
    return Sut( dfn, retdfn );
}
