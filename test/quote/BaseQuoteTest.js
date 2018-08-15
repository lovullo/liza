/**
 * Tests BaseQuote
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
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

'use strict';

const chai            = require( 'chai' );
const expect          = chai.expect;
const { BaseQuote }   = require( '../../' ).quote;

chai.use( require( 'chai-as-promised' ) );

describe( 'BaseQuote', () =>
{
    [
        {
            property: 'startDate',
            value: 12345
        },
        {
            property: 'initialRatedDate',
            value: 12345
        },
        {
            property: 'agentEntityId',
            value: 'AGT5432'
        },
    ].forEach( testCase =>
    {
        const quote      = BaseQuote( 123, {} ),
              property   = testCase.property,
              titleCased = property.charAt( 0 ).toUpperCase() + property.slice( 1 ),
              setter     = 'set' + titleCased,
              getter     = 'get' + titleCased;

        it( property, () =>
        {
            expect( quote ).to.be.an.instanceof( BaseQuote );

            expect( quote[setter] ).to.not.be.undefined;
            expect( quote[getter] ).to.not.be.undefined;
            expect( quote[getter].call( null ) ).to.be.undefined;

            quote[setter].call( null, testCase.value );
            expect( quote[getter].call( null ) ).to.equal( testCase.value );
        } );
    } );
} );
