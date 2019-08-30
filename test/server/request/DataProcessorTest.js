/**
 * Manages DataAPI requests and return data
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

'use strict';

const { Class }  = require( 'easejs' );
const { expect } = require( 'chai' );
const Sut        = require( '../../../' ).server.request.DataProcessor;


describe( 'DataProcessor', () =>
{
    [
        {
            label: "strips internal field data when not internal",
            data: {
                internal: [ "foo", "bar" ],
                foo:      [ "bar", "baz" ],
            },
            internals: { internal: true },
            internal: false,
            expected: {
                foo: [ "bar", "baz" ],
            },
        },
        {
            label: "keeps internal field data when internal",
            data: {
                internal: [ "foo", "bar" ],
                foo:      [ "bar", "baz" ],
            },
            internals: { internal: true },
            internal: true,
            expected: {
                internal: [ "foo", "bar" ],
                foo:     [ "bar", "baz" ],
            },
        },
    ].forEach( ( { label, internal, data, internals = {}, expected } ) =>
    {
        const { request, program, sut } =
              createSutFromStubs( internal, internals );

        it( label, () =>
        {
            expect(
                sut.processDiff( data, request, program ).filtered
            ).to.deep.equal( expected );
        } );
    } );


    it( "passes data to bucket filter", () =>
    {
        const { request, program, meta_source } = createStubs();
        const data                              = {};
        const types                             = {};

        program.meta.qtypes = types;

        const filter = {
            filter( given_data, given_types, given_ignore, given_null )
            {
                expect( given_data ).to.equal( data );
                expect( given_types ).to.equal( types );
                expect( given_null ).to.equal( true );

                // not used
                expect( given_ignore ).to.deep.equal( {} );

                data.filtered = true;
            }
        };

        Sut( filter, () => {}, meta_source, createStubStagingBucket )
            .processDiff( data, request, program );

        expect( data.filtered ).to.equal( true );
    } );


    it( "instantiates dapi manager using program and session", done =>
    {
        const { filter, request, program } = createStubs();

        const dapi_factory = ( given_apis, given_request ) =>
        {
            expect( given_apis ).to.equal( program.apis );
            expect( given_request ).to.equal( request );

            done();
        };

        Sut( filter, dapi_factory, null, createStubStagingBucket )
            .processDiff( {}, request, program );
    } );


    it( "invokes dapi manager when monitored bucket value changes", () =>
    {
        const triggered = {};

        // g prefix = "given"
        const getFieldData = function( gfield, gindex, gdapim, gdapi, gdata)
        {
            triggered[ gdapi.name ]           = triggered[ gdapi.name ] || [];
            triggered[ gdapi.name ][ gindex ] = arguments;

            return Promise.resolve( true );
        };

        const dapi_manager = {};

        const {
            request,
            program,
            filter,
            meta_source,
        } = createStubs( false, {}, getFieldData );

        const sut = Sut(
            filter,
            () => dapi_manager,
            meta_source,
            createStubStagingBucket
        );

        program.meta.fields = {
            foo: {
                dapi: {
                    name:   'dapi_foo',
                    mapsrc: { ina: 'src', inb: 'src1' },
                },
            },
            bar: {
                dapi: {
                    name:   'dapi_bar',
                    mapsrc: { ina: 'src1' },
                },
            },
            baz: {
                dapi: {
                    name:  'dapi_no_call',
                    mapsrc: {},
                },
            },
        };

        program.mapis = {
            src:  [ 'foo',  'bar' ],  // change
            src1: [ 'foo' ],          // change
            src2: [ 'baz' ],          // do not change
        };

        // data changed
        const data = {
            src:  [ 'src0', 'src1' ],
            src1: [ undefined, 'src11' ],
        };

        const bucket = createStubBucket( {
            src:  [ 'bsrc0', 'bsrc1' ],
            src1: [ 'bsrc10', 'bsrc11' ],
        } );

        const { dapis, meta_clear } = sut.processDiff(
            data, request, program, bucket
        );

        const expected = {
            dapi_foo: [
                {
                    name: 'foo',
                    data: {
                        ina: data.src[ 0 ],
                        inb: bucket.data.src1[ 0 ],
                    },
                },
                {
                    name: 'foo',
                    data: {
                        ina: data.src[ 1 ],
                        inb: data.src1[ 1 ],
                    },
                },
            ],
            dapi_bar: [
                undefined,
                {
                    name: 'bar',
                    data: {
                        ina: data.src1[ 1 ],
                    },
                },
            ],
        };

        const expected_clear = {
            foo: [ "", "" ],
            bar: [ "", "" ],
        };

        for ( let dapi_name in expected )
        {
            let expected_call = expected[ dapi_name ];

            for ( let i in expected_call )
            {
                let chk = expected_call[ i ];

                if ( chk === undefined )
                {
                    continue;
                }

                let [ gfield, gindex, gdapi_manager, gdapi, gdata ] =
                    triggered[ dapi_name ][ i ];

                expect( gfield ).to.equal( chk.name );
                expect( gdapi.name ).to.equal( dapi_name );
                expect( +gindex ).to.equal( +i );
                expect( gdapi_manager ).to.equal( dapi_manager );

                // see mapsrc
                expect( gdata ).to.deep.equal( chk.data );
            }
        }

        expect( triggered.dapi_no_call ).to.equal( undefined );

        expect( meta_clear ).to.deep.equal( expected_clear );

        return Promise.all( dapis );
    } );


    it( "check _mapDapiData default values", () =>
    {
        const triggered = {};

        // g prefix = "given"
        const getFieldData = function( gfield, gindex, gdapim, gdapi, gdata)
        {
            triggered[ gdapi.name ]           = triggered[ gdapi.name ] || [];
            triggered[ gdapi.name ][ gindex ] = arguments;

            expect( gdata ).to.deep.equal( { ina: '', inb: [] } );

            return Promise.resolve( true );
        };

        const dapi_manager = {};

        const {
            request,
            program,
            filter,
            meta_source,
        } = createStubs( false, {}, getFieldData );

        const sut = Sut(
            filter,
            () => dapi_manager,
            meta_source,
            createStubStagingBucket
        );

        program.meta.fields = {
            foo: {
                dapi: {
                    name:   'dapi_foo',
                    mapsrc: { ina: 'src', inb: 'src1' },
                },
            },
        };

        program.mapis = {
            src1: [ 'foo' ],          // change
        };

        // data changed
        const data = {
            src:  [ 'src0', '' ],
            src1: [ undefined, '' ],
        };

        const bucket = createStubBucket( {
            src:  [ 'bsrc0', '' ],
            src1: [ 'bsrc10', undefined],
        } );

        const { dapis } = sut.processDiff(
            data, request, program, bucket
        );

        return Promise.all( dapis );
    } );
} );


function createSutFromStubs( /* see createStubs */ )
{
    const { request, program, filter, meta_source } =
          createStubs.apply( null, arguments );

    return {
        request:      request,
        program:      program,
        filter:       filter,
        meta_source:  meta_source,

        sut: Sut(
            filter,
            () => {},
            meta_source,
            createStubStagingBucket
        ),
    };
}


function createStubs( internal, internals, getFieldData )
{
    return {
        request:      createStubUserRequest( internal || false ),
        program:      createStubProgram( internals || {} ),
        filter:       { filter: _ => _ },
        meta_source:  createStubDapiMetaSource( getFieldData ),
    };
}


function createStubUserRequest( internal )
{
    return {
        getSession: () => ( {
            isInternal: () => internal
        } )
    };
}


function createStubProgram( internals )
{
    return {
        internal: internals,
        meta:     { qtypes: {}, fields: {} },
        apis:     {},

        initQuote() {},
    };
}


function createStubDapiMetaSource( getFieldData )
{
    return {
        getFieldData: getFieldData ||
            function( field, index, dapi_manager, dapi, data ){},
    };
}


function createStubBucket( data )
{
    return {
        data: data,

        getDataByName( name )
        {
            return data[ name ];
        },
    };
}


function createStubStagingBucket( bucket )
{
    let data = {};

    return {
        getDataByName( name )
        {
            return bucket.getDataByName( name );
        },

        setValues( values )
        {
            data = values;
        },

        forbidBypass() {},
        getDiff()
        {
            return data;
        },
        commit() {},
    };
}
