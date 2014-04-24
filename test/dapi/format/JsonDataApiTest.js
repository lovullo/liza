/**
 * Test case for JSON formatting of API result
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

var dapi    = require( '../../../' ).dapi,
    expect  = require( 'chai' ).expect,
    Class   = require( 'easejs' ).Class,
    DataApi = dapi.DataApi,
    Sut     = dapi.format.JsonDataApi;


describe( 'JsonDataApi', function()
{
    it( 'errors if not provided a DataApi', function()
    {
        expect( function()
        {
            Sut( {} );
        } ).to.throw( TypeError, 'DataApi' );
    } );


    it( 'accepts a DataApi', function()
    {
        expect( function()
        {
            Sut( _createStubDapi( null, '' ) );
        } ).to.not.throw( TypeError );
    } );


    describe( '.request', function()
    {
        it( 'passes data to encapsulated DataApi', function()
        {
            var stubs    = _createStubDapi( null, '0' ),
                expected = {};

            Sut( stubs ).request( expected, function() {} );
            expect( stubs.given ).to.equal( expected );
        } );


        it( 'converts response to JSON', function( done )
        {
            var raw = '{"foo": "bar"}';
            Sut( _createStubDapi( null, raw ) ).request( '', function( err, data )
            {
                // should have been converted to JSON
                expect( data ).to.deep.equal( { foo: 'bar' } );
                expect( err ).to.equal( null );
                done();
            } );
        } );


        it( 'returns error if JSON parsing fails', function( done )
        {
            Sut( _createStubDapi( null, 'ERR' ) )
                .request( '', function( err, data )
                {
                    expect( err ).to.be.instanceOf( Error );
                    expect( data ).to.equal( null );
                    done();
                } );
        } );


        it( 'proxy error from encapsulated DataApi', function( done )
        {
            var e = Error( 'foo' );

            Sut( _createStubDapi( e, '0' ) )
                .request( '', function( err, data )
                {
                    // data should also be cleared out
                    expect( err ).to.equal( e );
                    expect( data ).to.equal( null );
                    done();
                } );
        } );
    } );
} );


function _createStubDapi( err, resp )
{
    return Class.implement( DataApi ).extend(
    {
        given: null,

        request: function( data, callback )
        {
            this.given = data;
            callback( err, resp );
        }
    } )();
}

