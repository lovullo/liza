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

import { FieldContextStore as Sut } from "../../../src/ui/context/FieldContextStore";
import { ContextContent } from "../../../src/ui/context/FieldContext";
import { PositiveInteger } from "../../../src/numeric";

import { expect } from 'chai';


describe( "FieldContextStore", () =>
{
    [
        {
            element_id: 'qcontainer_checkbox_foo',
            sibling_id: 'qlabel_checkbox_foo',
            index: 10,
            expected_content:
                '<dd id="qcontainer_checkbox_foo" data-index="10">' +
                    '<input type="checkbox" id="q_checkbox_foo_n_10" data-index="10">' +
                    '<input type="checkbox" id="q_checkbox_foo_y_10" data-index="10">' +
                '</dd>',
            expected_sibling:
                '<dt id="qlabel_checkbox_foo" data-index="10">Foo</dt>'
        },
        {
            element_id: 'qcontainer_foo_bar_long_name',
            sibling_id: 'qlabel_foo_bar_long_name',
            index: 324,
            expected_content:
                '<dd id="qcontainer_foo_bar_long_name" data-index="324">' +
                    '<input type="text" id="foo_bar_324" data-index="324">' +
                '</dd>',
             expected_sibling:
                '<dt id="qlabel_foo_bar_long_name" data-index="324">Bar</dt>'
        },
    ].forEach( ( { element_id, sibling_id, index, expected_content, expected_sibling } ) =>
    {
        it( "creates a clone of the content and sets the element index for " + element_id, () =>
        {
            const group_content = getGroupContent();
            const content = group_content.querySelector( "#" + element_id );
            const sibling = group_content.querySelector( "#" + sibling_id );

            const sut = new Sut(
                <ContextContent>content,
                <ContextContent>sibling,
            );

            const content_modified = <ContextContent>sut.getContentClone( <PositiveInteger>index );
            const sibling_modified = <ContextContent>sut.getSiblingContentClone( <PositiveInteger>index );

            expect( ( content_modified?.outerHTML as string ) ).to.equal( expected_content );
            expect( ( sibling_modified?.outerHTML as string ) ).to.equal( expected_sibling );
        } );
    } );


    it( "determines the position of the content", () =>
    {
        const element_id = 'qcontainer_checkbox_foo';
        const group_content = getGroupContent();
        const content = group_content.querySelector( "#" + element_id );

        const expected_position = 1;

        const sut = new Sut(
            <ContextContent>content,
            null
        );

        const given = sut.getPosition();

        expect( given ).to.equal( expected_position );
    } );


    it( "determines the position of the sibling when not null", () =>
    {
        const element_id = 'qlabel_foo_bar_long_name';
        const sibling_id = 'qcontainer_foo_bar_long_name';
        const group_content = getGroupContent();
        const content = group_content.querySelector( "#" + element_id );
        const sibling = group_content.querySelector( "#" + sibling_id );

        const expected_position = 5;

        const sut = new Sut(
            <ContextContent>content,
            <ContextContent>sibling,
        );

        const given = sut.getPosition();

        expect( given ).to.equal( expected_position );
    } );
} );




function getGroupContent()
{
    // Mock group content
    var group = document.createElement( "dl" );

    group.innerHTML =
        '<dt id="qlabel_checkbox_foo">Foo</dt>' +
        '<dd id="qcontainer_checkbox_foo">' +
            '<input type="checkbox" id="q_checkbox_foo_n_0">' +
            '<input type="checkbox" id="q_checkbox_foo_y_0">' +
        '</dd>' +
        '<dd id="qcontainer_checkbox_no_label">' +
            '<input type="checkbox" id="q_checkbox_no_label_n_0">' +
        '</dd>' +
        '<dd id="qcontainer_subfield">' +
            '<select id="q_bi_risk_type_0" class="foo widget">' +
                '<option id="q_bar_subfield_0" value="Bar">Bar</option>' +
                '<option id="q_baz_subfield_0" value="Baz">Baz</option>' +
                '<option id="q_qux_subfield_0" value="Qux">Qux</option>' +
            '</select>' +
        '</dd>' +
        '<dt id="qlabel_foo_bar_long_name">Bar</dt>' +
        '<dd id="qcontainer_foo_bar_long_name">' +
            '<input type="text" id="foo_bar_0" >' +
        '</dd>' +
        '<dd id="qcontainer_subfield_single">' +
            '<select id="q_subfield_single_type_0" class="foo widget">' +
                '<option id="q_subfield_single_0" value="Foo">Foo</option>' +
            '</select>' +
        '</dd>' +
        '<dt id="qlabel_baz">Baz</dt>' +
        '<dd id="qcontainer_baz">' +
            '<input type="text" id="foo_baz_0">' +
        '</dd>' +
        '<dd id="qcontainer_select_element">' +
            '<select id="q_select_element_0">' +
                '<option value="bar" default="true">Existing option bar</option>'
            '</select>' +
        '</dd>';

    return group;
}