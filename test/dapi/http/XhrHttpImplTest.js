/**
 * Test case for XMLHttpRequest HTTP protocol implementation
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

var dapi     = require( '../../../' ).dapi,
    expect   = require( 'chai' ).expect,
    Class    = require( 'easejs' ).Class,
    HttpImpl = dapi.http.HttpImpl,
    Sut      = dapi.http.XhrHttpImpl,

    DummyXhr = function()
    {
        this.open = function()
        {
            DummyXhr.args = arguments;
        };
    };


describe( 'XhrHttpImpl', function()
{
    /**
     * Since ECMAScript does not have return typing, we won't know if the ctor
     * actually returns an XMLHttpRequest until we try.
     */
    it( 'will accept any constructor', function()
    {
        expect( function()
        {
            Sut( function() {} );
        } ).to.not.throw( Error );
    } );


    it( 'is an HttpImpl', function()
    {
        var sut = Sut( function() {} );
        expect( Class.isA( HttpImpl, sut ) ).to.be.ok;
    } );


    describe( '.requestData', function()
    {
        it( 'requests a connection using the given url and method', function()
        {
            var url    = 'http://foonugget',
                method = 'GET',
                sut    = Sut( DummyXhr );

            sut.requestData( url, method, {}, function() {} );

            var args = DummyXhr.args;
            expect( args[ 0 ] ).to.equal( method );
            expect( args[ 1 ] ).to.equal( url );
            expect( args[ 1 ] ).to.be.ok;  // async
        } );


        /**
         * Since the request is asynchronous, we should be polite and not return
         * errors in two different formats; we will catch it and instead pass it
         * back via the callback.
         */
        it( 'returns XHR open() errors via callback', function( done )
        {
            var e   = Error( "Test error" ),
                Xhr = function()
                {
                    this.open = function()
                    {
                        throw e;
                    };
                };

            // should not throw an exception
            expect( function()
            {
                // should instead provide to callback
                Sut( Xhr )
                    .requestData( 'http://foo', 'GET', {}, function( err, data )
                    {
                        expect( err ).to.equal( e );
                        expect( data ).to.equal( null );
                        done();
                    } );
            } ).to.not.throw( Error );
        } );


        it( 'returns XHR response via callback when no error', function( done )
        {
            var retdata = "foobar",
                src     = "moocow",
                StubXhr = createStubXhr();

            StubXhr.prototype.responseText = retdata;
            StubXhr.prototype.readyState   = 4; // done
            StubXhr.prototype.status       = 200; // OK

            StubXhr.prototype.send = function( data )
            {
                expect( data ).is.equal( src );
                StubXhr.inst.onreadystatechange();
            };

            Sut( StubXhr )
                .requestData( 'http://bar', 'GET', src, function( err, resp )
                {
                    expect( err ).to.equal( null );
                    expect( resp ).to.equal( retdata );
                    done();
                } );

            // invoke callback
            StubXhr.inst.send( src );
        } );


        describe( 'if return status code is not successful', function()
        {
            /**
             * This is the default behavior, but can be changed by overriding
             * the onLoad method.
             */
            it( 'returns an error to the callback', function( done )
            {
                var StubXhr = createStubXhr();
                StubXhr.prototype.status = 404;

                Sut( StubXhr )
                    .requestData( 'http://foo', 'GET', '', function( err, _ )
                    {
                        expect( err ).to.be.instanceOf( Error );
                        expect( err.message ).to.contain(
                            StubXhr.prototype.status
                        );

                        done();
                    } );

                StubXhr.inst.send( '' );
            } );


            it( 'returns response text with error code', function( done )
            {
                var StubXhr = createStubXhr(),
                    status  = 404,
                    reply   = 'foobunny';

                StubXhr.prototype.status       = status;
                StubXhr.prototype.responseText = reply;

                Sut( StubXhr )
                    .requestData( 'http://foo', 'GET', '', function( _, resp )
                    {
                        expect( resp.status ).to.equal( status );
                        expect( resp.data ).to.equal( reply );
                        done();
                    } );

                StubXhr.inst.send( '' );
            } );
        } );


        it( 'allows overriding notion of success/failure', function( done )
        {
            var chk = 12345;

            // succeed on CHK
            var StubXhr = createStubXhr();
            StubXhr.prototype.status = chk;

            Sut.extend(
            {
                'override protected isSuccessful': function( status )
                {
                    return status === chk;
                },
            } )( StubXhr )
                .requestData( 'http://foo', 'GET', '', function( err, resp )
                {
                    expect( err ).to.equal( null );
                    done();
                } );

            StubXhr.inst.send( '' );
        } );


        it( 'returns self', function()
        {
            var sut = Sut( function() {} ),
                ret = sut.requestData(
                    'http://foo', 'GET', {}, function() {}
                );

            expect( ret ).to.equal( sut );
        } );
    } );
} );


function createStubXhr()
{
    var StubXhr = function()
    {
        StubXhr.inst = this;
    };

    StubXhr.prototype = {
        onreadystatechange: null,
        responseText: '',
        readyState: 4, // don,
        status: 200,   // O,

        open: function() {},
        send: function( data )
        {
            this.onreadystatechange();
        }
    };

    return StubXhr;
}

