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

import { FieldContext as Sut, ContextContent } from "../../../src/ui/context/FieldContext";
import { PositiveInteger } from "../../../src/numeric";

import { expect } from 'chai';


before(function () {
    this.jsdom = require('jsdom-global')()
})

after(function () {
    this.jsdom()
})

describe( "FieldContext", () =>
{
    [
        {
            element_id: 'qcontainer_checkbox_foo',
            position: 1,
            expected: '<dt id="qlabel_checkbox_foo">Foo</dt>'
        },
        {
            element_id: 'qcontainer_foo_bar_long_name',
            position: 2,
            expected: '<dt id="qlabel_foo_bar_long_name">Bar</dt>'
        },
    ].forEach( ( { element_id, position, expected } ) =>
    {
        it( "sets sibling content for " + element_id, () =>
        {
            const group_content = getGroupContent();
            const content = group_content.querySelector( "#" + element_id );
            const sut = new Sut(
                '',
                <ContextContent>content,
                <PositiveInteger>position
            );

            const given = <ContextContent>sut.getSiblingContent();

            expect( ( given?.outerHTML as string ) ).to.equal( expected );
        } );
    } );


    [
        {
            element_id: 'qcontainer_checkbox_no_label',
        },
        {
            element_id: 'container_does_not_exist',
        },
    ].forEach( ( { element_id } ) =>
    {
        it( "sibling is null when label does not exist for " + element_id, () =>
        {
            const group_content = getGroupContent();
            const content = group_content.querySelector( "#" + element_id );
            const sut = new Sut( content, <PositiveInteger>0 );

            const given: ContextContent = sut.getSiblingContent();

            expect( given ).to.equal( null );
        } );
    } );

} );


function getGroupContent()
{
    // Mock group content
    var group = document.createElement( "div" );

    group.innerHTML = '<dl class="">' +
        '<dt id="qlabel_checkbox_foo" >Foo</dt>' +
        '<dd id="qcontainer_checkbox_foo">' +
            '<input type="checkbox" id="q_checkbox_foo_n_0">' +
            '<input type="checkbox" id="q_checkbox_foo_y_0">' +
        '</dd>' +
        '<dd id="qcontainer_checkbox_no_label">' +
            '<input type="checkbox" id="q_checkbox_no_label_n_0">' +
        '</dd>' +
        '<dt id="qlabel_foo_bar_long_name" >Bar</dt>' +
        '<dd id="qcontainer_foo_bar_long_name">' +
            '<input type="text" id="foo_bar" >' +
        '</dd>' +
        '<select id="q_bi_risk_type_0">' +
            '<option id="q_foo_subfield_0" value="Bar">Foo</option>' +
        '</select>' +
    '</dl>';

    return group;
}