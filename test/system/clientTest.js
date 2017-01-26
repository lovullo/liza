/**
 * Tests instantiation of portions of the client system
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
 *
 * This is a functional test of the client system at large; these are _not_
 * unit tests.
 */

"use strict";

const root   = require( '../../' );
const sut    = root.system.client;
const expect = require( 'chai' ).expect;
const Store  = root.store.Store;
const Class  = require( 'easejs' ).Class;


describe( 'client', () =>
{
    describe( 'data.diffStore', () =>
    {
        it( 'produces Store', () =>
        {
            const result = sut.data.diffStore();

            expect( Class.isA( Store, result ) )
                .to.be.true;
        } );
    } );
} );
