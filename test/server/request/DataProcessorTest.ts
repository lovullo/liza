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
import { DataProcessor as Sut } from "../../../src/server/request/DataProcessor";

import { expect, use as chai_use } from 'chai';
import { DocumentId } from "../../../src/document/Document";
import { PositiveInteger } from "../../../src/numeric";
import { UserRequest } from "../../../src/server/request/UserRequest";
import { ServerSideQuote } from "../../../src/server/quote/ServerSideQuote";
import { QuoteDataBucket } from "../../../src/bucket/QuoteDataBucket";
import {DataApiResult} from "../../../src/dapi/DataApi";
import {ClassificationResult} from "../../../src/program/Program";
import { RateResult } from "../../../src/server/rater/Rater";

chai_use( require( 'chai-as-promised' ) );


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
    ].forEach( ( { label, internal, data, internals, expected } ) =>
    {
        const { request, program, sut, quote } =
              createSutFromStubs( internal, internals );

        const bucket = createStubBucket( data );

        it( label, () =>
        {
            expect(
                sut.processDiff( data, request, program, bucket, quote ).filtered
            ).to.deep.equal( expected );
        } );
    } );


    [
        {
            label: "Original data is saved to the delta, not new data",
            old_data: {
                foo: [ "bar_old", "baz" ],
            },
            new_data: {
                foo: [ "bar_new", "baz" ],
            },
            expected_data: {
                foo: [ "bar_old", "baz" ],
            },
        },
    ].forEach( ( { label, old_data, new_data, expected_data } ) =>
    {
        const {
            request,
            program,
            quote,
            filter,
            dapi_constructor,
            meta_source
        } = createStubs();

        const sut = new Sut(
            filter,
            dapi_constructor,
            meta_source,
            createStubStagingBucket
        );

        const bucket = createStubBucket( old_data );

        it( label, () =>
        {
            const actual = sut.processDiff(
                new_data,
                request,
                program,
                bucket,
                quote,
            );

            expect( actual.rdiff ).to.deep.equal( expected_data );
        } );
    } );


    it( "#processDiff.rdelta_data is undefined with empty staging diff", () =>
    {
        const {
            request,
            program,
            quote,
            filter,
            dapi_constructor,
            meta_source
        } = createStubs();

        const sut = new Sut(
            filter,
            dapi_constructor,
            meta_source,
            createStubStagingBucket
        );

        const data = {
            foo: [ "bar", "baz" ],
        };

        const diff = {};

        const bucket = createStubBucket( data );
        const actual = sut.processDiff( diff, request, program, bucket, quote );

        expect( actual.rdelta_data ).to.deep.equal( undefined );

    } );


    it( "passes data to bucket filter", () =>
    {
        const {
            request,
            program,
            meta_source,
            dapi_constructor,
            quote,
        } = createStubs();

        const data: { filtered?: boolean }      = {};
        const types                             = {};

        program.meta.qtypes = types;

        const filter = {
            filter(
                given_data:   Record<string, any>,
                given_types:  Record<string, any>,
                given_ignore: any,
                given_null:   boolean,
            ) {
                expect( given_data ).to.equal( data );
                expect( given_types ).to.equal( types );
                expect( given_null ).to.equal( true );

                // not used
                expect( given_ignore ).to.deep.equal( {} );

                data.filtered = true;

                return data;
            },

            filterValues(
                values:      string[],
                _filter:      string,
                _permit_null: boolean,
            ) {
                return values;
            }
        };

        const bucket = createStubBucket( data );

        new Sut(
            filter,
            dapi_constructor,
            meta_source,
            createStubStagingBucket,
        ).processDiff( data, request, program, bucket, quote );

        expect( data.filtered ).to.equal( true );
    } );


    it( "instantiates dapi manager using program and session", done =>
    {
        const { filter, request, program, meta_source, quote } = createStubs();

        let dapi_constructor = (
            given_apis:    any,
            given_request: UserRequest,
            _quote:        ServerSideQuote
        ) => {
            expect( given_apis ).to.equal( program.apis );
            expect( given_request ).to.equal( request );

            done();

            return createStubDataApiManager();
        };

        const bucket = createStubBucket( {} );

        new Sut(
            filter,
            dapi_constructor,
            meta_source,
            createStubStagingBucket
        ).processDiff( {}, request, program, bucket, quote );

    } );


    it( "invokes dapi manager when monitored bucket value changes", () =>
    {
        const triggered: { [key: string]: any[] } = {};

        // g prefix = "given"
        const meta_source = {
            getFieldData(
                _gfield: any,
                gindex:  PositiveInteger,
                _gdapim: any,
                gdapi:   { name: string },
                _gdata:  any,
            )
            {
                triggered[ gdapi.name ]           = triggered[ gdapi.name ] || [];
                triggered[ gdapi.name ][ gindex ] = arguments;

                return Promise.resolve( true );
            }
        }

        const dapi_manager = createStubDataApiManager();

        const {
            request,
            program,
            filter,
            quote,
        } = createStubs( false );

        const sut = new Sut(
            filter,
            () => dapi_manager,
            meta_source,
            createStubStagingBucket,
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
            src:  [ 'foo', 'bar' ],  // change
            src1: [ 'foo' ],         // change
            src2: [ 'baz' ],         // do not change
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
            data, request, program, bucket, quote
        );

        const expected: { [key: string]: any[] } = {
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
        const triggered: { [key: string]: any[] }= {};

        // g prefix = "given"
        const meta_source = {
            getFieldData(
                _gfield: any,
                gindex:  any,
                _gdapim: any,
                gdapi:   any,
                gdata:   any,
            )
            {
                triggered[ gdapi.name ]           = triggered[ gdapi.name ] || [];
                triggered[ gdapi.name ][ gindex ] = arguments;

                expect( gdata ).to.deep.equal( { ina: '', inb: [] } );

                return Promise.resolve( true );
            }
        }

        const {
            request,
            program,
            filter,
            quote,
        } = createStubs( false );

        const sut = new Sut(
            filter,
            createStubDataApiManager,
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
            src1: [ 'foo' ], // change
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
            data, request, program, bucket, quote
        );

        return Promise.all( dapis );
    } );
} );


