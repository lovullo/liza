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
import { createSut, createQuote, createContent, getDomElement } from "./CommonResources";

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
        output: [ "100%" ],
        expected_class_added : "col-1",
        expected_class_removed: "col-99",
      },
      {
        columns: 2,
        input: [ "column1", "column2", "column1", "column2" ],
        output: [ "50%", "50%", "50%", "50%" ],
        expected_class_added : "col-2",
        expected_class_removed: "col-0",
      },
      {
        columns: 3,
        input: [ "column1", "column2", "column3" ],
        output: [
          "33.333333333333336%",
          "33.333333333333336%",
          "33.333333333333336%"
        ],
        expected_class_added : "col-3",
        expected_class_removed: "col-99",
      },
      {
        columns: 4,
        input: [ "column1", "column2", "column3", "column4" ],
        output: [ "25%", "25%", "25%", "25%" ],
        expected_class_added : "col-4",
        expected_class_removed: "col-99",
      },
    ].forEach( data =>
    {
      let {
        columns,
        input,
        output,
        expected_class_added,
        expected_class_removed
      } = data;

      it( `sets the width of its children for ${columns} columns`, () =>
      {
        let widths: string[] = [];

        const children = input.map( ( xType: string ) =>
          {
            let cell = createSut( Cell );

            cell.getXType = (): string => xType;

            cell.setColumnWidth = ( width: string ) => {
              widths.push( width );
            };

            cell.cellIsVisible = (): boolean => true;

            return cell;
          }
        );

        const content = createContent();

        const grid = getDomElement();
        let add_column_class = '';
        let actual_column_removed: string = '';

        content.querySelector
          .withArgs( '.groupGrid' )
          .returns( grid );

        grid.classList = getClassList( expected_class_removed );

        grid.classList.add = ( classname: string ) => {
          add_column_class = classname;
        };

        grid.classList.remove = ( class_name: string ) => {
          actual_column_removed = class_name;
        };

        const sut = createSut( Sut, { children: children, content: content } );

        sut.init( createQuote() );
        sut.visit();

        expect( add_column_class ).to.equal( expected_class_added );
        expect( actual_column_removed ).to.equal( expected_class_removed );
        expect( widths ).to.deep.equal( output );
      } )
    } );


    it( `sets the width of its children when some columns aren't visible`, () => {
      [
        // One column that is not visible - width is not Infinity
        {
          input: [ "column1" ],
          output: [ "100%" ],
          visibility: [ false ]
        },
        // One column that is visible
        {
          input: [ "column1" ],
          output: [ "100%" ],
          visibility: [ false ]
        },
        // Four columns but only two are visible
        {
          input: [ "column1", "column2", "column3", "column4" ],
          output: [ "50%", "50%", "50%", "50%" ],
          visibility: [ true, false, false, true ]
        }
      ].forEach( data =>
      {
        let { input, output, visibility } = data;

          let widths: string[] = [];

          const children = input.map( ( xType: string, index: number ) =>
            {
              let cell = createSut( Cell );

              cell.getXType = (): string => xType;

              cell.setColumnWidth = ( width: string ) => {
                widths.push( width );
              };

              cell.cellIsVisible = (): boolean => visibility[ index ];

              return cell;
            }
          );

          const content = createContent();

          content.querySelector
            .withArgs( '.groupGrid' )
            .returns( getDomElement() );

          const sut = createSut( Sut, { children: children, content: content } );

          sut.init( createQuote() );
          sut.visit();

          expect( widths ).to.deep.equal( output );
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