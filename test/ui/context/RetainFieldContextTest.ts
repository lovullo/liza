/**
 * Test case for RetainFieldContext
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

import { RetainFieldContext as Sut } from "../../../src/ui/context/RetainFieldContext";
import { ContextContent, NullableContextContent } from "../../../src/ui/context/FieldContext";
import { expect } from "chai";

before(function () {
    this.jsdom = require('jsdom-global')()
})

after(function () {
    this.jsdom()
})

describe( "RetainFieldContext", () =>
{

    [
        {
            label: 'show removes hidden class for content',
            element_id: 'qcontainer_field',
            sibling_id: 'not_found',
            expected:
                '<dd id="qcontainer_field" class="">' +
                    '<select id="q_field_0" class="foo i">' +
                        '<option id="q_bar_field_0" value="Bar">Bar</option>' +
                    '</select>' +
                '</dd>',
        },
        {
            label: 'show removes hidden class for sibling',
            element_id: 'qcontainer_field',
            sibling_id: 'qlabel_field',
            expected:
                '<dt id="qlabel_field" class="">' +
                    'Foo Bar' +
                '</dt>',
        },
    ].forEach( ( { label, element_id, sibling_id, expected } ) => {
        it ( label, () =>
        {
            const group = getHiddenGroupContent();

            const content = group.querySelector( "#" + element_id );
            const sibling = group.querySelector( "#" + sibling_id );
            const sut = new Sut(
                document,
                'q_field_0',
                <ContextContent>content,
                <NullableContextContent>sibling
            );

            const to = document.createElement("dl");

            sut.show( to, null );

            const given = sut.getFirstOfContentSet();
            expect( given.outerHTML ).to.equal( expected );
            expect( sut.isVisible() ).to.be.true;

        } )
    } );

    [
        {
            label: 'hide adds hidden class for content',
            element_id: 'qcontainer_field',
            sibling_id: 'not_found',
            expected:
                '<dd id="qcontainer_field" class="hidden">' +
                    '<select id="q_field_0" class="foo i">' +
                        '<option id="q_bar_field_0" value="Bar">Bar</option>' +
                    '</select>' +
                '</dd>',
        },
        {
            label: 'hide adds hidden class for sibling',
            element_id: 'qcontainer_field',
            sibling_id: 'qlabel_field',
            expected:
                '<dt id="qlabel_field" class="hidden">' +
                    'Foo Bar' +
                '</dt>',
        },
    ].forEach( ( { label, element_id, sibling_id, expected } ) => {
        it ( label, () =>
        {
            const group = getVisibleGroupContent();

            const content = group.querySelector( "#" + element_id );
            const sibling = group.querySelector( "#" + sibling_id );
            const sut = new Sut(
                document,
                'q_field_0',
                <ContextContent>content,
                <NullableContextContent>sibling
            );

            sut.hide();

            const given = sut.getFirstOfContentSet();
            expect( given.outerHTML ).to.equal( expected );
            expect( sut.isVisible() ).to.be.false;
        } )
    } );


    it( 'shows field and attaches to DOM when show is called', () => {
        const group = getHiddenGroupContent();
        const content = group.querySelector( "#q_field_0" );

        const sut = new Sut(
            document,
            'q_field_0',
            <ContextContent>content
        );

        const to = document.createElement("dl");
        sut.show( to, null );

        expect( sut.isAttached() ).to.be.true;
        expect( sut.isVisible() ).to.be.true;
    } );


    it( 'hides field and attaches to DOM when hide is called', () => {
        const group = getVisibleGroupContent();
        const content = group.querySelector( "#q_field_0" );

        const sut = new Sut(
            document,
            'q_field_0',
            <ContextContent>content
        );

        sut.hide();

        // element should be attached now but still not visible
        expect( sut.isAttached() ).to.be.true;
        expect( sut.isVisible() ).to.be.false;
    } );


} );



function getHiddenGroupContent()
{
    // Mock group content
    var group = document.createElement( "dl" );

    group.innerHTML =
        '<dt id="qlabel_field" class="hidden">' +
            'Foo Bar' +
        '</dt>' +
        '<dd id="qcontainer_field" class="hidden">' +
            '<select id="q_field_0" class="foo i">' +
                '<option id="q_bar_field_0" value="Bar">Bar</option>' +
            '</select>' +
        '</dd>';

    return group;
}



function getVisibleGroupContent()
{
    // Mock group content
    var group = document.createElement( "dl" );

    group.innerHTML =
        '<dt id="qlabel_field">' +
            'Foo Bar' +
        '</dt>' +
        '<dd id="qcontainer_field">' +
            '<select id="q_field_0" class="foo i">' +
                '<option id="q_bar_field_0" value="Bar">Bar</option>' +
            '</select>' +
        '</dd>';

    return group;
}
