/**
 * Tests ClientQuote
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

const chai                        = require( 'chai' );
const expect                      = chai.expect;
const { BaseQuote }               = require( '../../../' ).quote;
const { ClientQuote }             = require( '../../../' ).client.quote;
const { QuoteDataBucket }         = require( '../../../' ).bucket;

chai.use( require( 'chai-as-promised' ) );

describe( 'ClientQuote', () =>
{
    const baseQuote        = BaseQuote( 123, QuoteDataBucket() ),
          startDate        = 12345,
          agentId          = 90000,
          agentName        = 'John Doe',
          agentEntityId    = '12434300',
          initialRatedDate = 1531507748,
          quote         = ClientQuote(
              baseQuote,
              {
                  startDate: startDate,
                  agentId: agentId,
                  agentName: agentName,
                  agentEntityId: agentEntityId,
                  initialRatedDate: initialRatedDate,
              },
                  bucket => bucket
          );

    it( 'constructor', () =>
    {
        expect( quote ).to.be.an.instanceof( ClientQuote );
    } );

    it( 'getStartDate proxy', () =>
    {
        expect( quote.getStartDate ).to.not.be.undefined;
        expect( quote.getStartDate() ).to.equal( startDate );
    } );

    it( 'getAgentId proxy', () =>
    {
        expect( quote.getAgentId ).to.not.be.undefined;
        expect( quote.getAgentId() ).to.equal( agentId );
    } );

    it( 'getAgentName proxy', () =>
    {
        expect( quote.getAgentName ).to.not.be.undefined;
        expect( quote.getAgentName() ).to.equal( agentName );
    } );

    it( 'getAgentEntityId proxy', () =>
    {
        expect( quote.getAgentEntityId ).to.not.be.undefined;
        expect( quote.getAgentEntityId() ).to.equal( agentEntityId );
    } );

    it( 'getInitialRatedDate proxy', () =>
    {
        expect( quote.getInitialRatedDate ).to.not.be.undefined;
        expect( quote.getInitialRatedDate() ).to.equal( initialRatedDate );
    } );
} );
