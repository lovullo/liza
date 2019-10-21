/**
 * Test numeric types
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { expect } from 'chai';
import { PositiveInteger, isPositiveInteger } from "../src/numeric";


describe( 'isPositiveInteger', () =>
{
    [
        0,
        5,
    ].forEach( value => it( `accepts positive integers (${value})`, () =>
    {
        expect( isPositiveInteger( value ) ).to.be.true;
    } ) );


    [
        -1,
        -5,
    ].forEach( value => it( `rejects negative integers (${value})`, () =>
    {
        expect( isPositiveInteger( value ) ).to.be.false;
    } ) );


    it( "asserts type PositiveInteger", () =>
    {
        const n = 5;

        if ( isPositiveInteger( n ) )
        {
            // TS should recognize as PositiveInteger within this block
            checkPositiveInteger( n );
        }
    } );
} );


const checkPositiveInteger = ( _n: PositiveInteger ): void => {};
