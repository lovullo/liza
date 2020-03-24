/**
 * Test case for ContextParser
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

import { ContextParser as Sut } from "../../../src/ui/context/ContextParser";
import { NullableContextContent} from "../../../src/ui/context/FieldContext";

import { expect } from 'chai';


before(function () {
    this.jsdom = require('jsdom-global')()
})

after(function () {
    this.jsdom()
})

describe( "ContextParser", () =>
{
    [
        {
            element_id: 'foo_bar',
            expected: '<input type="text" id="foo_bar">'
        },
        {
            element_id: 'foo_subfield',
            expected: '<option id="q_foo_subfield_0" value="Bar">Foo</option>'
        },
        {
            element_id: 'checkbox_foo',
            expected: '<dd id="qcontainer_checkbox_foo">' +
                    '<input type="checkbox" id="q_checkbox_foo_n_0">' +
                    '<input type="checkbox" id="q_checkbox_foo_y_0">' +
                '</dd>'
        },
        {
            element_id: 'checkbox_no_label',
            expected: '<dd id="qcontainer_checkbox_no_label">' +
                    '<input type="checkbox" id="q_checkbox_no_label_n_0">' +
                '</dd>'
        },
    ].forEach( ( { element_id, expected } ) =>
    {
        it( "parses content by element id " + element_id, () =>
        {
            const sut = new Sut();

            const given: NullableContextContent = sut.parse( element_id, getContent() );

            expect( ( given?.outerHTML as string ) ).to.equal( expected );
        } );
    } );


    it( "returns null when element not found", () =>
    {
        const sut = new Sut();

        const element_id = 'external_no_field_exists';

        const given: NullableContextContent = sut.parse( element_id, getContent() );

        expect( given ).to.equal( null );
    } );

} );


function getContent()
{
    var elem = document.createElement( "div" );

    elem.innerHTML = '<dl class="">' +
        '<dt id="qlabel_checkbox_foo" >Foo</dt>' +
        '<dd id="qcontainer_checkbox_foo">' +
            '<input type="checkbox" id="q_checkbox_foo_n_0">' +
            '<input type="checkbox" id="q_checkbox_foo_y_0">' +
        '</dd>' +
        '<dd id="qcontainer_checkbox_no_label">' +
            '<input type="checkbox" id="q_checkbox_no_label_n_0">' +
        '</dd>' +
        '<dt id="qlabel_foo_bar_long_name" >Foo</dt>' +
        '<dd id="qcontainer_foo_bar_long_name">' +
            '<input type="text" id="foo_bar" >' +
        '</dd>' +
        '<select id="q_bi_risk_type_0">' +
            '<option id="q_foo_subfield_0" value="Bar">Foo</option>' +
        '</select>' +
    '</dl>';

    return elem;
}