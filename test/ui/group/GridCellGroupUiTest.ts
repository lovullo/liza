/**
 * Test case for GridCellGroupUi
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

const Sut  = require( "../../../src/ui/group/GridCellGroupUi" );
const sinon = require( 'sinon' );

import { expect } from 'chai';
import { createSut, createQuote, createContent } from "./CommonResources";

before(function () {
  this.jsdom = require( 'jsdom-global' )();
});

after(function () {
  this.jsdom();
});

describe( "GridCellGroup", () =>
{
  describe ( "gettXType", () =>
  {
    it( "detects x-type for a cell", () =>
    {
      const sut = createSut( Sut );

      expect( sut.getXType() ).to.be.null;

      sut.init( createQuote() );
      sut.visit();

      expect( sut.getXType() ).to.equal( "foo" );
    } );
  } );

  describe ( "cellIsVisible", () =>
  {
    it( "detects when the cell is visible", () =>
    {

      const content = createContent();
      content.classList.contains = sinon.stub().returns( true );

      const sut = createSut( Sut, { content: content }  );

      expect( sut.cellIsVisible() ).to.be.false;

      sut.init( createQuote() );
      sut.visit();

      expect( sut.cellIsVisible() ).to.be.true;
    } );

    it( "detects when the cell is not visible", () =>
    {
      const sut = createSut( Sut );

      expect( sut.cellIsVisible() ).to.be.false;

      sut.init( createQuote() );
      sut.visit();

      expect( sut.cellIsVisible() ).to.be.false;
    } );
  } );
} );


