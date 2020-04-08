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
import { ContextContent, NullableContextContent } from "../../../src/ui/context/FieldContext";

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
            label: "parses content and finds container",
            element_id: 'foo_bar',
            expected:
                '<dd id="qcontainer_foo_bar_long_name">' +
                    '<input type="text" id="foo_bar" data-field-name="foo_bar">' +
                '</dd>'
        },
        {
            label: "parses content and finds container",
            element_id: 'baz_subfield',
            expected:
                '<dd id="qcontainer_subfield">' +
                    '<select id="q_subfield_0">' +
                        '<option id="q_bar_subfield_0" value="Bar">Bar</option>' +
                        '<option id="q_baz_subfield_0" value="Baz">Baz</option>' +
                        '<option id="q_qux_subfield_0" value="Qux">Quz</option>' +
                    '</select>' +
                '</dd>'
        },
        {
            label: "parses content and finds container",
            element_id: 'bar_subfield',
            expected:
                '<dd id="qcontainer_subfield">' +
                    '<select id="q_subfield_0">' +
                        '<option id="q_bar_subfield_0" value="Bar">Bar</option>' +
                        '<option id="q_baz_subfield_0" value="Baz">Baz</option>' +
                        '<option id="q_qux_subfield_0" value="Qux">Quz</option>' +
                    '</select>' +
                '</dd>'
        },
        {
            label: "parses content and finds container",
            element_id: 'very_deep_subfield',
            expected:
                '<dd id="qcontainer_very_deep_subfield">' +
                    '<div>' +
                        '<span>' +
                            '<ul>' +
                                '<li>' +
                                    '<select id="q_very_deep_subfield_0">' +
                                        '<option id="q_very_deep_subfield_0" value="Bar">Bar</option>' +
                                        '<option id="q_very_deep_subfield_0" value="Baz">Baz</option>' +
                                    '</select>' +
                                '</li>' +
                            '</ul>' +
                        '</span>' +
                    '</div>' +
                '</dd>'
        },
        {
            label: "parses content and finds table row",
            element_id: 'foo_row',
            expected:
                '<td>' +
                    '<input type="text" id="q_foo_row_0">' +
                '</td>'
        },
        {
            label: "parses content and finds table row",
            element_id: 'deep_table_row',
            expected:
                '<td>' +
                    '<div>' +
                        '<label>' +
                            '<input type="checkbox" data-field-name="deep_table_row"> No' +
                        '</label>' +
                    '</div>' +
                '</td>'
        },
        {
            label: "parses content and finds answer using data-field-name first",
            element_id: 'answer_foo_bar',
            expected:
                '<dd id="answer_foo_bar_value">' +
                    '<span id="answer_baz" data-field-name="answer_foo_bar">None</span>' +
                '</dd>'
        },
        {
            label: "parses content that is already a container",
            element_id: 'checkbox_foo',
            expected:
                '<dd id="qcontainer_checkbox_foo">' +
                    '<input type="checkbox" id="q_checkbox_foo_n_0">' +
                    '<input type="checkbox" id="q_checkbox_foo_y_0">' +
                '</dd>'
        },
        {
            label: "parses content that is already a container",
            element_id: 'checkbox_no_label',
            expected:
                '<dd id="qcontainer_checkbox_no_label">' +
                    '<input type="checkbox" id="q_checkbox_no_label_n_0">' +
                '</dd>'
        },
        {
            label: "parses content that is a label",
            element_id: 'only_label',
            expected: '<dt id="only_label">Only Label</dt>'
        },
    ].forEach( ( { label, element_id, expected } ) =>
    {
        it( label + " for " + element_id, () =>
        {
            const sut = new Sut();

            const given: NullableContextContent = sut.parse( element_id, getContentToParse() );

            expect( ( given?.outerHTML as string ) ).to.equal( expected );
        } );
    } );


    it( "returns null when content is not found", () =>
    {
        const sut = new Sut();

        const element_id = 'external_no_field_exists';

        const given: NullableContextContent = sut.parse( element_id, getContentToParse() );

        expect( given ).to.equal( null );
    } );


    [
        {
            element_id: 'qcontainer_checkbox_foo',
            expected_sibling: '<dt id="qlabel_checkbox_foo">Foo</dt>'
        },
        {
            element_id: 'qcontainer_foo_bar_long_name',
            expected_sibling: '<dt id="qlabel_foo_bar_long_name">Foo</dt>'
        },
    ].forEach( ( { element_id, expected_sibling } ) =>
    {
        it( "return sibling content for " + element_id, () =>
        {
            const group_content = getContentToParse();
            const content = <ContextContent>group_content.querySelector( "#" + element_id );

            const sut = new Sut();

            const sibling = sut.findSiblingContent( content );

            expect( ( sibling?.outerHTML as string ) ).to.equal( expected_sibling );
        } );
    } );


    it( "returns null when sibling is not found", () =>
    {
        const sut = new Sut();

        const element_id = 'qcontainer_checkbox_no_label';

        const group_content = getContentToParse();
        const content = <ContextContent>group_content.querySelector( "#" + element_id );

        const sibling = sut.findSiblingContent( content );

        expect( sibling ).to.equal( null );
    } );
} );


function getContentToParse()
{
    var elem = document.createElement( "div" );

    elem.innerHTML = '<dl class="">' +
        '<dt id="only_label">Only Label</dt>' +
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
            '<input type="text" id="foo_bar" data-field-name="foo_bar">' +
        '</dd>' +
        '<dt id="answer_foo_bar">Answer Field</dt>' +
        '<dd id="answer_foo_bar_value">' +
            '<span id="answer_baz" data-field-name="answer_foo_bar">None</span>' +
        '</dd>' +
        '<dt id="qlabel_subfield" >Foo</dt>' +
        '<dd id="qcontainer_subfield">' +
            '<select id="q_subfield_0">' +
                '<option id="q_bar_subfield_0" value="Bar">Bar</option>' +
                '<option id="q_baz_subfield_0" value="Baz">Baz</option>' +
                '<option id="q_qux_subfield_0" value="Qux">Quz</option>' +
            '</select>' +
        '</dd>' +
        '<dd id="qcontainer_very_deep_subfield">' +
            '<div>' +
                '<span>' +
                    '<ul>' +
                        '<li>' +
                            '<select id="q_very_deep_subfield_0">' +
                                '<option id="q_very_deep_subfield_0" value="Bar">Bar</option>' +
                                '<option id="q_very_deep_subfield_0" value="Baz">Baz</option>' +
                            '</select>' +
                        '</li>' +
                    '</ul>' +
                '</span>' +
           '</div>' +
        '</dd>' +
    '</dl>' +
    '<table>' +
        '<tr "id="q_deep_table_row_0">' +
            '<td>' +
                '<input type="text" id="q_foo_row_0">' +
            '</td>' +
            '<td>' +
                '<div>' +
                    '<label>' +
                        '<input type="checkbox" data-field-name="deep_table_row"> No' +
                    '</label>' +
                '</div>' +
            '</td>' +
        '</tr>' +
    '</table>';

    return elem;
}