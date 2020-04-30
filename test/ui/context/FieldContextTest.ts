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

import { FieldContext as Sut, ContextContent, NullableContextContent } from "../../../src/ui/context/FieldContext";
import { FieldStyler } from "../../../src/ui/context/styler/FieldStyler";

import { expect } from 'chai';


before(function () {
    this.jsdom = require('jsdom-global')()
})

after(function () {
    this.jsdom()
})

describe( "FieldContext", () =>
{
    it( "sibling is null when label does not exist", () =>
    {
        const element_id = 'qcontainer_checkbox_no_label';
        const group_content = getGroupContent();
        const content = group_content.querySelector( "#" + element_id );
        const sut = new Sut(
            document,
            getStylerStub(),
            element_id,
            <ContextContent>content
        );

        const expected_content = '<dd id="qcontainer_checkbox_no_label">' +
                '<input type="checkbox" id="q_checkbox_no_label_n_0">' +
            '</dd>';

        const given = <ContextContent>sut.getFirstOfContentSet();

        expect( ( given?.outerHTML as string ) ).to.equal( expected_content );
    } );


    it( 'gets element ID', () =>
    {
        const element_id = 'qcontainer_checkbox_no_label';
        const group_content = getGroupContent();
        const content = group_content.querySelector( "#" + element_id );
        const sut = new Sut(
            document,
            getStylerStub(),
            element_id,
            <ContextContent>content
        );

        expect( sut.getElementId() ).to.equal( element_id );
    } );


    [
        {
            label: 'attaches text field to DOM with next element',
            next_element: 'div',
            element_id: 'qcontainer_baz',
            sibling_id: 'qlabel_baz',
            expected:
                '<dl>' +
                    '<dt id="qlabel_baz">Baz</dt>' +
                    '<dd id="qcontainer_baz">' +
                        '<input type="text" id="foo_baz_0">' +
                    '</dd>' +
                    '<div></div>' +
                '</dl>'
        },
        {
            label: 'attaches text field to DOM w/out next element',
            next_element: null,
            element_id: 'qcontainer_baz',
            sibling_id: 'qlabel_baz',
            expected:
                '<dl>' +
                    '<dt id="qlabel_baz">Baz</dt>' +
                    '<dd id="qcontainer_baz">' +
                        '<input type="text" id="foo_baz_0">' +
                    '</dd>' +
                '</dl>'
        },
        {
            label: 'attaches checkbox field to DOM with next element',
            next_element: 'div',
            element_id: 'qcontainer_checkbox_foo',
            sibling_id: 'qlabel_checkbox_foo',
            expected:
                '<dl>' +
                    '<dt id="qlabel_checkbox_foo">Foo</dt>' +
                    '<dd id="qcontainer_checkbox_foo">' +
                    '<input type="checkbox" id="q_checkbox_foo_n_0">' +
                    '<input type="checkbox" id="q_checkbox_foo_y_0">' +
                    '</dd>' +
                    '<div></div>' +
                '</dl>'
        },
    ].forEach( ( { label, next_element, element_id, sibling_id, expected } ) => {
        it( label, () => {

            const group_content = getGroupContent();
            const content = group_content.querySelector( "#" + element_id );
            const sibling = group_content.querySelector( "#" + sibling_id );
            const sut = new Sut(
                document,
                getStylerStub(),
                element_id,
                <ContextContent>content,
                <NullableContextContent>sibling
            );

            const to_content = document.createElement("dl");
            let dummy_next_element = null;
            if ( next_element !== null )
            {
                dummy_next_element = document.createElement( next_element );
                to_content.appendChild( dummy_next_element );
            }

            sut.show( to_content, dummy_next_element );
            expect( to_content.outerHTML ).to.equal( expected );
        } )
    } );


    it( 'detaches field and sibling from DOM', () => {

        const from_content = getGroupContent();
        let content = from_content.querySelector( "#qcontainer_checkbox_foo" );
        let sibling = from_content.querySelector( "#qlabel_checkbox_foo" );
        const sut = new Sut(
            document,
            getStylerStub(),
            'q_checkbox_foo_n_0',
            <ContextContent>content,
            <NullableContextContent>sibling
        );

        expect( from_content.contains( content ) ).to.be.true;
        expect( from_content.contains( sibling ) ).to.be.true;
        sut.hide();
        expect( from_content.contains( content ) ).to.be.false;
        expect( from_content.contains( sibling ) ).to.be.false;
    } )


    it( 'detaches field from DOM when attached', () => {

        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );
        from_content.appendChild( child );
        const sut = new Sut(
            document,
            getStylerStub(),
            'foo',
            <ContextContent>child
        );

        sut.hide();
        expect( from_content.contains( child ) ).to.be.false;
        expect( from_content.outerHTML).to.equal( '<dl></dl>' );
    } )


    it( 'does not detach field from DOM after already detached', () => {

        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );
        from_content.appendChild( child );

        const sut = new Sut(
            document,
            getStylerStub(),
            'foo',
            <ContextContent>child
        );

        // now simulate detaching
        from_content.removeChild( child );

        sut.hide();
        expect( from_content.contains( child ) ).to.be.false;
        expect( from_content.outerHTML).to.equal( '<dl></dl>' );
    } )


    it( 'isAttached and isVisible is false when not attached to DOM', () => {
        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );
        from_content.appendChild( child );

        const sut = new Sut(
            document,
            getStylerStub(),
            'foo',
            <ContextContent>child
        );

        // now detach
        sut.hide();

        expect( sut.isAttached() ).to.be.false;

        expect( sut.isVisible() ).to.be.false;
    } );


    it( 'isAttached and isVisible is true when attached to DOM', () => {
        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );
        from_content.appendChild( child );

        const sut = new Sut(
            document,
            getStylerStub(),
            'foo',
            <ContextContent>child
        );

        const to_content = document.createElement("dl");

        sut.show( to_content, null );

        expect( sut.isAttached() ).to.be.true;

        expect( sut.isVisible() ).to.be.true;
    } );


    it( 'getFirstOfContentSet returns the field content', () => {
        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );
        from_content.appendChild( child );

        const sut = new Sut(
            document,
            getStylerStub(),
            'foo',
            <ContextContent>child
        );

        expect( sut.getFirstOfContentSet() ).to.equal( child );
    } );


    it( 'getFirstOfContentSet returns the sibling if exists', () => {
        const group_content = getGroupContent();
        let content = group_content.querySelector( "#qcontainer_checkbox_foo" );
        let sibling = group_content.querySelector( "#qlabel_checkbox_foo" );

        const sut = new Sut(
            document,
            getStylerStub(),
            'q_checkbox_foo_n_0',
            <ContextContent>content,
            <NullableContextContent>sibling
        );

        expect( sut.getFirstOfContentSet() ).to.equal( sibling );
    } );


    [
        {
            label: 'setOptions sets new value',
            options: [
                { value: 0, label: 'Foo goes here', label_id: 'foo_label' },
                { value: 'bar', label: 'Bar goes here', label_id: 'bar_label' },
                { value: 'baz', label: 'Baz goes here', label_id: 'baz_label' },
            ],
            value: 'baz',
            expected: '<dd id="qcontainer_select_element">' +
                '<select id="q_select_element_0">' +
                    '<option value="0">Foo goes here</option>' +
                    '<option value="bar">Bar goes here</option>' +
                    '<option value="baz">Baz goes here</option>' +
                '</select>' +
                '</dd>',
            expected_val: 'baz'
        },
        {
            label: 'setOptions sets previous value',
            options: [
                { value: 'foo', label: 'Foo goes here', label_id: 'foo_label' },
                { value: 'bar', label: 'Bar goes here', label_id: 'bar_label' },
            ],
            value: undefined,
            expected: '<dd id="qcontainer_select_element">' +
                '<select id="q_select_element_0">' +
                    '<option value="foo">Foo goes here</option>' +
                    '<option value="bar">Bar goes here</option>' +
                '</select>' +
                '</dd>',
            expected_val: 'bar'
        },
    ].forEach( ( { label, options, value, expected, expected_val } ) => {
        it( label, () => {

            const group_content = getGroupContent();
            const content = group_content.querySelector( "#qcontainer_select_element" );
            const sut = new Sut(
                document,
                getStylerStub(),
                'q_select_element_0',
                <ContextContent>content
            );

            sut.setOptions( options, value );

            const final_content = sut.getFirstOfContentSet();
            const selected_option = <HTMLSelectElement>final_content.querySelector( '#q_select_element_0' );
            expect( final_content.outerHTML ).to.equal( expected );
            expect( selected_option?.value ).to.equal( expected_val );
        } )
    } );

} );


function getStylerStub()
{
    return <FieldStyler>{
        'setValue': ( _: any, __: any ) => {},
    };
}

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
            '<input type="text" id="foo_bar_0">' +
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