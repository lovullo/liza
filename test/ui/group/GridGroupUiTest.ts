/**
 * Test case for GridGroupUi
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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

const Sut  = require( "../../../src/ui/group/GridGroupUi" );
const sinon = require( 'sinon' );

import { expect } from 'chai';
import { createSut, createQuote, createBoxContent } from "./CommonResources";

before(function () {
    this.jsdom = require( 'jsdom-global' )();
});

after(function () {
    this.jsdom();
});

describe( "GridGroup", () =>
{
    describe ( "gettXType", () =>
    {
        it( "detects x-type for a group", () =>
        {
            const sut = createSut( Sut, { content: createBoxContent() } );

            expect( sut.getXType() ).to.be.null;

            sut.init( createQuote() );
            sut.visit();

            expect( sut.getXType() ).to.equal( "foo" );
        } );
    } );

    describe ( "isVisible", () =>
    {
        it( "detects when the group is visible", () =>
        {
            const content = createBoxContent();

            content.classList.contains = sinon.stub().returns( true );

            const sut = createSut( Sut, { content: content } );

            expect( sut.isVisible() ).to.be.false;

            sut.init( createQuote() );
            sut.visit();

            expect( sut.isVisible() ).to.be.true;
        } );

        it( "detects when the group is not visible", () =>
        {
            const sut = createSut( Sut, { content: createBoxContent() } );

            expect( sut.isVisible() ).to.be.false;

            sut.init( createQuote() );
            sut.visit();

            expect( sut.isVisible() ).to.be.false;
        } );
    } );
} );

