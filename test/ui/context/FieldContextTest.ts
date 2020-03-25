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
        it( "sets sibling content and cloned content for " + element_id, () =>
        {
            const group_content = getGroupContent();
            const content = group_content.querySelector( "#" + element_id );
            const content_string = ( content?.outerHTML as string );
            const sut = new Sut(
                '',
                <PositiveInteger>0,
                <PositiveInteger>position,
                <ContextContent>content
            );

            const sibling       = <ContextContent>sut.getSiblingContent();
            const sibling_clone = <ContextContent>sut.getSiblingContentClone();
            const content_clone = <ContextContent>sut.getContentClone();

            expect( ( sibling?.outerHTML as string ) ).to.equal( expected );
            expect( ( sibling_clone?.outerHTML as string ) ).to.equal( expected );
            expect( ( content_clone?.outerHTML as string ) ).to.equal( content_string );
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
        const group_content = getGroupContent();
        const content = group_content.querySelector( "#foo_bar" );
        const name = 'foo';
        const sut = new Sut(
            name,
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>content
        );

        expect( sut.getName() ).to.equal( name );
    } );


    it( 'gets field index', () =>
    {
        const group_content = getGroupContent();
        const content = group_content.querySelector( "#foo_bar" );
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
            label: 'attaches field to DOM with previous element',
            prev_element: 'div',
            expected: '<dl><input type="text" id="foo_bar"><div></div></dl>'
        },
        {
            label: 'attaches field to DOM w/out previous element',
            prev_element: null,
            expected: '<dl><input type="text" id="foo_bar"></dl>'
        },
    ].forEach( ( { label, prev_element, expected } ) => {
        it( label, () => {

            const group_content = getGroupContent();
            const content = group_content.querySelector("#foo_bar");
            const name = 'foo';
            const sut = new Sut(
                name,
                <PositiveInteger>0,
                <PositiveInteger>0,
                <ContextContent>content
            );

            const to_content = document.createElement("dl");
            let dummy_prev_element = null;
            if ( prev_element !== null )
            {
                dummy_prev_element = document.createElement( prev_element );
                to_content.appendChild( dummy_prev_element );
            }

            sut.attach( to_content, dummy_prev_element );
            expect( to_content.contains( content ) ).to.be.true;
            expect( to_content.outerHTML ).to.equal( expected );
        } )
    } );


    [
        {
            label: 'attaches field and sibling to DOM',
            prev_element: 'div',
            element_id: 'qcontainer_checkbox_foo',
            expected:
                '<dl>' +
                    '<dt id="qlabel_checkbox_foo">Foo</dt>' +
                    '<dd id="qcontainer_checkbox_foo">' +
                    '<input type="checkbox" id="q_checkbox_foo_n_0">' +
                    '<input type="checkbox" id="q_checkbox_foo_y_0">' +
                    '</dd>' +
                    '<div></div>' +
                '</dl>'
        }
    ].forEach( ( {
                     label,
                     prev_element,
                     element_id,
                     expected } ) => {
        it( label, () => {

            const group_content = getGroupContent();
            let content = group_content.querySelector( "#" + element_id );
            const name = 'foo';
            const sut = new Sut(
                name,
                <PositiveInteger>0,
                <PositiveInteger>0,
                <ContextContent>content
            );

            const dummy_parent = document.createElement("dl");
            let dummy_prev_element = null;
            if ( prev_element !== null )
            {
                dummy_prev_element = document.createElement( prev_element );
                dummy_parent.appendChild( dummy_prev_element );
            }

            sut.attach( dummy_parent, dummy_prev_element );
            expect( dummy_parent.contains( content ) ).to.be.true;
            expect( dummy_parent.outerHTML ).to.equal( expected );
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
        sut.detach( from_content );
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

        sut.detach( from_content );
        expect( from_content.contains( child ) ).to.be.false;
        expect( from_content.outerHTML).to.equal( '<dl></dl>' );
    } )


    it( 'detaches field from DOM when not attached', () => {

        // do not append the child
        const from_content = document.createElement("dl");
        const child = document.createElement( "div" );

        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>child
        );

        sut.detach( from_content );
        expect( from_content.contains( child ) ).to.be.false;
        expect( from_content.outerHTML).to.equal( '<dl></dl>' );
    } )


    it( 'detaches field from DOM when attached to different parent', () => {

        // do not append the child
        const from_content = document.createElement("dl");

        const from_another_content = document.createElement("span");
        const child = document.createElement( "div" );
        from_another_content.appendChild( child );

        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>child
        );

        sut.detach( from_content );
        expect( from_content.contains( child ) ).to.be.false;
        expect( from_content.outerHTML).to.equal( '<dl></dl>' );
    } ),


    it( 'isAttached is false when not attached to DOM', () => {
        // do not append the child
        const child = document.createElement( "div" );
        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>child
        );
        expect( sut.isAttached() ).to.be.false;
    } );


    it( 'isAttached is true when attached to DOM', () => {
        const parent = document.createElement("dl");
        const child = document.createElement( "div" );

        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>child
        );

        sut.attach( parent, null );
        expect( sut.isAttached() ).to.be.true;
    } );


    it( 'getFirstOfContentSet returns the field content', () => {
        const content = document.createElement( "div" );

        const sut = new Sut(
            '',
            <PositiveInteger>0,
            <PositiveInteger>0,
            <ContextContent>content
        );

        expect( sut.getFirstOfContentSet() ).to.equal( content );
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
        '</select>';

    return group;
}