function createSutFromStubs(
    internal: boolean = false,
    internals: { internal: boolean } = { internal: false },
)
{
    const {
        request,
        program,
        filter,
        meta_source,
        dapi_constructor,
        quote
    } = createStubs(internal, internals);

    return {
        request:      request,
        program:      program,
        filter:       filter,
        meta_source:  meta_source,
        quote:        quote,

        sut: new Sut(
            filter,
            dapi_constructor,
            meta_source,
            createStubStagingBucket
        ),
    };
}


function createStubs(
    internal: boolean = false,
    internals: { internal: boolean } = { internal: false },
)
{
    return {
        request:          createStubUserRequest( internal ),
        program:          createStubProgram( internals ),
        filter:           createStubFilter(),
        dapi_constructor: createStubDataApiContructor(),
        meta_source:      createStubDapiMetaSource(),
        quote:            createStubQuote(),
    };
}


function createStubUserRequest( internal: boolean )
{
    return <UserRequest>{
        getSession: () => ( {
            isInternal: () => internal
        } )
    };
}


function createStubProgram( internals: { internal: boolean } )
{
    return {
        ineligibleLockCount: 0,
        internal:            internals,
        meta:                {
            arefs:  {},
            fields: {},
            groups: {},
            qdata:  {},
            qtypes: {},
        },
        mapis:               {},
        rateSteps:           [],
        cretain:             {},
        apis:                {},

        getId(){ return 'Foo'; },
        initQuote() {},
        dapi:                     () => <DataApiResult>{},
        getClassifierKnownFields: () => <ClassificationResult>{},
        classify:                 () => <ClassificationResult>{},
    };
}


function createStubFilter()
{
    return {
        filter(
            data:          Record<string, any>,
            _key_types:    Record<string, any>,
            _ignore_types: Record<string, boolean>,
            _permit_null:  boolean,
        ) {
            return data;
        },

        filterValues(
            values:      string[],
            _filter:      string,
            _permit_null: boolean,
        ) {
            return values;
        }
    }
}


function createStubDataApiContructor()
{
    return (
        _apis:    any,
        _request: UserRequest,
        _quote:   ServerSideQuote
    ) => { return createStubDataApiManager(); };
}


function createStubDataApiManager()
{
    return {
        setApis( _apis: any ) { return this; },

        getApiData(
            _api:      string,
            _data:     any,
            _callback: any,
            _name:     string,
            _index:    PositiveInteger,
            _bucket:   any,
            _fc:       any,
        ){ return this; },

        getPendingApiCalls() { return {}; },

        fieldStale( _field: string, _index: PositiveInteger, _stale?: boolean )
        {
            return this;
        },

        fieldNotReady( _id: any, _i: PositiveInteger, _bucket: any )
        {
            return;
        },

        processFieldApiCalls() { return this; },

        setFieldData(
            _name:      string,
            _index:     PositiveInteger,
            _data:      Record<string,   any>,
            _value:     string,
            _label:     string,
            _unchanged: boolean,
        ) { return this; },

        triggerFieldUpdate(
            _name:      string,
            _index:     PositiveInteger,
            _value:     string,
            _label:     string,
            _unchanged: boolean,
        ) { return false; },

        hasFieldData( _name: string, _index: PositiveInteger ) { return true; },

        clearFieldData(
            _name:          string,
            _index:         PositiveInteger,
            _trigger_event: boolean,
        ) { return this; },

        clearPendingApiCall( _id: string ) { return this; },

        expandFieldData(
            _name:       string,
            _index:      PositiveInteger,
            _bucket:     any,
            _map:        any,
            _predictive: boolean,
            _diff:       any,
        ) { return this; },

        getDataExpansion(
            _name:       string,
            _index:      PositiveInteger,
            bucket:      any,
            _map:        any,
            _predictive: boolean,
            _diff:       any,
        ) { return bucket; },
    };
}


