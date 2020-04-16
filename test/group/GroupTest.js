/**
 * Test Group
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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
 */

"use strict";

const Sut    = require( '../../' ).group.Group;
const expect = require( 'chai' ).expect;

describe( 'Group', () =>
{
    it( '#setInternal sets internal flag', () =>
    {
        const sut = Sut();
        expect( sut.isInternal() ).to.be.false;
        sut.setInternal( true );
        expect( sut.isInternal() ).to.be.true;
        sut.setInternal( false );
        expect( sut.isInternal() ).to.be.false;
    } );
} );
