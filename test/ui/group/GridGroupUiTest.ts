/**
 * Test case for GridGroupUi
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

const Sut = require( "../../../src/ui/group/GridGroupUi" );
const Cell = require( "../../../src/ui/group/GridCellGroupUi" );
const sinon = require( 'sinon' );

import { expect } from 'chai';
import { createSut, createQuote, createContent, getDomElement, createBoxContent } from "./CommonResources";

before(function () {
    this.jsdom = require( 'jsdom-global' )();
});

after(function () {
    this.jsdom();
});

describe( "GridGroup", () =>
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
                const children = input.map( ( xType: string, index: number ) =>
                {
                    let boxContent = createBoxContent();
                    boxContent.classList.contains = sinon.stub().returns( true );

                    let cell = createSut( Cell, { content: boxContent } );
                    cell.init( createQuote() );

                    cell.getGroupId = () => index;
                    cell.cellIsVisible = (): boolean => true;
                    cell.getXType = (): string => xType;

                    return cell;
                } );

                const content = createContent();

                content.querySelectorAll = () => children.map( ( _child, index: number ) =>
                {
                    return { getAttribute: () => index };
                } );

                const grid = getDomElement();
                let add_column_class = '';
                let actual_column_removed: string = '';

                content.querySelector = sinon.stub()
                    .withArgs( '.groupGrid' )
                    .returns( grid );

                grid.classList = getClassList( expected_class_removed );

                grid.classList.add = ( classname: string ) => {
                    add_column_class = classname;
                };

                grid.classList.remove = ( class_name: string ) => {
                    actual_column_removed = class_name;
                };

                const sut = createSut( Sut, { content: content } );

                sut.setChildren( children )

                sut.init( createQuote() );
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

                const children = input.map( ( xType: string, index: number ) =>
                {
                    let boxContent = createBoxContent();
                    boxContent.classList.contains = sinon.stub().returns( true );

                    let cell = createSut( Cell, { content: boxContent } );

                    cell.init( createQuote() );

                    cell.getGroupId = () => index;
                    cell.cellIsVisible = (): boolean => visibility[ index ];
                    cell.getXType = (): string => xType;

                    return cell;
                } );

                const content = createContent();

                content.querySelectorAll = () => children.map( ( _child, index: number) =>
                {
                    return { getAttribute: () => index };
                } );

                const grid = getDomElement();
                let add_column_class = '';

                content.querySelector
                    .withArgs( '.groupGrid' )
                    .returns( grid );

                grid.classList.add = ( classname: string ) => {
                    add_column_class = classname;
                };

                const sut = createSut( Sut, { content: content } );

                sut.setChildren( children )

                sut.init( createQuote() );
                sut.visit();

                expect( add_column_class ).to.equal( expected_class_added );
            } );
        } );
    } );
} );


export const getClassList = ( class_name: string ) =>
{
    return {
        contains: sinon.stub().returns( false ),
        add: sinon.stub(),
        remove: sinon.stub(),
        length: 1,
        0: class_name,
    }
};