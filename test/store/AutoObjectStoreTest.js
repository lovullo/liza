/**
 * Tests AutoObjectStore
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

'use strict';

const chai   = require( 'chai' );
const expect = chai.expect;

chai.use( require( 'chai-as-promised' ) );

const {
    AutoObjectStore: Sut,
    MemoryStore:     Store,
} = require( '../../' ).store;



describe( 'AutoObjectStore', () =>
{
    describe( "given an object value", () =>
    {
        it( "applies given ctor to objects", () =>
        {
            const obj        = Store();
            const dummy_ctor = () => obj;
            const sut        = Store.use( Sut( dummy_ctor ) )();

            const foo = sut
                .add( 'foo', {} )
                .then( _ => sut.get( 'foo' ) );

            return expect( foo )
                .to.eventually.deep.equal( obj );
        } );


        it( "adds object values to new store", () =>
        {
            const obj = { bar: "baz" };
            const sut = Store.use( Sut( Store ) )();

            const bar = sut
                .add( 'foo', obj )
                .then( _ => sut.get( 'foo' ) )
                .then( substore => substore.get( 'bar' ) );

            return expect( bar ).to.eventually.equal( obj.bar );
        } );


        it( "caches sub-store until key changes", () =>
        {
            const obj = {};
            const sut = Store.use( Sut( Store ) )();

            return sut
                .add( 'foo', {} )
                .then( _ => sut.get( 'foo' ) )
                .then( store1 =>
                    expect( sut.get( 'foo' ) ).to.eventually.equal( store1 )
                        .then( _ => sut.add( 'foo', "new" ) )
                        .then( _ => sut.get( 'foo' ) )
                        .then( store2 =>
                            expect( store2 ).to.not.equal( store1 )
                        )
                );
          } );
    } );


    it( "leaves non-objects untouched", () =>
    {
        const expected = "bar";
        const sut = Store.use( Sut( () => null ) )();

        const foo = sut
            .add( 'foo', expected )
            .then( _ => sut.get( 'foo' ) );

        return expect( foo ).to.eventually.equal( expected );
    } );


    // includes class instances, since easejs generates prototypes
    it( "leaves prototype instances untouched", () =>
    {
        const expected = ( new function() {} );
        const sut = Store.use( Sut( () => null ) )();

        const foo = sut
            .add( 'foo', expected )
            .then( _ => sut.get( 'foo' ) );

        return expect( foo ).to.eventually.equal( expected );
    } );
} );
