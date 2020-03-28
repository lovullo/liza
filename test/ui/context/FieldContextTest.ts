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
            index: 10,
            position: 1,
            expected_content: '<dd id="qcontainer_checkbox_foo">' +
                    '<input type="checkbox" id="q_checkbox_foo_n_10" data-index="10">' +
                    '<input type="checkbox" id="q_checkbox_foo_y_10" data-index="10">' +
                '</dd>',
        },
        {
            element_id: 'qcontainer_foo_bar_long_name',
            index: 324,
            position: 2,
            expected_content: '<dd id="qcontainer_foo_bar_long_name">' +
                    '<input type="text" id="foo_bar_324" data-index="324">' +
                '</dd>',
        },
    ].forEach( ( { element_id, index, position, expected_content } ) =>
    {
        it( "sets element indexes for " + element_id, () =>
        {
            const group_content = getGroupContent();
            const content = group_content.querySelector( "#" + element_id );

            const sut = new Sut(
                '',
                <PositiveInteger>index,
                <PositiveInteger>position,
                <ContextContent>content
            );

            const content_modified = <ContextContent>sut.getFirstOfContentSet();

            expect( ( content_modified?.outerHTML as string ) ).to.equal( expected_content );
        } );
    } );


    [
        {
            element_id: 'qcontainer_checkbox_foo',
            index: 0,
            position: 1,
            expected_content: '<dd id="qcontainer_checkbox_foo">' +
                    '<input type="checkbox" id="q_checkbox_foo_n_0" data-index="0">' +
                    '<input type="checkbox" id="q_checkbox_foo_y_0" data-index="0">' +
                '</dd>',
            expected_sibling: '<dt id="qlabel_checkbox_foo">Foo</dt>'
        },
        {
            element_id: 'qcontainer_foo_bar_long_name',
            index: 0,
            position: 2,
            expected_content: '<dd id="qcontainer_foo_bar_long_name">' +
                    '<input type="text" id="foo_bar_0" data-index="0">' +
                '</dd>',
            expected_sibling: '<dt id="qlabel_foo_bar_long_name">Bar</dt>'
        },
    ].forEach( ( { element_id, index, position, expected_content, expected_sibling } ) =>
    {
        it( "sets sibling content and cloned content with element indexes for " + element_id, () =>
        {
            const group_content = getGroupContent();
            const content = group_content.querySelector( "#" + element_id );

            const sut = new Sut(
                '',
                <PositiveInteger>index,
                <PositiveInteger>position,
                <ContextContent>content
            );

            const sibling       = <ContextContent>sut.getSiblingContent();
            const sibling_clone = <ContextContent>sut.getSiblingContentClone();
            const content_clone = <ContextContent>sut.getContentClone();

            expect( ( sibling?.outerHTML as string ) ).to.equal( expected_sibling );
            expect( ( sibling_clone?.outerHTML as string ) ).to.equal( expected_sibling );
            expect( ( content_clone?.outerHTML as string ) ).to.equal( expected_content );
        } );
    } );

    it( "sibling is null when label does not exist", () =>
    {
        const element_id = 'qcontainer_checkbox_no_label';
        const group_content = getGroupContent();
        const content = group_content.querySelector( "#" + element_id );
        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>content
        );

        const given = <ContextContent>sut.getSiblingContent();

        expect( given ).to.equal( null );
    } );


    it( 'gets field name', () =>
    {
        const element_id = 'qcontainer_checkbox_no_label';
        const group_content = getGroupContent();
        const content = group_content.querySelector( "#" + element_id );
        const name = 'foo';
        const sut = new Sut(
            name,
            <PositiveInteger>55,
            <PositiveInteger>0,
            <ContextContent>content
        );

        expect( sut.getName() ).to.equal( name );
    } );


    it( 'gets field index', () =>
    {
        const element_id = 'qcontainer_checkbox_no_label';
        const group_content = getGroupContent();
        const content = group_content.querySelector( "#" + element_id );
        const index = <PositiveInteger>4;
        const sut = new Sut(
            'baz',
            index,
            <PositiveInteger>0,
            <ContextContent>content
        );

        expect( sut.getIndex() ).to.equal( index );
    } );


    [
        {
            label: 'attaches text field to DOM with next element',
            next_element: 'div',
            element_id: 'qcontainer_baz',
            expected:
                '<dl>' +
                    '<dt id="qlabel_baz">Baz</dt>' +
                    '<dd id="qcontainer_baz">' +
                        '<input type="text" id="foo_baz_0" data-index="0">' +
                    '</dd>' +
                    '<div></div>' +
                '</dl>'
        },
        {
            label: 'attaches text field to DOM w/out next element',
            next_element: null,
            element_id: 'qcontainer_baz',
            expected:
                '<dl>' +
                    '<dt id="qlabel_baz">Baz</dt>' +
                    '<dd id="qcontainer_baz">' +
                        '<input type="text" id="foo_baz_0" data-index="0">' +
                    '</dd>' +
                '</dl>'
        },
        {
            label: 'attaches checkbox field to DOM with next element',
            next_element: 'div',
            element_id: 'qcontainer_checkbox_foo',
            expected:
                '<dl>' +
                    '<dt id="qlabel_checkbox_foo">Foo</dt>' +
                    '<dd id="qcontainer_checkbox_foo">' +
                    '<input type="checkbox" id="q_checkbox_foo_n_0" data-index="0">' +
                    '<input type="checkbox" id="q_checkbox_foo_y_0" data-index="0">' +
                    '</dd>' +
                    '<div></div>' +
                '</dl>'
        }
    ].forEach( ( { label, next_element, element_id, expected } ) => {
        it( label, () => {

            const group_content = getGroupContent();
            const content = group_content.querySelector( "#" + element_id );
            const name = 'foo';
            const sut = new Sut(
                name,
                <PositiveInteger>0,
                <PositiveInteger>0,
                <ContextContent>content
            );

            const to_content = document.createElement("dl");
            let dummy_next_element = null;
            if ( next_element !== null )
            {
                dummy_next_element = document.createElement( next_element );
                to_content.appendChild( dummy_next_element );
            }

            sut.attach( to_content, dummy_next_element );
            expect( to_content.outerHTML ).to.equal( expected );
        } )
    } );


    it( 'detaches field and sibling from DOM', () => {

        const from_content = getGroupContent();
        let content = from_content.querySelector( "#qcontainer_checkbox_foo" );
        let sibling = from_content.querySelector( "#qlabel_checkbox_foo" );
        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>content
        );

        expect( from_content.contains( content ) ).to.be.true;
        expect( from_content.contains( sibling ) ).to.be.true;
        sut.detach();
        expect( from_content.contains( content ) ).to.be.false;
        expect( from_content.contains( sibling ) ).to.be.false;
    } )


    it( 'detaches field from DOM when attached', () => {

        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );
        from_content.appendChild( child );
        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>child
        );

        sut.detach();
        expect( from_content.contains( child ) ).to.be.false;
        expect( from_content.outerHTML).to.equal( '<dl></dl>' );
    } )


    it( 'does not detach field from DOM after already detached', () => {

        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );
        from_content.appendChild( child );

        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>child
        );

        // now simulate detaching
        from_content.removeChild( child );

        sut.detach();
        expect( from_content.contains( child ) ).to.be.false;
        expect( from_content.outerHTML).to.equal( '<dl></dl>' );
    } )


    it( 'isAttached is false when not attached to DOM', () => {
        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );
        from_content.appendChild( child );

        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>child
        );

        // now detach
        sut.detach();

        expect( sut.isAttached() ).to.be.false;
    } );


    it( 'isAttached is true when attached to DOM', () => {
        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );
        from_content.appendChild( child );

        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>child
        );

        expect( sut.isAttached() ).to.be.true;
    } );


    it( 'getFirstOfContentSet returns the field content', () => {
        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );
        from_content.appendChild( child );

        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>child
        );

        expect( sut.getFirstOfContentSet() ).to.equal( child );
    } );


    it( 'getFirstOfContentSet returns the sibling if exists', () => {
        const group_content = getGroupContent();
        let content = group_content.querySelector( "#qcontainer_checkbox_foo" );
        let sibling = group_content.querySelector( "#qlabel_checkbox_foo" );

        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>content
        );

        expect( sut.getFirstOfContentSet() ).to.equal( sibling );
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
        '<dt id="qlabel_foo_bar_long_name">Bar</dt>' +
        '<dd id="qcontainer_foo_bar_long_name">' +
            '<input type="text" id="foo_bar_0" >' +
        '</dd>' +
        '<dt id="qlabel_subfield" >Foo</dt>' +
        '<dd id="qcontainer_subfield">' +
            '<select id="q_bi_risk_type_0">' +
                '<option id="q_bar_subfield_0" value="Bar">Bar</option>' +
                '<option id="q_baz_subfield_0" value="Baz">Baz</option>' +
                '<option id="q_qux_subfield_0" value="Qux">Quz</option>' +
            '</select>' +
        '</dd>' +
        '<dt id="qlabel_baz">Baz</dt>' +
        '<dd id="qcontainer_baz">' +
            '<input type="text" id="foo_baz_0">' +
        '</dd>';

    return group;
}