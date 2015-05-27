/**
 * Test case for JSON formatting of API result
 *
 *  Copyright (C) 2014, 2015 LoVullo Associates, Inc.
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
    Sut     = dapi.format.JsonResponse;


describe( 'dapi.format.JsonRepsonse trait', function()
{
    describe( '.request', function()
    {
        it( 'passes data to encapsulated DataApi', function()
        {
            var stubs    = _createStubbedDapi( null, '0' ),
                expected = {};

            stubs.request( expected, function() {} );
            expect( stubs.given ).to.equal( expected );
        } );


        it( 'converts response to JSON', function( done )
        {
            var raw = '{"foo": "bar"}';

            _createStubbedDapi( null, raw )
                .request( '', function( err, data )
                {
                    // should have been converted to JSON
                    expect( data ).to.deep.equal( { foo: 'bar' } );
                    expect( err ).to.equal( null );
                    done();
                } );
        } );


        it( 'returns error if JSON parsing fails', function( done )
        {
            _createStubbedDapi( null, 'ERR' )
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

            _createStubbedDapi( e, '0' )
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


function _createStubbedDapi( err, resp )
{
    return Class.implement( DataApi ).extend(
    {
        given: null,

        'virtual public request': function( data, callback )
        {
            this.given = data;
            callback( err, resp );
        }
    } ).use( Sut )();
}

