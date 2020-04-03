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

import { FieldContextFactory as Sut } from "../../../src/ui/context/FieldContextFactory";
import { FieldContext, ContextContent, NullableContextContent } from "../../../src/ui/context/FieldContext";
import { FieldContextStore } from "../../../src/ui/context/FieldContextStore";
import { PositiveInteger } from "../../../src/numeric";

import { expect } from 'chai';



describe( "FieldContextFactory", () =>
{
    it( "creates new FieldContext", () =>
    {
        const sut = new Sut( document );

        const parent = document.createElement( "div" );
        parent.innerHTML =
            '<dl class="">' +
                '<dt id="qlabel_checkbox_foo" >Foo</dt>' +
                '<dd id="qcontainer_checkbox_foo">' +
                    '<input type="checkbox" id="q_checkbox_foo_n_0">' +
                '</dd>' +
            '</dl>';

        const content = parent.querySelector( "#qcontainer_checkbox_foo" );
        const sibling = parent.querySelector( "#qlabel_checkbox_foo" );

        const given = sut.create(
            'foo',
            <PositiveInteger>0,
            <ContextContent>content,
            <NullableContextContent>sibling
        );

        expect( given ).to.be.instanceOf( FieldContext );
    } );


    it( "creates new FieldContextStore", () =>
    {
        const sut = new Sut( document );

        const parent = document.createElement( "div" );
        parent.innerHTML =
            '<dl class="">' +
                '<dt id="qlabel_checkbox_foo" >Foo</dt>' +
                '<dd id="qcontainer_checkbox_foo">' +
                    '<input type="checkbox" id="q_checkbox_foo_n_0">' +
                '</dd>' +
            '</dl>';

        const content = parent.querySelector( "#qcontainer_checkbox_foo" );
        const sibling = parent.querySelector( "#qlabel_checkbox_foo" );

        const given = sut.createStore(
            <ContextContent>content,
            <NullableContextContent>sibling
        );

        expect( given ).to.be.instanceOf( FieldContextStore );
    } );
} );

