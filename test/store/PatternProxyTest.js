/**
 * Test case for PatternProxy trait
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

const store  = require( '../../' ).store;
const chai   = require( 'chai' );
const expect = chai.expect;
const Store  = store.MemoryStore;
const Sut    = store.PatternProxy;
const sinon  = require( 'sinon' );

chai.use( require( 'chai-as-promised' ) );


describe( 'store.PatternProxy', () =>
{
    describe( 'fails on invalid pattern map', () =>
    {
        [
            // not a pattern
            [ {}, Store() ],

            // not a Store
            [ /^./, {} ],

            // missing Store
            [ /^./ ],

            // missing all
            [],
        ].forEach( ( patterns, i ) =>
            it( `(${i})`, () =>
            {
                expect( () => Store.use( Sut( [ patterns ] ) )() )
                    .to.throw( TypeError );
            } )
        );
    } );


    it( 'proxies #add by pattern', () =>
    {
        const store1 = Store();
        const store2 = Store();

        // second strips
        const patterns = [
            [ /^foo:/, store1 ],
            [ /^bar:(.*)$/, store2 ],
        ];

        return Promise.all( [
            expect(
                Store.use( Sut( patterns ) )()
                    .add( 'foo:moo', 'moo' )
                    .then( store => store1.get( 'foo:moo' ) )
            ).to.eventually.equal( 'moo' ),

            expect(
                Store.use( Sut( patterns ) )()
                    .add( 'bar:quux', 'quuxval' )
                    .then( store => store2.get( 'quux' ) )
            ).to.eventually.equal( 'quuxval' ),
        ] );
    } );


    it( 'proxies #get by pattern', () =>
    {
        const store1 = Store();
        const store2 = Store();

        // second strips
        const patterns = [
            [ /^foo:/, store1 ],
            [ /^bar:(.*)$/, store2 ],
        ];

        const sut = Store.use( Sut( patterns ) )();

        return Promise.all( [
            expect(
                store1.add( 'foo:bar', 'moo' )
                    .then( () => sut.get( 'foo:bar' ) )
            ).to.eventually.equal( 'moo' ),

            expect(
                store2.add( 'quux', 'quuxval' )
                    .then( () => sut.get( 'bar:quux' ) )
            ).to.eventually.equal( 'quuxval' ),
        ] );
    } );


    // if no matches, error (like traditional functional pattern matching)
    it( 'fails on #add or #get when match fails', () =>
    {
        const patterns = [ [ /moo/, Store() ] ];

        return Promise.all( [
            expect(
                Store.use( Sut( patterns ) )()
                    .add( 'uh', 'no' )
            ).to.eventually.be.rejectedWith( store.StorePatternError ),

            expect(
                Store.use( Sut( patterns ) )()
                    .get( 'sorry', 'sir' )
            ).to.eventually.be.rejectedWith( store.StorePatternError ),
        ] );
    } );


    describe( '#clear', () =>
    {
        it( 'invokes #clear on all contained stores', () =>
        {
            const store1 = Store();
            const store2 = Store();

            const mocks = [ store1, store2 ].map( store =>
            {
                const mock = sinon.mock( store );

                mock.expects( 'clear' ).once();
                return mock;
            } );

            const patterns = [
                [ /^a/, store1 ],
                [ /^b/, store2 ],
            ];

            const sut = Store.use( Sut( patterns ) )();

            return sut.clear()
                .then( given_sut => {
                    // TODO: uncomment once `this.__inst' in Traits is fixed
                    // in GNU ease.js
                    // expect( given_sut ).to.equal( sut );
                    mocks.forEach( mock => mock.verify() );
                } );
        } );
    } );
} );
