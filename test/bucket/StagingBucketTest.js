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
    StagingBucket: Sut,

    // TODO: decouple test from this
    QuoteDataBucket,
} = root.bucket;


describe( 'StagingBucket', () =>
{
    it( 'pre-update event allows updating data before set', () =>
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
            is_change:   false,
            expected:    {
                data: { foo: [ 'bar', 'baz' ] },
                diff: {},
            },
        },

        // actual changes
        {
            initial:     { foo: [ 'bar', 'baz' ] },
            update:      { foo: [ 'change', 'baz' ] },
            is_change:   true,
            expected:    {
                data: { foo: [ 'change', 'baz' ] },
                diff: { foo: [ 'change' ] },
            },
        },
        {
            initial:     { foo: [ 'bar', 'baz' ] },
            update:      { foo: [ 'bar', 'change' ] },
            is_change:   true,
            expected:    {
                data: { foo: [ 'bar', 'change' ] },
                diff: { foo: [ , 'change' ] },
            },
        },
        {
            initial:     { foo: [ 'bar', 'baz' ] },
            update:      { foo: [ undefined, 'change' ] },
            is_change:   true,
            expected:    {
                data: { foo: [ 'bar', 'change' ] },
                diff: { foo: [ , 'change' ] },
            },
        },

        {
            initial:     { foo: [ 'bar', 'baz' ] },
            update:      { foo: [ undefined, 'baz' ] },
            is_change:   false,
            expected:    {
                data: { foo: [ 'bar', 'baz' ] },
                diff: {},
            },
        },
        {
            initial:     { foo: [ 'bar', 'baz' ] },
            update:      { foo: [ 'bar', undefined ] },
            is_change:   false,
            expected:    {
                data: { foo: [ 'bar', 'baz' ] },
                diff: {},
            },
        },
        {
            initial:     { foo: [ 'bar', 'baz' ] },
            update:      { foo: [ 'bar', null ] },
            is_change:   true,
            expected:    {
                data: { foo: [ 'bar' ] },
                diff: { foo: [ , null ] },
            },
        },
        {
            initial:     { foo: [ 'bar', 'baz' ] },
            update:      { foo: [ 'bar', 'baz', null ] },
            is_change:   false,
            expected:    {
                data: { foo: [ 'bar', 'baz' ] },
                diff: {},
            },
        },
        {
            initial:     { foo: [ 'bar', 'baz' ] },
            update:      { foo: [ 'bar', 'baz', 'quux' ] },
            is_change:   true,
            expected:    {
                data: { foo: [ 'bar', 'baz', 'quux' ] },
                diff: { foo: [ , , 'quux' ]},
            },
        },
        {
            initial:     { foo: [ 'bar', 'baz' ] },
            update:      { foo: [] },
            is_change:   false,
            expected:    {
                data: { foo: [ 'bar', 'baz' ] },
                diff: {},
            },
        },

        // null not at end of set means unchanged
        {
            initial:     { foo: [ 'bar', 'baz', 'quux' ] },
            update:      { foo: [ null, null, 'quux' ] },
            is_change:   false,
            expected:    {
                data: { foo: [ 'bar', 'baz', 'quux' ] },
                diff: {},
            },
        },
        // but the last one is
        {
            initial:     { foo: [ 'bar', 'baz', 'quux' ] },
            update:      { foo: [ null, 'baz', null ] },
            is_change:   true,
            expected:    {
                data: { foo: [ 'bar', 'baz' ] },
                diff: { foo: [ , , null ] },
            },
        },
        // given a string of nulls, only the last one is terminating; the
        // rest are interpreted as undefined (because JSON serializes
        // undefined values to `null' -_-)
        {
            initial:     { foo: [ 'bar', 'baz', 'quux' ] },
            update:      { foo: [ null, null, null ] },
            is_change:   true,
            expected:    {
                data: { foo: [ 'bar', 'baz' ] },
                diff: { foo: [ , , null ] },
            },
        },
    ].forEach( ( { initial, update, is_change, expected }, i ) =>
    {
        it( `pre-commit, properly processes diff and change (${i})`, () =>
        {
            const sut    = Sut( createStubBucket() );
            let   called = false;

            sut.setValues( initial );

            expect( sut.getDiff() ).to.deep.equal( initial );

            sut.on( 'preStagingUpdate', () => called = true );
            sut.setValues( update );

            expect( called ).to.equal( is_change );

            if ( expected )
            {
                expect( sut.getData() ).to.deep.equal( expected.data );
            }
        } );


        it( `post-commit, properly processes diff and change (${i})`, () =>
        {
            const sut    = Sut( createStubBucket() );
            let   called = false;

            sut.setValues( initial );
            sut.commit();

            sut.on( 'preStagingUpdate', () => called = true );
            sut.setValues( update );

            expect( called ).to.equal( is_change );

            if ( expected )
            {
                expect( sut.getData() ).to.deep.equal( expected.data );
                expect( sut.getDiff() ).to.deep.equal( expected.diff );
            }
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
    return QuoteDataBucket();
}
