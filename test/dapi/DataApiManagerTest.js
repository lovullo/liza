/**
 * Test of DataApi
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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
 *
 * @todo This needs tests for the rest of StagingBucket
 */

"use strict";

const root   = require( '../../' );
const expect = require( 'chai' ).expect;
const Sut    = root.dapi.DataApiManager;


describe( 'DataApiManager', () =>
{
    it( 'emits fieldLoaded event once request is complete', done =>
    {
        const dapi = createStubDapi();
        const type = 'loaded-test';
        const name = 'foo';

        // this is intentionally a string to test casting; see below
        const index = "2";

        const fail = e => { throw( e ) };

        Sut( createStubDapiFactory( { [type]: dapi } ) )
            .on( 'fieldLoaded', ( given_name, given_index ) =>
            {
                expect( given_name ).to.equal( name );

                // should cast index to number
                expect( given_index ).to.equal( +index );

                done();
            } )
            .setApis( { [type]: { type: type } } )
            .getApiData( type, {}, ()=>{}, name, index, {}, fail );
    } );
} );


function createStubDapi()
{
    return {
        request( _, callback )
        {
            callback();
        },

        on() {
            return this;
        },
    };
}


function createStubDapiFactory( dapis )
{
    return {
        fromType( type )
        {
            return dapis[ type ];
        },
    };
}
