/**
 * Test of staging key/value store
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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

const { Class } = require( 'easejs' );
const root      = require( '../../' );
const expect    = require( 'chai' ).expect;
const sinon     = require( 'sinon' );

const {
    Bucket,
    StagingBucket: Sut
} = root.bucket;


describe( 'StagingBucket', () =>
{
    describe( 'pre-update event', () =>
    {
        it( 'allows updating data before set', () =>
        {
            const sut = Sut( createStubBucket() );

            const data = {
                foo: [ 'bar', 'baz' ],
            };

            sut.on( 'preStagingUpdate', data =>
            {
                data.foo[ 1 ] = 'quux';
            } );

            // triggers setValues
            sut.setValues( data );

            expect( sut.getDataByName( 'foo' ) )
                .to.deep.equal( [ 'bar', 'quux' ] );
        } );


        [
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [ 'bar', 'baz' ] },
                merge_index: true,
                is_change:   false,
            },
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [ 'bar', 'baz' ] },
                merge_index: false,
                is_change:   false,
            },

            // actual changes
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [ 'change', 'baz' ] },
                merge_index: true,
                is_change:   true,
            },
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [ 'bar', 'change' ] },
                merge_index: true,
                is_change:   true,
            },
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [ undefined, 'change' ] },
                merge_index: true,
                is_change:   true,
            },

            // single-index changes make sense only if merge_index
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [ undefined, 'baz' ] },
                merge_index: true,
                is_change:   false,
            },
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [ 'bar', undefined ] },
                merge_index: true,
                is_change:   false,
            },
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [ 'bar', null ] },
                merge_index: true,
                is_change:   true,
            },
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [] },
                merge_index: true,
                is_change:   false,
            },
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [] },
                merge_index: false,
                is_change:   true,
            },
            {
                initial:     { foo: [ 'bar' ] },
                update:      { foo: [ 'bar', undefined ] },
                merge_index: false,
                is_change:   true,
            },

            // only interpreted as a diff if merge_index
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      { foo: [ 'bar', undefined ] },
                merge_index: false,
                is_change:   true,
            },

            // no index at all
            {
                initial:     { foo: [ 'bar', 'baz' ] },
                update:      {},
                merge_index: true,
                is_change:   false,
            },
        ].forEach( ( { initial, update, merge_index, is_change }, i ) =>
        {
            it( `is emitted only when data is changed (${i})`, () =>
            {
                const sut    = Sut( createStubBucket() );
                let   called = false;

                sut.setValues( initial, merge_index );

                sut.on( 'preStagingUpdate', () => called = true );
                sut.setValues( update, merge_index );

                expect( called ).to.equal( is_change );
            } );
        } );
    } );


    describe( "#setCommittedValues", () =>
    {
        it( "bypasses staging bucket without no bypass flag", () =>
        {
            const b     = createStubBucket();
            const bmock = sinon.mock( b );
            const data  = { foo: [ "bar" ] };
            const sut   = Sut( b );

            bmock.expects( 'setValues' )
                .once()
                .withExactArgs( data );

            sut.setCommittedValues( data );

            // no diff if bypassed
            expect( sut.getDiff() ).to.deep.equal( {} );

            bmock.verify();
        } );


        it( "does not bypasses staging bucket with no bypass flag", () =>
        {
            const b     = createStubBucket();
            const bmock = sinon.mock( b );
            const data  = { foo: [ "bar" ] };
            const sut   = Sut( b );

            bmock.expects( 'setValues' ).never();

            sut.forbidBypass();
            sut.setCommittedValues( data );

            // should have been staged
            expect( sut.getDiff() ).to.deep.equal( data );

            bmock.verify();
        } );
    } );
} );


function createStubBucket( bucket_obj )
{
    return Class.implement( Bucket ).extend(
    {
        'public getData'()
        {
            return bucket_obj;
        },

        'public setValues'( data, merge_index, merge_null ) {},
        'public overwriteValues'( data ) {},
        'public clear'() {},
        'public each'( callback ) {},
        'public getDataByName'( name ) {},
        'public getDataJson'() {},
        'public filter'( pred, callback) {},
        'on'() {},
    } )();
}
