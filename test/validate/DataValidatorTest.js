/**
 * Test data validator
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
 */

"use strict";

const root        = require( '../../' );
const validate    = root.validate;
const Sut         = validate.DataValidator;
const MemoryStore = root.store.MemoryStore;
const chai        = require( 'chai' );
const expect      = chai.expect;
const sinon       = require( 'sinon' );

const BucketDataValidator = validate.BucketDataValidator,
      ValidStateMonitor   = validate.ValidStateMonitor;

chai.use( require( 'chai-as-promised' ) );


describe( 'DataValidator', () =>
{
    describe( '#validate', () =>
    {
        it( 'validates against bucket validator', () =>
        {
            const bvalidator  = createMockBucketValidator(
                function( data, err, inplace )
                {
                    expect( data ).to.equal( diff );
                    expect( inplace ).to.be.true;

                    // since we're mocking #validate, the callback will not
                    // be called; we'll have to do so ourselves (eventually
                    // this will be a promise)
                    err( 'foo', expected_value, 1 );
                }
            );

            const vmonitor    = ValidStateMonitor();
            const dep_factory = createMockDependencyFactory();

            const getStore   = createStubStore();
            const { bstore } = getStore();

            const mock_bstore = sinon.mock( bstore );

            const mock_vmonitor    = sinon.mock( vmonitor );
            const mock_dep_factory = sinon.mock( dep_factory );

            const diff              = { foo: [ 'a', 'b', 'c' ] };
            const expected_failure  = {};
            const expected_value    = 'errmsg';
            const expected_failures = {
                foo: { 1: expected_failure }
            };

            // call to actual validator
            mock_vmonitor.expects( 'update' )
                .once()
                .withExactArgs( getStore().store, expected_failures )
                .returns( Promise.resolve( undefined ) );

            mock_dep_factory.expects( 'createFieldFailure' )
                .once()
                .withExactArgs( 'foo', 1, expected_value )
                .returns( expected_failure );

            // clears previous diffs
            mock_bstore.expects( 'clear' )
                .once()
                .returns( Promise.resolve( bstore ) );

            return Sut( bvalidator, vmonitor, dep_factory, getStore )
                .validate( diff )
                .then( () =>
                {
                    mock_vmonitor.verify();
                    mock_dep_factory.verify();

                    // cleared on call to err in above mock validator
                    return expect( getStore().bstore.get( 'foo' ) )
                        .to.eventually.deep.equal( [ 'a', undefined, 'c' ] );
                } );
        } );


        it( 'merges classification changes with diff', () =>
        {
            // SUT will only care about the indexes
            const classes = {
                first:  { indexes: [], is: false },
                second: { indexes: [ 0, 1 ], is: true },
            };

            const bvalidator  = createMockBucketValidator();
            const vmonitor    = ValidStateMonitor();
            const dep_factory = createMockDependencyFactory();

            const getStore   = createStubStore();
            const { cstore } = getStore();

            const mock_cstore = sinon.mock( cstore );

            // clears previous diffs
            mock_cstore.expects( 'clear' )
                .once()
                .returns( Promise.resolve( cstore ) );

            return Sut( bvalidator, vmonitor, dep_factory, getStore )
                .validate( {}, classes )
                .then( () =>
                {
                    // clear should have been called
                    mock_cstore.verify();

                    // keep in mind that we are using MemoryStore for this
                    // test (whereas a real implementation would probably be
                    // using a DiffStore)
                    return Promise.all(
                        Object.keys( classes ).map( key =>
                            expect( cstore.get( key ) )
                                .to.eventually.deep.equal( classes[ key ].indexes )
                        )
                    );
                } );
        } );


        it( 'considers failures from external validator', () =>
        {
            const expected_failure = {};

            const bvalidator  = createMockBucketValidator(
                function( data, err, _ )
                {
                    // see `failures` below
                    err( 'foo', 'moo', 2 );
                }
            );

            const vmonitor    = ValidStateMonitor();
            const dep_factory = createMockDependencyFactory();
            const getStore    = createStubStore();

            const diff = { foo: [ 'a', 'b', 'c' ] };
            const expected_failures = {
                foo: {
                    0: expected_failure,
                    2: expected_failure,
                },
            };

            const validatef = ( given_diff, given_failures ) =>
            {
                expect( given_diff ).to.equal( diff );
                expect( given_failures.foo[ 2 ] )
                    .to.equal( expected_failure );

                given_failures.foo[ 0 ] = expected_failure;
            };

            // TODO: this is an implementation detail left over from the
            // good 'ol days; remove it
            sinon.mock( vmonitor )
                .expects( 'update' )
                .once()
                .withExactArgs( getStore().store, expected_failures )
                .returns( Promise.resolve( undefined ) );

            sinon.mock( dep_factory )
                .expects( 'createFieldFailure' )
                .returns( expected_failure );

            return Sut( bvalidator, vmonitor, dep_factory, getStore )
                .validate( diff, {}, validatef );
        } );


        it( 'rejects if field monitor update rejects', () =>
        {
            const bvalidator  = createMockBucketValidator();
            const vmonitor    = ValidStateMonitor();
            const dep_factory = createMockDependencyFactory();

            const expected_e = Error();

            sinon.mock( vmonitor )
                .expects( 'update' )
                .once()
                .returns( Promise.reject( expected_e ) );

            return expect(
                Sut( bvalidator, vmonitor, dep_factory, createStubStore() )
                    .validate( {} )
            ).to.eventually.be.rejectedWith( expected_e );
        } );
    } );
} );


function createMockBucketValidator( validatef )
{
    validatef = validatef || ( ( x, y, z ) => {} );

    return BucketDataValidator.extend(
    {
        'override public validate': validatef,
    } )();
}


// This isn't yet moved into liza (at least at the time of writing this)
function createMockDependencyFactory( map )
{
    // alternative to mocking since the ClientDependencyFactory is not going
    // to be used in the future
    return {
        createFieldFailure: () => {},
    };
}


function createStubStore()
{
    const stores = {
        store:  MemoryStore(),
        bstore: MemoryStore(),
        cstore: MemoryStore(),
    };

    return () => stores;
}