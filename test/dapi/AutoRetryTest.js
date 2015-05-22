/**
 * Test case for AutoRetry
 *
 *  Copyright (C) 2015 LoVullo Associates, Inc.
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

var dapi    = require( '../../' ).dapi,
    expect  = require( 'chai' ).expect,
    Class   = require( 'easejs' ).Class,
    DataApi = dapi.DataApi,
    Sut     = dapi.AutoRetry;

var _void = function() {},
    _true = function() { return true; };


describe( 'dapi.AutoRetry trait', function()
{
    /**
     * If there are no failures, then AutoRetry has no observable effects.
     */
    describe( 'when the request is successful', function()
    {
        it( 'makes only one request', function( done )
        {
            var given = {};

            // success (but note the number of retries presented)
            var stub = _createStub( null, '' )
                .use( Sut( _void, 5 ) )
                ();

            stub.request( given, function()
            {
                expect( stub.given ).to.equal( given );
                expect( stub.requests ).to.equal( 1 );
                done();
            } );

        } );


        it( 'returns the response data with no error', function( done )
        {
            var chk = { foo: 'bar' };

            // notice that we provide an error to the stub; this will ensure
            // that the returned error is null even when one is provided
            var stub = _createStub( {}, chk )
                .use( Sut( _void, 1 ) )
                ();

            stub.request( '', function( err, data )
            {
                expect( err ).to.equal( null );
                expect( data ).to.equal( chk );
                done();
            } );
        } );
    } );


    /**
     * This is when we care.
     */
    describe( 'when the request fails', function()
    {
        it( 'will re-perform request N-1 times until failure', function( done )
        {
            var n = 5;

            var stub = _createStub( {}, {} )
                .use( Sut( _true, n ) )
                ();

            stub.request( {}, function( err, _ )
            {
                expect( stub.requests ).to.equal( n );
                done();
            } );
        } );


        it( 'will return most recent error and output data', function( done )
        {
            var e      = Error( 'foo' ),
                output = {};

            // XXX: this does not test for most recent, because the return
            // data are static for each request
            var stub = _createStub( e, output )
                .use( Sut( _true, 1 ) )
                ();

            stub.request( {}, function( err, data )
            {
                expect( err ).to.equal( e );
                expect( data ).to.equal( output );
                done();
            } );
        } );


        describe( 'given a negative number of tries', function()
        {
            it( 'will continue until a successful request', function( done )
            {
                var n = 10,
                    pred = function( _, __ )
                    {
                        return --n > 0;
                    };

                var stub = _createStub()
                    .use( Sut( pred, -1 ) )
                    ();

                stub.request( {}, function( _, __ )
                {
                    expect( n ).to.equal( 0 );
                    done();
                } );
            } );
        } );
    } );


    describe( 'when the number of tries is zero', function()
    {
        it( 'will perform zero requests with null results', function( done )
        {
            var stub = _createStub( {}, {} )
                .use( Sut( _void, 0 ) )
                ();

            stub.request( {}, function( err, data )
            {
                expect( stub.requests ).to.equal( 0 );
                expect( err ).to.equal( null );
                expect( data ).to.equal( null );
                done();
            } );
        } );
    } );


    describe( 'when a delay function is provided', function()
    {
        it( 'will wait for continuation before retry', function( done )
        {
            var waited = false;

            var wait = function( _, c )
            {
                waited = true;
                c();
            };

            var stub = _createStub( {}, {} )
                .use( Sut( _true, 2, wait ) )
                ();

            stub.request( {}, function( _, __ )
            {
                expect( waited ).to.equal( true );
                done();
            } );
        } );


        it( 'will not process if continuation is not called', function()
        {
            var waited = false;
            var wait = function( _, c )
            {
                waited = true;
                /* do not invoke */
            };

            var stub = _createStub( {}, {} )
                .use( Sut( _true, 2, wait ) )
                ();

            // this works because we know that our stub is invoked
            // synchronously
            stub.request( {}, function( _, __ )
            {
                throw Error( "Should not have been called!" );
            } );

            expect( waited ).to.equal( true );
        } );


        it( 'will call delay function until success', function()
        {
            var n = 5;
            var wait = function( tries_left, c )
            {
                n--;

                // the first argument is the number of tries left
                expect( tries_left ).to.equal( n );
                c();
            };

            var pred = function()
            {
                return n > 0;
            };

            var stub = _createStub( {}, {} )
                .use( Sut( pred, n, wait ) )
                ();

            // this works because we know that our stub is invoked
            // synchronously
            stub.request( {}, _void );

            // the first request counts as one, which brings us down to 4,
            // but the wait function has not been called at this point; so,
            // we expect that it will only be called four times
            expect( n ).to.equal( 1 );
        } );


        it( 'allows aborting via failure continuation', function( done )
        {
            var err_expect = {},
                out_expect = [];

            var wait = function( _, __, abort )
            {
                abort();
            };

            // without aborting, this would never finish
            var stub = _createStub( err_expect, out_expect )
                .use( Sut( _true, -1, wait ) )
                ();

            // this works because we know that our stub is invoked
            // synchronously
            stub.request( {}, function( err, output )
            {
                expect( err ).to.equal( err_expect );
                expect( output ).to.equal( out_expect );

                done();
            } );
        } );
    } );
} );



function _createStub( err, resp )
{
    return Class.implement( DataApi ).extend(
    {
        given:    null,
        requests: 0,

        'virtual public request': function( data, callback )
        {
            this.given = data;
            this.requests++;

            callback( err, resp );
        }
    } );
}