function createStubQuote()
{
    let quote_data: Record<string, any> = {};

    return <ServerSideQuote>{
        getRatedDate()
        {
            return <UnixTimestamp>1572292453;
        },

        setRatedDate( _timestamp: UnixTimestamp )
        {
            return this;
        },

        getProgram()
        {
            return createStubProgram( { internal: false } );
        },

        getProgramId()
        {
            return 'Bar';
        },

        getId()
        {
            return <DocumentId>123;
        },

        getCurrentStepId()
        {
            return 1;
        },

        setCurrentStepId( _step: number )
        {
            return this;
        },

        setExplicitLock( _reason: string, _step: number )
        {
            return this;
        },

        setLastPremiumDate( _timestamp: UnixTimestamp )
        {
            return this;
        },

        getLastPremiumDate()
        {
            return <UnixTimestamp>1572292453;
        },

        setRateBucket( _bucket: any )
        {
            return this;
        },

        setRatingData( data: Record<string, any> )
        {
            quote_data = data;

            return this;
        },

        getRatingData()
        {
            return <RateResult>quote_data;
        },

        getBucket()
        {
            return new QuoteDataBucket();
        },

        getMetabucket(){
            return new QuoteDataBucket();
        },

        getMetaUpdatedDate(){
            return <UnixTimestamp>123;
        },

        getProgramVersion(){
            return 'Foo';
        },

        getExplicitLockReason(){
            return 'Reason';
        },

        getExplicitLockStep()
        {
            return <PositiveInteger>1;
        },

        isImported()
        {
            return true;
        },

        isBound()
        {
            return true;
        },

        getTopVisitedStepId()
        {
            return <PositiveInteger>1;
        },

        setTopSavedStepId()
        {
            return this;
        },

        getTopSavedStepId()
        {
            return <PositiveInteger>1;
        },

        setRetryAttempts()
        {
            return this;
        },

        getRetryAttempts()
        {
            return 1;
        },

        retryAttempted()
        {
            return this;
        },

        setMetadata()
        {
            return this;
        },

        getRetryCount()
        {
            return 0;
        },

        setInitialRatedDate()
        {
            return this;
        },

        getExpirationDate()
        {
            return 123;
        },
    };
}


function createStubDapiMetaSource()
{
    return {
        getFieldData(
            _field:        string,
            _index:        PositiveInteger,
            _dapi_manager: any,
            _dapi:         any,
            _data:         Record<string,   any>,
        )
        {
            return new Promise<any>( () => {} );
        },
    };
}


function createStubBucket( data: Record<string, any> )
{
    return {
        data: data,

        getDataByName( name: string )
        {
            return data[ name ];
        },
    };
}


function createStubStagingBucket( bucket: any )
{
    let bucket_data = {};

    return {
        setCommittedValues( _data: Record<string, any> ) { return this; },

        forbidBypass() { return this; },

        setValues( values: Record<string, any> )
        {
            bucket_data = values; return this;
        },

        overwriteValues( _data: Record<string, any> ) { return this; },

        getDiff() { return bucket_data; },

        getFilledDiff() { return bucket.data || { foo: 'Bar' }; },

        revert( _evented?: boolean ) { return this; },

        commit( _store?: { old: Record<string, any> } ) { return this; },

        clear() { return this; },

        each( _callback: ( value: any, name: string ) => void )
        {
            return this;
        },

        getDataByName( name: string ) { return bucket.getDataByName( name ); },

        getOriginalDataByName( name: string )
        {
            return bucket.getDataByName( name );
        },

        getDataJson() { return 'Foo'; },

        getData() { return [ ( _Foo123: string ) => 'Bar']; },

        filter(
            _pred: ( name: string ) => boolean,
            _c: ( value: any, name: string ) => void
        )
        {
            return this;
        },

        hasIndex( _name: string, _i: PositiveInteger ) { return true; },

        isDirty() { return false; },
    };
}
