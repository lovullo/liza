/**
 * Tests Data-API-based metadata population
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const expect = require( 'chai' ).expect;
const Sut    = require( '../../../' ).server.meta.DapiMetaSource;

describe( "DapiMetaSource", () =>
{
    it( "populates field with dapi response", () =>
    {
        const dapim      = createStubDapiManager();
        const field_name = 'field_foo';
        const index      = 1;

        const dapi = {
            name:    'dapi_name',
            value:   'foo',
            mapdest: { map: 'dest' },
        };

        // input data to dapi
        const given_data = {};

        // dapi output data (response)
        const ret_data = [ {} ];

        const bucket_result = {
            [dapi.name]: {
                [index]: ret_data[ 0 ][ dapi.value ],
            },
        };

        const metabucket = getStubBucket();

        // g prefix = "given"
        // all these show why we want to encapsulate this garbage
        dapim.getApiData = ( gapi, gdata, gcallback, gname, gindex ) =>
        {
            expect( gapi ).to.equal( dapi.name );
            expect( gdata ).to.equal( given_data );
            expect( gname ).to.equal( field_name );
            expect( gindex ).to.equal( index );

            // make sure we handle async
            process.nextTick( () => gcallback( null, ret_data ) );
        };

        dapim.setFieldData =
            ( gname, gindex, gdata, gvalue, glabel, gunchanged ) =>
        {
            expect( gname ).to.equal( dapi.name );
            expect( gindex ).to.equal( index );
            expect( gdata ).to.equal( ret_data );
            expect( gvalue ).to.equal( dapi.value );
            expect( glabel ).to.equal( '' );           // unused
            expect( gunchanged ).to.equal( false );
        };

        dapim.expandFieldData =
            ( gname, gindex, gbucket, gmap, gpredictive, gdiff ) =>
        {
            expect( gname ).to.equal( dapi.name );
            expect( gindex ).to.equal( index );
            expect( gbucket ).to.equal( metabucket );
            expect( gmap ).to.equal( dapi.mapdest );
            expect( gpredictive ).to.equal( true );
            expect( gdiff ).to.deep.equal( bucket_result );

            metabucket.getData = () => bucket_result;
        };

        return Sut( () => metabucket )
            .getFieldData( field_name, index, dapim, dapi, given_data )
            .then( result =>
            {
                expect( result.field ).to.equal( field_name );
                expect( result.index ).to.equal( index );
                expect( result.data ).to.equal( bucket_result );
            } );
    } );


    it( "rejects promise on error", () =>
    {
        const e     = Error( "Test error" );
        const dapim = createStubDapiManager();

        dapim.getApiData = ( _, __, ___, ____, _____, ______, failc ) =>
        {
            failc( e );
        };

        return expect(
            Sut( () => getStubBucket() )
                .getFieldData( 'name', 0, dapim, {}, {} )
        ).to.eventually.be.rejectedWith( e );
    } );


    it( "rejects if more than one result is returned from dapi", () =>
    {
        const dapim = createStubDapiManager();

        dapim.getApiData = ( _, __, callback ) =>
        {
            // more than one result
            callback( null, [ {}, {} ] );
        };

        return expect(
            Sut( () => getStubBucket() )
                .getFieldData( 'name', 0, dapim, {}, {} )
        ).to.eventually.be.rejectedWith( Error );
    } );
} );


function createStubDapiManager()
{
    return {
        getApiData() {},
        setFieldData() {},
        expandFieldData() {},
    };
}


function getStubBucket()
{
    return {
        setValues() {},
        getData() {},
    };
}


function createStubDb()
{
    return {
        saveQuoteMeta() {},
    };
}
