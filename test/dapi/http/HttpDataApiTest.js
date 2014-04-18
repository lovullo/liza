/**
 * Test case for data transmission over HTTP(S)
 *
 *  Copyright (C) 2014 LoVullo Associates, Inc.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

var dapi   = require( '../../../' ).dapi,
    expect = require( 'chai' ).expect,
    Class  = require( 'easejs' ).Class,
    Sut    = dapi.http.HttpDataApi,

    dummy_url  = 'http://foo',
    dummy_impl = Class
        .implement( dapi.http.HttpImpl )
        .extend( { requestData: function( _, __, ___, ____ ) {} } ),

    dummy_sut  = Sut( dummy_url, 'GET', dummy_impl );


describe( 'HttpDataApi', function()
{
    it( 'is a DataApi', function()
    {
        expect( Class.isA( dapi.DataApi, dummy_sut ) ).to.be.ok;
    } );


    it( 'permits RFC 2616 HTTP methods', function()
    {
        var m = [ 'GET', 'POST', 'PUT', 'HEAD', 'OPTIONS', 'DELETE', 'TRACE' ];

        m.forEach( function( method )
        {
            expect( function()
            {
                Sut( dummy_url, method, dummy_impl );
            } ).to.not.throw( Error );
        } );
    } );


    it( 'does not permit non-RFC-2616 HTTP methods', function()
    {
        expect( function()
        {
            Sut( dummy_url, 'FOO', dummy_impl );
        } ).to.throw( Error, 'FOO' );
    } );


    it( 'rejects non-HttpImpl objects', function()
    {
        expect( function()
        {
            Sut( dummy_url, 'GET', {} );
        } ).to.throw( TypeError, 'HttpImpl' );
    } );


    describe( '.request', function()
    {
        var impl = Class( 'StubHttpImpl' )
            .implement( dapi.http.HttpImpl )
            .extend(
        {
            provided: [],
            data:     "",
            err:      null,

            requestData: function( url, method, data, c )
            {
                this.provided = arguments;
                c( this.err, this.data );
            }
        } )();


        /**
         * The actual request is performed by some underling implementation.
         * This additional level of indirection allows the general concept of an
         * "HTTP Data API" to vary from an underyling HTTP protocol
         * implementation; they are separate concerns, although the distinction
         * may seem subtle.
         */
        it( 'delegates to provided HTTP implementation', function()
        {
            var method = 'POST',
                data   = {},
                c      = function() {};

            Sut( dummy_url, method, impl ).request( data, c );

            var provided = impl.provided;
            expect( provided[ 0 ] ).to.equal( dummy_url );
            expect( provided[ 1 ] ).to.equal( method );
            expect( provided[ 2 ] ).to.equal( data );
            expect( provided[ 3 ] ).to.equal( c );
        } );


        /**
         * Method chaining
         */
        it( 'returns self', function()
        {
            var sut = Sut( dummy_url, 'GET', impl ),
                ret = sut.request( "", function() {} );

            expect( ret ).to.equal( sut );
        } );


        /**
         * String requests are intended to be raw messages, whereas objects are
         * treated as key-value params.
         */
        it( 'accepts string and object data', function()
        {
            expect( function()
            {
                Sut( dummy_url, 'GET', impl )
                    .request( "", function() {} )   // string
                    .request( {}, function() {} );  // object
            } ).to.not.throw( Error );
        } );


        it( 'rejects all other data types', function()
        {
            var sut = Sut( dummy_url, 'GET', impl );

            [ 123, null, Infinity, undefined, NaN, function() {} ]
                .forEach( function( data )
                {
                    expect( function()
                    {
                        sut.request( data, function() {} );
                    } ).to.throw( TypeError );
                } );
        } );


        it( 'returns error provided by HTTP implementation', function( done )
        {
            impl.err = Error( "Test impl error" );
            Sut( dummy_url, 'GET', impl ).request( "", function( err, resp )
            {
                expect( err ).to.equal( impl.err );
                done();
            } );
        } );


        it( 'returns response provided by HTTP implementation', function( done )
        {
            impl.data = {};
            Sut( dummy_url, 'GET', impl ).request( "", function( err, resp )
            {
                expect( resp ).to.equal( impl.data );
                done();
            } );
        } );
    } );
} );
