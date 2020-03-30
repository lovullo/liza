/**
 * Test case for FieldContext
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

import { FieldContextFactory as Sut } from "../../../src/ui/context/FieldContextFactory";
import { FieldContext } from "../../../src/ui/context/FieldContext";
import { PositiveInteger } from "../../../src/numeric";

import { expect } from 'chai';


describe( "FieldContextFactory", () =>
{
    it( "creates new FieldContext", () =>
    {
        const sut = new Sut();

        const content = document.createElement( "div" );
        content.innerHTML = '<dt></dt>';

        const given = sut.create( content, <PositiveInteger>0 );

        expect( given ).to.be.instanceOf( FieldContext );
    } );
} );
