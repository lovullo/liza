/**
 * Test case for DiffStore
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

"use strict";

const store          = require( '../../' ).store;
const chai           = require( 'chai' );
const expect         = chai.expect;
const Class          = require( 'easejs' ).Class;
const Sut            = store.DiffStore;
const StoreMissError = store.StoreMissError;

chai.use( require( 'chai-as-promised' ) );


describe( 'store.DiffStore', () =>
{
    it( 'considers first add call to be diffable', () =>
    {
        return expect(
            Sut()
                .add( 'foo', 'bar' )
                .then( sut => sut.get( 'foo' ) )
        ).to.eventually.equal( 'bar' );
    } );


    it( 'does not clear diff on add of new key', () =>
    {
        return expect(
            Sut()
                .add( 'foo', 'bar' )
                .then( sut => sut.add( 'baz', 'quux' ) )
                .then( sut => Promise.all( [
                    sut.get( 'foo' ),
                    sut.get( 'baz' ),
                ] ) )
        ).to.eventually.deep.equal( [ 'bar', 'quux'] );
    } );


    it( 'updates diff when key modified before clear', () =>
    {
        return expect(
            Sut()
                .add( 'foo', 'bar' )
                .then( sut => sut.add( 'foo', 'baz' ) )
                .then( sut => sut.get( 'foo' ) )
        ).to.eventually.equal( 'baz' );
    } );


    it( 'considers key unchanged in diff immediately after clear', () =>
    {
        debugger;
        return expect(
            Sut()
                .add( 'foo', 'bar' )
                .then( sut => sut.clear() )
                .then( sut => sut.get( 'foo' ) )
        ).to.eventually.equal( undefined );
    } );


    // distinction between unknown key and no change (compare to above test)
    it( 'distinguishes between unchanged and unknown keys', () =>
    {
        debugger;
        return expect(
            Sut()
                .add( 'foo', 'bar' )
                .then( sut => sut.clear() )
                .then( sut => sut.get( 'unknown' ) )
        ).to.eventually.be.rejectedWith( StoreMissError );
    } );


    [
        // scalar
        {
            orig:     'bar',
            next:     'baz',
            expected: 'baz',
        },

        {
            orig:     [ 'bar', 'baz' ],
            next:     'baz',
            expected: 'baz',
        },

        // returns new value if entire array changed
        {
            orig:     [ 'bar', 'baz' ],
            next:     [ 'quux', 'quuux' ],
            expected: [ 'quux', 'quuux' ],
        },

        // sets unchanged indexes to undefined
        {
            orig:     [ 'bar', 'baz', 'quux' ],
            next:     [ 'bar', 'quux' ],
            expected: [ undefined, 'quux', undefined ],
        },

        // next size > original
        {
            orig:     [ 'bar', 'baz' ],
            next:     [ 'quux', 'baz', 'quuux' ],
            expected: [ 'quux', undefined, 'quuux' ],
        },

        // 5 ^

        // same
        {
            orig:     [ 'bar', 'baz' ],
            next:     [ 'bar', 'baz' ],
            expected: [ undefined, undefined ],
        },

        // no longer an array
        {
            orig:     [ 'bar', [ 'baz', 'quux' ] ],
            next:     [ 'bar', 'quux' ],
            expected: [ undefined, 'quux'],
        },

        // nested change
        {
            orig:     [ 'bar', [ 'baz', 'quux' ] ],
            next:     [ 'bar', [ 'foo', 'quux' ] ],
            expected: [ undefined, [ 'foo', undefined ] ],
        },

        // note that it always recurses to set undefined, even if all of
        // them are undefined
        {
            orig:     [ [ 'bar' ], [ [ 'baz', 'quux' ] ] ],
            next:     [ [ 'bar' ], [ [ 'baz', 'foo' ] ] ],
            expected: [ [ undefined ], [ [ undefined, 'foo' ] ] ],
        },

        // there's not a distinction in the algorithm between numeric
        // indexes and object keys
        {
            orig:     { foo: 'bar' },
            next:     { foo: 'baz' },
            expected: { foo: 'baz' },
        },

        // 10 ^

        {
            orig:     { foo: 'bar' },
            next:     { foo: 'bar' },
            expected: { foo: undefined },
        },
        {
            orig:     { foo: 'bar', baz: 'quux' },
            next:     { foo: 'foo', baz: 'quux' },
            expected: { foo: 'foo', baz: undefined },
        },
        {
            orig:     { foo: 'bar', baz: 'quux' },
            next:     { baz: 'change' },
            expected: { foo: undefined, baz: 'change' },
        },
        {
            orig:     { foo: 'bar', baz: [ 'a', 'b', ] },
            next:     { baz: [ 'a', 'c' ] },
            expected: { foo: undefined, baz: [ undefined, 'c' ] },
        },
        {
            orig:     { foo: { bar: [ 'baz' ] } },
            next:     { foo: { bar: [ 'baz', 'quux' ] } },
            expected: { foo: { bar: [ undefined, 'quux' ] } },
        },
    ].forEach( ( { orig, next, expected }, i ) =>
    {
        it( `properly diffs (${i})`, () =>
        {
            return expect(
                Sut()
                    .add( 'foo', orig )
                    .then( sut => sut.clear() )
                    .then( sut => sut.add( 'foo', next ) )
                    .then( sut => sut.get( 'foo' ) )
            ).to.eventually.deep.equal( expected );
        } );
    } );


    describe( '#reduce', () =>
    {
        it( 'iterates though each diff', () =>
        {
            return expect(
                Sut()
                    .add( 'foo', [ 'a', 'foo' ] )
                    .then( sut => sut.add( 'bar', 'b' ) )
                    .then( sut => sut.add( 'baz', 'c' ) )
                    .then( sut => sut.clear() )
                    .then( sut => sut.add( 'foo', [ 'a2', 'foo' ] ) )
                    .then( sut => sut.add( 'baz', 'c2' ) )
                    .then( sut => sut.reduce( ( accum, value, key ) =>
                    {
                        accum[ key ] = value;
                        return accum;
                    }, {} ) )
            ).to.eventually.deep.equal( {
                foo: [ 'a2', undefined ],
                baz: 'c2',
            } );
        } );
    } );


    describe( '#populate', () =>
    {
        it( "#add's each element of object to store", () =>
        {
            const obj = { foo: {}, bar: {} };
            const sut = Sut();

            return sut.populate( obj )
                .then( ps =>
                {
                    // by reference
                    expect( sut.get( 'foo' ) )
                        .to.eventually.equal( obj.foo );
                    expect( sut.get( 'bar' ) )
                        .to.eventually.equal( obj.bar );

                    expect( ps.length )
                       .to.equal( Object.keys( obj ).length );
                } );
        } );

        it( "fails if any add fails", () =>
        {
            const e = Error( 'ok' );

            const sut = Sut.extend( {
                'override add': ( k, v ) => Promise.reject( e )
            } )();

            return expect( sut.populate( { a: 1 } ) )
                .to.eventually.be.rejectedWith( e );
        } );
    } );
} );
