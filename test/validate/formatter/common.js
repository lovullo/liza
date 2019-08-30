/**
 * Common validator-formatter test functions
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

var liza   = require( '../../../' ),
    VFmt   = liza.validate.ValidatorFormatter,
    Class  = require( 'easejs' ).Class,
    expect = require( 'chai' ).expect;


module.exports = {
    testValidate: function( sut, tests )
    {
        it( 'is a ValidatorFormatter', function()
        {
            expect( Class.isA( VFmt, sut ) )
                .to.equal( true, 'Is not a ValidatorFormatter' );
        } );


        Object.keys( tests ).forEach( function( data )
        {
            var failure  = false,
                err      = function() { failure = true; },
                result   = '',
                fmt      = '',
                expected = tests[ data ];

            try
            {
                result = sut.parse( data );
            }
            catch ( e )
            {
                failure = true;
            }

            if ( expected === false )
            {
                it( 'fails on ' + data, function()
                {
                    expect( failure ).to.equal(
                        true,
                        ( data + " should yield error" )
                    );
                } );

                return;
            }

            fmt = sut.retrieve( result );

            var expval = ( ( expected[ 0 ] === true ) ? data : expected[ 0 ] ),
                retval = ( ( expected[ 1 ] === true )
                    ? data
                    : ( expected[ 1 ] === undefined ) ? data : expected[ 1 ]
                );

            // convert to store in bucket
            it ( 'parses "' + data + '" as "' + expval + '"', function()
            {
                expect( result ).to.equal(
                    expval,
                    ( data + " !-> " + expval + ' (=>' + result + ')' )
                );
            } );

            // retrieve value, formatted
            it ( 'retrieves "' + result + '" as "' + retval + '"', function()
            {
                expect( fmt ).to.equal(
                    retval,
                    ( result + " !~> " + retval + ' (=>' + fmt + ')' )
                );
            } );
        } );
    },


    /**
     * Test that mixin respects supertype data
     *
     * @param {Function} Super    supertype constructor to extend
     * @param {Trait}    Sut      SUT trait
     * @param {string}   base     string to serve as base to data
     * @param {string}   given    given data to pass to extended Super
     * @param {string}   parse    expected #parse result
     * @param {string}   retrieve expected #retrieve result
     *
     * @return {undefined}
     */
    testMixin: function( Super, Sut, base, given, parse, retrieve )
    {
        describe( 'as a mixin', function()
        {
            var sut = Super.extend(
            {
                'virtual override parse': function( data )
                {
                    return base + data;
                },
                'virtual override retrieve': function( data )
                {
                    return base + data;
                }
            } ).use( Sut )();


            it( 'respects supertype #parse', function()
            {
                expect( sut.parse( given ) )
                    .to.equal( parse );
            } );


            it( 'respects supertype #retrieve', function()
            {
                expect( sut.retrieve( given ) )
                    .to.equal( retrieve );
            } );
        } );
    },
};
