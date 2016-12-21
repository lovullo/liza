/**
 * Test case for MemoryStore
 *
 *  Copyright (C) 2016 LoVullo Associates, Inc.
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

var store   = require( '../../' ).store,
    expect  = require( 'chai' ).expect,
    Class   = require( 'easejs' ).Class,
    Trait   = require( 'easejs' ).Trait,
    Sut     = store.MemoryStore;


describe( 'store.MemoryStore', () =>
{
    describe( '#add', () =>
    {
        it( 'adds item to store when missing', () =>
        {
            const sut  = Sut();
            const item = {};

            expect(
                sut.add( 'foo', item )
                    .get( 'foo' )
            ).to.equal( item );
        } );


        it( 'replaces item in store if existing', () =>
        {
            const sut  = Sut();
            const item = {};

            expect(
                sut.add( 'foo', [] )
                    .add( 'foo', item )
                    .get( 'foo' )
            ).to.equal( item );
        } );
    } );


    // most things implicitly tested above
    describe( '#get', () =>
    {
        it( 'returns undefined if store item does not exist', () =>
        {
            expect( Sut().get( 'unknown' ) ).to.be.undefined;
        } );
    } );


    describe( '#clear', () =>
    {
        it( 'removes all items from store', () =>
        {
            const sut  = Sut();
            const keys = [ 'foo', 'bar', 'baz' ];

            keys.forEach( key => sut.add( key ) );

            // should remove all items
            sut.clear();

            keys.forEach( key => expect( sut.get( key ) ).to.be.undefined );
        } );


        it( 'returns self', () =>
        {
            const sut = Sut();

            expect( sut.clear() ).to.equal( sut );
        } );
    } );


    describe( 'with mixin', () =>
    {
        it( 'allows overriding add', done =>
        {
            const expected_key   = 'foo';
            const expected_value = {};

            Sut.use(
                Trait.extend( Sut,
                {
                    'override add'( key, value )
                    {
                        expect( key ).to.equal( expected_key );
                        expect( value ).to.equal( expected_value );
                        done();
                    }
                } )
            )().add( expected_key, expected_value );
        } );


        it( 'allows overriding get', done =>
        {
            const expected_key = 'bar';

            Sut.use(
                Trait.extend( Sut,
                {
                    'override get'( key )
                    {
                        expect( key ).to.equal( expected_key );
                        done();
                    }
                } )
            )().get( expected_key );
        } );


        it( 'allows overriding clear', done =>
        {
            Sut.use(
                Trait.extend( Sut,
                {
                    'override clear'( key )
                    {
                        done();
                    }
                } )
            )().clear();
        } );
    } );


    describe( '#reduce', () =>
    {
        it( 'folds each stored item', () =>
        {
            const StubSut = Sut.extend(
            {
                sum()
                {
                    return this.reduce(
                        ( accum, item, key ) =>
                        {
                            // correct key for item?
                            expect( item ).to.equal( vals[ key ] );

                            return accum + item;
                        },
                        5
                    );
                }
            } );

            const sut  = StubSut();
            const vals = {
                one:   1,
                two:   2,
                three: 3,
            };

            Object.keys( vals ).forEach(
                ( key, i ) => sut.add( key, vals[ key ] )
            );

            // implicitly tests initial
            expect( sut.sum() ).to.equal( 11 );
        } );
    } );
} );
