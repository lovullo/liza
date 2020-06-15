/**
 * Tests ClientQuote
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

describe( 'ClientQuote', () =>
{
    const base_quote         = BaseQuote( 123, QuoteDataBucket() );
    const start_date         = 12345;
    const agent_id           = 90000;
    const agent_name         = 'John Doe';
    const agent_entity_id    = 12434300;
    const initial_rated_date = 1531507748;
    const last_prem_date     = 1531508748;
    const quote              = ClientQuote(
              base_quote,
              {
                  startDate:        start_date,
                  agentId:          agent_id,
                  agentName:        agent_name,
                  agentEntityId:    agent_entity_id,
                  initialRatedDate: initial_rated_date,
                  lastPremDate:     last_prem_date,
              },
              bucket => bucket
          );

    it( 'getStartDate returns base quote startDate', () =>
    {
        expect( quote.getStartDate() ).to.equal( start_date );
    } );

    it( 'getAgentId returns base quote agentId', () =>
    {
        expect( quote.getAgentId() ).to.equal( agent_id );
    } );

    it( 'getAgentName returns base quote agentName', () =>
    {
        expect( quote.getAgentName() ).to.equal( agent_name );
    } );

    it( 'getAgentEntityId returns base quote agentEntityId', () =>
    {
        expect( quote.getAgentEntityId() ).to.equal( agent_entity_id );
    } );

    it( 'getInitialRatedDate returns base quote initialRatedDate', () =>
    {
        expect( quote.getInitialRatedDate() ).to.equal( initial_rated_date );
    } );

    it( 'getLastPremiumDate returns base quote lastRatedDate', () =>
    {
        expect( quote.getLastPremiumDate() ).to.equal( last_prem_date );
    } );
} );
