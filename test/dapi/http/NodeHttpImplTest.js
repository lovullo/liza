/**
 * Test HTTP using Node.js-compatible API
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

'use strict';

const { expect } = require( 'chai' );
const { Class }  = require( 'easejs' );

const {
    HttpImpl,
    NodeHttpImpl: Sut,
    HttpError,
} = require( '../../../' ).dapi.http;


describe( "NodeHttpImpl", () =>
{
    it( 'is an HttpImpl', function()
    {
        var sut = Sut( function() {} );
        expect( Class.isA( HttpImpl, sut ) ).to.be.ok;
    } );


    [
        {
            label: "uses http for plain HTTP requests",
            protocol: 'http:',
            method: 'GET',
        },
        {
            label: "uses http for plain HTTP requests",
            protocol: 'https:',
            method: 'GET',
        }
    ].forEach( ( { label, protocol,  method } ) =>
    {
        it( label, done =>
        {
            const url_result = {
                protocol: protocol,
                hostname: 'host',
                port:     8888,
                path:     'foo',
            };

            const url = _createMockUrl( given_url => url_result );

            const data              = {};
            const callback_expected = {};
            const callback          = () => callback_expected;

            const check = proto => ( opts, given_callback ) =>
            {
                expect( opts.protocol ).to.equal( proto );
                expect( opts.hostname ).to.equal( url_result.hostname );
                expect( opts.port ).to.equal( url_result.port );
                expect( opts.path ).to.equal( url_result.path );
                expect( opts.method ).to.equal( method );

                given_callback( _createMockResp() );

                done();
            };

            const http     = _createMockHttp( check( 'http:' ) );
            const https    = _createMockHttp( check( 'https:' ) );

            Sut( { http: http, https: https }, url )
                .requestData( '', method, data, callback );
        } );
    } );


    describe( "given an origin", () =>
    {
        it( "prepends to URL if URL begins with a slash", done =>
        {
            const origin = 'https://foo.com';
            const path   = '/quux/quuux';

            const url = _createMockUrl( given_url =>
            {
                expect( given_url ).to.equal( origin + path );
                done();
            } );

            const http = _createMockHttp( ( _, callback ) =>
            {
                callback( res );
                res.trigger( 'end' );
            } );

            Sut( { http: http }, url, origin )
                .requestData( path, 'GET', {}, () => {} );
        } );


        it( "does not prepend to URL that does not begin with a slash", done =>
        {
            const origin = 'https://bar.com';
            const path   = 'http://foo.com/quux/quuux';

            const url = _createMockUrl( given_url =>
            {
                expect( given_url ).to.equal( path );
                done();
            } );

            const http = _createMockHttp( ( _, callback ) =>
            {
                callback( res );
                res.trigger( 'end' );
            } );

            Sut( { http: http }, url, origin )
                .requestData( path, 'GET', {}, () => {} );
        } );
    } );


    it( "returns response when no error", done =>
    {
        const res    = _createMockResp();
        const chunks = [ 'a', 'b', 'c', 'd' ];

        const http = _createMockHttp( ( _, callback ) =>
        {
            callback( res );

            chunks.forEach( chunk => res.trigger( 'data', chunk ) );
            res.trigger( 'end' );
        } );

        Sut( { http: http }, _createMockUrl() )
            .requestData( "", 'GET', '', ( e, data ) =>
            {
                expect( e ).to.equal( null );
                expect( data ).to.equal( chunks.join( '' ) );

                done();
            } );
    } );


    it( "adds data to query string on GET", done =>
    {
        const given_path     = '/path';
        const expected_query = 'write data';

        const res = _createMockResp();
        const url = _createMockUrl( given_url => ( {
            protocol: 'http:',
            path:     given_path,
        } ) );

        const http = _createMockHttp( ( options, callback ) =>
        {
            expect( options.path )
                .to.equal( given_path + '?' + expected_query );

            callback( res );
            res.trigger( 'end' );
        } );

        Sut( { http: http }, url )
            .requestData( "", 'GET', expected_query, done );
    } );


    it( "writes form data on POST", done =>
    {
        const expected_data  = 'expected';
        const expected_write = 'write data';

        const res = _createMockResp();

        const http = _createMockHttp( ( options, callback ) =>
        {
            expect( http.req.written ).to.equal( expected_write );

            expect( options.headers[ 'Content-Type' ] )
                .to.equal( 'application/x-www-form-urlencoded' );

            callback( res );

            // make sure we're still handling the response as well
            res.trigger( 'data', expected_data );
            res.trigger( 'end' );
        } );

        Sut( { http: http }, _createMockUrl() )
            .requestData( "", 'POST', expected_write, ( e, data ) =>
            {
                expect( e ).to.equal( null );
                expect( data ).to.equal( expected_data );

                done();
            } );
    } );


    it( "returns error and response given non-200 status code", done =>
    {
        const res  = _createMockResp();
        const http = _createMockHttp( ( _, callback ) =>
        {
            callback( res )

            res.statusCode = 418;
            res.statusMessage = "I'm a teapot";

            res.trigger( 'end' );
        } );

        Sut( { http: http }, _createMockUrl() )
            .requestData( "", 'GET', '', ( e, data ) =>
            {
                expect( e ).to.be.instanceOf( HttpError );
                expect( e.message ).to.equal( res.statusMessage );
                expect( e.statuscode ).to.equal( res.statusCode );

                done();
            } );
    } );


    describe( "given a request error", () =>
    {
        it( "returns error with no response on request error", done =>
        {
            const error = Error( 'test error' );
            const http  = _createMockHttp( () => {} );

            Sut( { http: http }, _createMockUrl() )
                .requestData( "", 'GET', '', ( e, data ) =>
                {
                    expect( data ).to.equal( null );
                    expect( e ).to.equal( error );

                    done();
                } );

            // request will be hanging at this point since we didn't call
            // the callback, so we can fail the request
            http.req.trigger( 'error', error );
        } );

        // this should never happen in practice, but we want to defend
        // against it to make sure the callback is not invoked twice
        it( "will not complete request on end", () =>
        {
            let res = _createMockResp();

            const http = _createMockHttp( ( _, callback ) =>
            {
                // allow hooking `end'
                callback( res );
            } );

            Sut( { http: http }, _createMockUrl() )
                .requestData( "", 'GET', '', ( e, data ) =>
                {
                    // will fail on successful callback
                    expect( data ).to.equal( null );
                } );

            http.req.trigger( 'error', Error() );

            // do not invoke a second time (should do nothing)
            res.trigger( 'end' );
        } );
    } );


    describe( "protected API", () =>
    {
        it( "allows overriding request end behavior", done =>
        {
            const expected_data = "expected";
            const e             = Error( "test e" );
            const value         = "resp data";
            const res           = _createMockResp();

            const http = _createMockHttp( ( _, callback ) =>
            {
                callback( res );

                res.trigger( 'data', expected_data );
                res.trigger( 'end' );
            } );

            Sut.extend(
            {
                'override requestEnd'( given_res, data, callback )
                {
                    expect( given_res ).to.equal( res );
                    expect( data ).to.equal( expected_data );

                    callback( e, value );
                },
            } )( { http: http }, _createMockUrl() )
                .requestData( "", 'GET', '', ( given_e, given_data ) =>
                {
                    expect( given_e ).to.equal( e );
                    expect( given_data ).to.equal( value );

                    done();
                } );
        } );


        it( "allows overriding concept of success", done =>
        {
            const res = _createMockResp();

            const http = _createMockHttp( ( _, callback ) =>
            {
                callback( res );
                res.trigger( 'end' );
            } );

            // would normally be a failure
            res.statusCode = 500;

            Sut.extend(
            {
                'override isSuccessful': ( given_res ) => true,
            } )( { http: http }, _createMockUrl() )
                .requestData( "", 'GET', '', ( e ) =>
                {
                    expect( e ).to.equal( null );
                    done();
                } );
        } );


        it( "allows overriding error handling", done =>
        {
            const expected_e = Error( 'expected' );
            const error      = {};
            const value      = 'error data';

            const http = _createMockHttp( ( _, callback ) =>
            {
                callback( _createMockResp() );
            } );

            Sut.extend(
            {
                'override serveError'(
                    given_e, given_res, given_data, callback
                )
                {
                    expect( given_e ).to.equal( expected_e );
                    expect( given_res ).to.equal( null );
                    expect( given_data ).to.equal( null );

                    error.e = given_e;
                    callback( error, value );
                },
            } )( { http: http }, _createMockUrl() )
                .requestData( "", 'GET', '', ( e, given_value ) =>
                {
                    expect( e ).to.equal( error );
                    expect( e.e ).to.equal( expected_e );
                    expect( given_value ).to.equal( value );

                    done();
                } );

            // we're still hanging the request since we haven't called the
            // callback in http
            http.req.trigger( 'error', expected_e );
        } );
    } );
} );


const _createMockHttp = req_callback =>
{
    const events = {};

    return Object.create( {
        req: Object.create( {
            written: '',

            on( event, hook )
            {
                events[ event ] = hook;
            },

            trigger( event, data )
            {
                events[ event ]( data );
            },

            end()
            {
                // thunk defined by #request below
                events.onend();
            },

            write( data )
            {
                this.written = data;
            },
        } ),

        request( options, callback )
        {
            // not a real event; just for convenience
            events.onend = () => req_callback( options, callback );

            return this.req;
        },
    } );
};


const _createMockUrl = callback => ( {
    parse: callback || ( () => ( { protocol: 'http:' } ) ),
} );

const _createMockResp = () => Object.create( {
    event: {
        data() {},
        end() {},
    },

    statusCode: 200,

    on( ev, hook )
    {
        this.event[ ev ] = hook;
    },

    trigger( ev, data )
    {
        this.event[ ev ]( data );
    }
} );
