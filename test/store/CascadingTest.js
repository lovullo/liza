/**
 * Test case for Cascading store
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

var store  = require( '../../' ).store,
    expect = require( 'chai' ).expect,
    Store  = store.MemoryStore,
    Sut    = store.Cascading;

describe( 'store.Cascading', () =>
{
    describe( '#add', () =>
    {
        it( 'does not allow attaching non-store objects', () =>
        {
            expect( () =>  Store.use( Sut )().add( 'invalid', {} ) )
                .to.throw( TypeError );
        } );


        it( 'allows attaching Store objects', () =>
        {
            expect( () =>  Store.use( Sut )().add( 'valid', Store() ) )
                .to.not.throw( TypeError );
        } );
    } );


    describe( '#clear', () =>
    {
        it( 'invokes #clear on all contained stores', () =>
        {
            const cleared = [];

            const MockStore = Store.extend(
            {
                'override clear'()
                {
                    cleared.push( this.__inst );
                }
            } );

            const stores = [ 1, 2, 3 ].map( () => MockStore() );
            const sut    = Store.use( Sut )();

            stores.forEach( ( store, i ) => sut.add( i, store ) );

            // should trigger clear on all stores
            sut.clear();

            expect(
                stores.every( store =>
                    cleared.some( item => item === store )
                )
            ).to.be.true;
        } );
    } );
} );