/**
 * Test case for DefaultFieldStyler
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

import { NullableFieldElement, DefaultFieldStyler as Sut } from "../../../../src/ui/context/styler/DefaultFieldStyler";
import { PositiveInteger } from "../../../../src/numeric";

import { expect } from 'chai';


before(function () {
    this.jsdom = require('jsdom-global')()
})

after(function () {
    this.jsdom()
})



describe( "DefaultFieldStyler", () =>
{
    [
        {
            label: 'setValue sets value for input field when id is found',
            field_name: "foo",
            index: 0,
            value: "bar",
            html_content: '<input type="text" id="q_foo_0" data-field-name="foo">',
        },
        {
            label: 'setValue sets value for input field when id is not found',
            field_name: "baz_qux",
            index: 5,
            value: "true",
            html_content: '<input type="text" id="q_foobar_bq34w" data-field-name="baz_qux">',
        },
    ].forEach( ( {
             label,
             field_name,
             index,
             value,
             html_content
        } ) => {
        it ( label, () =>
        {
            const content = document.createElement( "dd" );
            content.innerHTML = html_content;

            const sut = new Sut( field_name, <PositiveInteger>index );

            sut.setValue( content, value );

            const element = <NullableFieldElement>content.querySelector( 'input' );

            expect( element?.value ).to.equal( value );
        } );
    } );

} );
