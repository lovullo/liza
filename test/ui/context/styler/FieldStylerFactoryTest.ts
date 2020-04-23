/**
 * Test case for FieldStylerFactory
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

import { FieldStylerFactory as Sut } from "../../../../src/ui/context/styler/FieldStylerFactory";
import { PositiveInteger } from "../../../../src/numeric";
import { DefaultFieldStyler}  from "../../../../src/ui/context/styler/DefaultFieldStyler";
import { CheckboxFieldStyler } from "../../../../src/ui/context/styler/CheckboxFieldStyler";

import { expect } from 'chai';


describe( "FieldStylerFactory", () =>
{
    [
        {
            label: 'creates new DefaultFieldStyler',
            field_name: 'baz',
            qtypes: { 'baz': { type: 'text', dim: <PositiveInteger>0 } },
            expected: DefaultFieldStyler
        },
        {
            label: 'creates new DefaultFieldStyler for static without qtype',
            field_name: 'foo-label',
            qtypes: { 'baz': { type: 'text', dim: <PositiveInteger>0 } },
            expected: DefaultFieldStyler
        },
        {
            label: 'creates new CheckboxFieldStyler for legacyradio type',
            field_name: 'baz',
            qtypes: { 'baz': { type: 'legacyradio', dim: <PositiveInteger>0 } },
            expected: CheckboxFieldStyler
        },
        {
            label: 'creates new CheckboxFieldStyler for radio question type',
            field_name: 'baz',
            qtypes: { 'baz': { type: 'radio', dim: <PositiveInteger>0 } },
            expected: CheckboxFieldStyler
        },
        {
            label: 'creates new CheckboxFieldStyler for noyes question type',
            field_name: 'baz',
            qtypes: { 'baz': { type: 'noyes', dim: <PositiveInteger>0 } },
            expected: CheckboxFieldStyler
        },
        {
            label: 'creates new CheckboxFieldStyler for checkbox question type',
            field_name: 'baz',
            qtypes: { 'baz': { type: 'checkbox', dim: <PositiveInteger>0 } },
            expected: CheckboxFieldStyler
        },
    ].forEach( ( {
             label,
             field_name,
             qtypes,
             expected
        } ) => {
        it ( label, () =>
        {
            const sut = new Sut( qtypes );

            const given = sut.create( field_name, <PositiveInteger>0 );

            expect( given ).to.be.instanceOf( expected );
        } );
    } );

} );

