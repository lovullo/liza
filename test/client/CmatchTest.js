/**
 * Test case for Cmatch
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
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

const { event }  = require( '../../' ).client;
const { expect } = require( 'chai' );

const Sut = require( '../../src/client/Cmatch' )
    .extend(
{
    'override constructor'( _, __, ___ ) {},

    // make public
    'override public markShowHide'( field, visq, show, hide )
    {
        return this.__super( field, visq, show, hide );
    }
} );


// these tests aren't terribly effective right now
describe( "Cmatch", () =>
{
    it( "marks hidden fields on class change to show", () =>
    {
        expect(
            Sut().markShowHide( 'foo', {}, [ 1, 2 ], [] )
        ).to.deep.equal( { foo: { show: [ 1, 2 ] } } );
    } );


    it( "marks shown fields on class change to hide", () =>
    {
        expect(
            Sut().markShowHide( 'foo', {}, [], [ 3, 4, 5 ] )
        ).to.deep.equal( { foo: { hide: [ 3, 4, 5 ] } } );
    } );


    it( "marks combination show/hide on class change", () =>
    {
        expect(
            Sut().markShowHide( 'foo', {}, [ 2, 3 ], [ 4, 5, 6 ] )
        ).to.deep.equal( {
            foo: {
                show: [ 2, 3 ],
                hide: [ 4, 5, 6 ],
            }
        } );
    } );


    it( "marks no fields with no show or hide", () =>
    {
        expect(
            Sut().markShowHide( 'foo', {}, [], [] )
        ).to.deep.equal( {} );
    } );


    it( "does not affect marking of other fields", () =>
    {
        const barval = {};
        const visq   = { bar: barval };

        Sut().markShowHide( 'foo', {}, [ 1 ], [ 0 ] );

        expect( visq.bar ).to.equal( barval );
    } );
} );