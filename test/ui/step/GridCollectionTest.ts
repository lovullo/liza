/**
 * Test case for GridCollection
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

const Group = require( "../../../src/ui/group/GridGroupUi" );
const sinon = require( 'sinon' );

import { AncestorAwareStyler } from "../../../src/ui/styler/AncestorAwareStyler";
import { GridCollection as Sut, GroupList } from "../../../src/ui/step/GridCollection";
import { GroupUi } from "../../../src/ui/group/GroupUi";
import { expect } from 'chai';

import {
    createSut as createGroup,
    createQuote,
    createBoxContent
} from "../group/CommonResources";



before(function () {
    this.jsdom = require( 'jsdom-global' )();
});

after(function () {
    this.jsdom();
});

describe( "ui.step.GridCollection", () =>
{
    describe ( "visit", () =>
    {
        [
            {
                columns: 1,
                input: [ "column1" ],
                expected_class_added : "col-1",
                expected_class_removed: "col-99",
            },
            {
                columns: 2,
                input: [ "column1", "column2", "column1", "column2" ],
                expected_class_added : "col-2",
                expected_class_removed: "col-0",
            },
            {
                columns: 3,
                input: [ "column1", "column2", "column3" ],
                expected_class_added : "col-3",
                expected_class_removed: "col-99",
            },
            {
                columns: 4,
                input: [ "column1", "column2", "column3", "column4" ],
                expected_class_added : "col-4",
                expected_class_removed: "col-99",
            },
        ].forEach( data =>
        {
            let {
                columns,
                input,
                expected_class_added,
                expected_class_removed
            } = data;

            it( `sets the css class for ${columns} columns`, () =>
            {
                const groups = input.map( ( xType: string, index: number ) =>
                {
                    let boxContent = createBoxContent();
                    boxContent.classList.contains = sinon.stub().returns( true );

                    let group = createGroup( Group, { content: boxContent } );
                    group.init( createQuote() );

                    group.getGroupId = () => index.toString();
                    group.isVisible = (): boolean => true;
                    group.getXType = (): string => xType;

                    return group;
                } );

                const content = createHtmlElement();
                let add_column_class = '';
                let actual_column_removed: string = '';

                sinon.stub( content, "querySelectorAll").callsFake( () =>
                {
                    return groups.map( ( _child, index: number ) =>
                    {
                        const elem = createHtmlElement();
                        elem.getAttribute = () => index.toString();
                        return elem;
                    } );
                } );

                content.classList.contains = sinon.stub().returns( false );
                content.classList.add( expected_class_removed );

                content.classList.add = ( classname: string ) => {
                    add_column_class = classname;
                };

                content.classList.remove = ( class_name: string ) => {
                    actual_column_removed = class_name;
                };

                const sut = new Sut( content, convertToGroupList( groups ), getStylerStub() );

                sut.visit();

                expect( add_column_class ).to.equal( expected_class_added );
                expect( actual_column_removed ).to.equal( expected_class_removed );
            } )
        } );


        it( `sets the css class when some columns aren't visible`, () => {
            [
                // One column that is not visible
                {
                    input: [ "column1" ],
                    visibility: [ false ],
                    expected_class_added : "col-0",
                },
                // Four columns but only two are visible
                {
                    input: [ "column1", "column2", "column3", "column4" ],
                    visibility: [ true, false, false, true ],
                    expected_class_added : "col-2",
                }
            ].forEach( data =>
            {
                let { input, visibility, expected_class_added } = data;

                const groups = input.map( ( xType: string, index: number ) =>
                {
                    let boxContent = createBoxContent();
                    boxContent.classList.contains = sinon.stub().returns( true );

                    let group = createGroup( Group, { content: boxContent } );

                    group.getGroupId = () => index.toString();
                    group.isVisible = (): boolean => visibility[ index ];
                    group.getXType = (): string => xType;

                    return group;
                } );

                const content = createHtmlElement();
                let add_column_class = '';

                sinon.stub( content, "querySelectorAll" ).callsFake( () =>
                {
                    return groups.map( ( _child, index: number ) =>
                    {
                        const elem = createHtmlElement();
                        elem.getAttribute = () => index.toString();
                        return elem;
                    } );
                } );

                content.classList.add = ( classname: string ) => {
                    add_column_class = classname;
                };

                const sut = new Sut( content, convertToGroupList( groups ), getStylerStub() );

                sut.visit();

                expect( add_column_class ).to.equal( expected_class_added );
            } );
        } );
    } );

    describe( "handleClick", () =>
    {
        let actual: string[] = [];

        const overrideGroupSelection = ( groups: any ) => {
            [ "select", "deselect", "openDetails", "closeDetails" ].forEach( event =>
            {
                groups.forEach( ( group: any, index: number ) =>
                {
                    sinon.stub( group, event ).callsFake( () =>
                    {
                        actual.push( `${event} grid group ${index}` );
                    } );
                } );
            } );

            groups.forEach( ( group: any ) =>
            {
                sinon.stub( group, "isSelected" ).returns( false );
                sinon.stub( group, "getCategories" ).returns( [] );
                sinon.stub( group, "areDetailsOpen" ).returns( false );
            } );
        };

        beforeEach(() =>
        {
            actual = [];
        } ) ;

        it( "causes selection when group's content is clicked", () =>
        {
            let expected = [
                "select grid group 1"
            ];

            const markup = createCollectionMarkup();
            const groups = createGroupsFromMarkup( markup );

            overrideGroupSelection( groups );

            let sut = new Sut( markup, convertToGroupList( groups ), getStylerStub() );

            sut.visit();

            const content = <HTMLElement> markup.querySelector( "#grid1 > .content" );

            if ( content )
            {
                content.click();
            } else {
                throw new Error( "Unable to find grid content" );
            }

            expect( actual ).to.deep.equal( expected );
        } );

        it( "selected group passes selected values from previously selected groups", () =>
        {
            const markup = createCollectionMarkup();
            const groups = createGroupsFromMarkup( markup );
            const styler_stub = getStylerStub();

            const selected_value = "foo";
            let get_selected_calls = 0;
            let select_calls = 0;

            const expected_selected_siblings = [ selected_value ];

            let sut = new Sut( markup, convertToGroupList( groups ), styler_stub );

            sut.visit();

            const content = <HTMLElement> markup.querySelector( "#grid1 > .content" );

            groups[ 0 ].isSelected = () => { return true };
            groups[ 0 ].getSelectedValue = () =>
            {
                get_selected_calls++;
                return selected_value;
            };

            groups[ 1 ].isSelected = () => { return false };
            groups[ 1 ].select = ( selected_siblings: string[] ) =>
            {
                select_calls++;
                expect( selected_siblings ).to.deep.equal( expected_selected_siblings );
            };

            if ( content )
            {
                content.click();
            } else {
                throw new Error( "Unable to find grid content" );
            }

            expect( get_selected_calls ).to.equal( 1 );
            expect( select_calls ).to.equal( 1 );
        } );

        it( "doesn't cause selection when a disabled group is clicked", () =>
        {
            let expected: string[] = [];

            const markup = createCollectionMarkup();
            const groups = createGroupsFromMarkup( markup );

            overrideGroupSelection( groups );

            let sut = new Sut( markup, convertToGroupList( groups ), getStylerStub() );

            sut.visit();

            const group = <HTMLElement> markup.querySelector( "#group_grid1" );
            const content = <HTMLElement> markup.querySelector( "#grid1 > .content" );

            groups[ 1 ].group.isInternal = () => { return false; };

            if ( group && content )
            {
                group.classList.add( "disabled" );
                content.click();
            } else {
                throw new Error( "Unable to find grid content" );
            }

            expect( actual ).to.deep.equal( expected );
        } );

        it( "causes deselection when group's content is already selected", () =>
        {
            let expected = [
                "select grid group 1",
                "deselect grid group 1"
            ];

            const markup = createCollectionMarkup();
            const groups = createGroupsFromMarkup( markup );

            overrideGroupSelection( groups );

            let sut = new Sut( markup, convertToGroupList( groups ), getStylerStub() );

            sut.visit();

            const content = <HTMLElement> markup.querySelector( "#grid1 > .content" );

            if ( content )
            {
                content.click();
            } else {
                throw new Error( "Unable to find grid content" );
            }

            groups[1].isSelected = sinon.stub().returns( true );

            if ( content )
            {
                content.click();
            }

            expect( actual ).to.deep.equal( expected );
        } );

        it( "deselects a group that shares categories with the group that was clicked", () =>
        {
            let expected = [
                "deselect grid group 0",
                "select grid group 1",
                "deselect grid group 1",
                "select grid group 0"
            ];

            const markup = createCollectionMarkup();
            const groups = createGroupsFromMarkup( markup );

            overrideGroupSelection( groups );

            groups[0].getCategories = sinon.stub().returns( [ "foo" ] );
            groups[1].getCategories = sinon.stub().returns( [ "foo" ] );

            let sut = new Sut( markup, convertToGroupList( groups ), getStylerStub() );

            sut.visit();

            const content1 = <HTMLElement> markup.querySelector( "#grid1 > .content" );

            if ( content1 )
            {
                content1.click();
            } else {
                throw new Error( "Unable to find grid content" );
            }

            groups[1].isSelected = sinon.stub().returns( true );

            const content0 = <HTMLElement> markup.querySelector( "#grid0 > .content" );

            if ( content0 )
            {
                content0.click();
            } else {
                throw new Error( "Unable to find grid content" );
            }

            expect( actual ).to.deep.equal( expected );
        } );

        it( "does not deselect a group when it does not share categories with a clicked group", () =>
        {
            let expected = [
                "select grid group 1",
            ];

            const markup = createCollectionMarkup();
            const groups = createGroupsFromMarkup( markup );

            overrideGroupSelection( groups );

            groups[0].getCategories = sinon.stub().returns( [ "foo" ] );
            groups[1].getCategories = sinon.stub().returns( [ "bar" ] );

            let sut = new Sut( markup, convertToGroupList( groups ), getStylerStub() );

            sut.visit();

            const content1 = <HTMLElement> markup.querySelector( "#grid1 > .content" );

            if ( content1 )
            {
                content1.click();
            } else {
                throw new Error( "Unable to find grid content" );
            }

            expect( actual ).to.deep.equal( expected );
        } );

        it( "opens group details when group's actions is clicked, closes other group", () =>
        {
            let expected = [
                "closeDetails grid group 0",
                "openDetails grid group 1"
            ];

            const markup = createCollectionMarkup();
            const groups = createGroupsFromMarkup( markup );
            const styler_stub = getStylerStub();

            overrideGroupSelection( groups );

            let sut = new Sut( markup, convertToGroupList( groups ), styler_stub );

            sut.visit();

            const actions = <HTMLElement> markup.querySelector( "#grid1 > .actions" );

            if ( actions )
            {
                actions.click();
            } else {
                throw new Error( "Unable to find grid content" );
            }

            expect( actual ).to.deep.equal( expected );
        } );


        it( "clicking element with close class closes all groups", () =>
        {
            let expected = [
                "closeDetails grid group 0",
                "closeDetails grid group 1"
            ];

            const markup = createCollectionMarkup();
            const groups = createGroupsFromMarkup( markup );
            const styler_stub = getStylerStub();

            overrideGroupSelection( groups );

            let sut = new Sut( markup, convertToGroupList( groups ), styler_stub );

            sut.visit();

            const actions = <HTMLElement> markup.querySelector( "#grid1 .close" );

            if ( actions )
            {
                actions.click();
            } else {
                throw new Error( "Unable to find grid content" );
            }

            expect( actual ).to.deep.equal( expected );
        } );

        it( "group details open and close methods pass AncestorAwareStyler", () =>
        {
            const markup = createCollectionMarkup();
            const groups = createGroupsFromMarkup( markup );
            const styler_stub = getStylerStub();
            let open_calls = 0;
            let close_calls = 0;

            let sut = new Sut( markup, convertToGroupList( groups ), styler_stub );

            sut.visit();

            const actions = <HTMLElement> markup.querySelector( "#grid0 > .actions" );

            groups[ 0 ].areDetailsOpen = () => { return false };
            groups[ 0 ].openDetails = ( styler: AncestorAwareStyler ) =>
            {
                open_calls++;
                expect( styler ).to.equal( styler_stub );
            };

            groups[ 1 ].areDetailsOpen = () => { return false };
            groups[ 1 ].closeDetails = ( styler: AncestorAwareStyler ) =>
            {
                close_calls++;
                expect( styler ).to.equal( styler_stub );
            };

            if ( actions )
            {
                actions.click();
            } else {
                throw new Error( "Unable to find grid content" );
            }

            expect( open_calls ).to.equal( 1 );
            expect( close_calls ).to.equal( 1 );
        } );

    } );
} );

const createHtmlElement = () => {
    return document.createElement( "div" );
}

const createCollectionMarkup = () => {
    let collection = document.createElement( "div" );

    collection.setAttribute( "class", "collection" );
    collection.setAttribute( "data-collection-type", "grid" );

    collection.innerHTML =
        `<fieldset class="grid" id="group_grid0">
            <div id="grid0">
                <section class="content"></section>
                <section class="actions"></section>
                <div class="details-pane">
                    <div class="buttons">
                        <input type="button" value="Close" class="close">
                    </div>
                </div>
            </div>
        </fieldset>
        <fieldset class="grid" id="group_grid1">
            <div id="grid1">
                <section class="content"></section>
                <section class="actions"></section>
                <div class="details-pane">
                    <div class="buttons">
                        <input type="button" value="Close" class="close">
                    </div>
                </div>
            </div>
        </fieldset>`;

    return collection;
}

const createGroupsFromMarkup = ( markup: HTMLElement ): any =>
{
    let groups: any = [];

    markup.querySelectorAll( "fieldset" ).forEach( fieldset =>
    {
        groups.push( createGroup( Group, { content: fieldset } ) )
    } );

    groups.forEach( ( group: any, index: number ) =>
    {
        sinon.stub( group, "getGroupId" ).returns( "group_grid" + index );
    } );

    return groups;
};

const convertToGroupList = ( groups: GroupUi[] ): GroupList =>
{
    let group_list: GroupList = {};

    groups.forEach( ( group: GroupUi ) =>
    {
        group_list[ group.getGroupId() ] = group;
    } );

    return group_list;
}

const getStylerStub = (): AncestorAwareStyler[] =>
{
    return [
        <AncestorAwareStyler>{
            'style': ( _: any ) => {},
        }
    ];
}