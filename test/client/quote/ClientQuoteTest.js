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
const { ClientQuote: Sut }             = require( '../../../' ).client.quote;
const { QuoteDataBucket }         = require( '../../../' ).bucket;

describe( 'ClientQuote', () =>
{
    it( 'Getters retreive the correct data', () =>
    {
        const base_quote         = BaseQuote( 123, QuoteDataBucket() );
        const start_date         = 12345;
        const agent_id           = 90000;
        const agent_name         = 'John Doe';
        const agent_entity_id    = 12434300;
        const initial_rated_date = 1531507748;
        const last_prem_date     = 1531508748;

        const quote = Sut(
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

        expect( quote.getStartDate() ).to.equal( start_date );
        expect( quote.getAgentId() ).to.equal( agent_id );
        expect( quote.getAgentName() ).to.equal( agent_name );
        expect( quote.getAgentEntityId() ).to.equal( agent_entity_id );
        expect( quote.getInitialRatedDate() ).to.equal( initial_rated_date );
        expect( quote.getLastPremiumDate() ).to.equal( last_prem_date );
    } );


    it( 'autosave commits on transport success', done =>
    {
        const bucket     = createMockBucket();
        const base_quote = createMockBaseQuote( bucket );
        const data       = { foo: 'bar' };
        const transport  = createMockTransport( data );

        bucket.commit = () => { done() };

        const sut = Sut(
            base_quote,
            {},
            bucket => bucket
        );

        sut.autosave( transport );
    } );


    it( 'autosave commit not called on transport error', done =>
    {
        let commit_call_count = 0;

        const bucket     = createMockBucket();
        const base_quote = createMockBaseQuote( bucket );
        const data       = { foo: 'bar' };
        const error      = 'Oh no!!!';
        const transport  = createMockTransport( data, error );

        bucket.commit = () => { commit_call_count++; };

        const sut = Sut(
            base_quote,
            {},
            bucket => bucket
        );

        sut.autosave( transport, () =>
        {
            expect( commit_call_count ).to.equal( 0 );
            done();
        } );
    } );


    it( 'autosave commit is superceded by more recent call', done =>
    {
        let commit_call_count = 0;

        const bucket     = createMockBucket();
        const base_quote = createMockBaseQuote( bucket );
        const data       = { foo: 'bar' };
        const transport  = createMockTransport( data );

        bucket.commit = () => { commit_call_count++; };

        const sut = Sut(
            base_quote,
            {},
            bucket => bucket
        );

        let transport_send_called = false;

        transport.send = ( _, cb ) =>
        {
            if ( transport_send_called === false )
            {
                transport_send_called = true;

                sut.autosave( transport, () =>
                {
                    expect( commit_call_count ).to.equal( 1 );
                    done();
                } );
            }

            cb( '', data );
        };

        sut.autosave( transport );
    } );
} );


function createMockBucket()
{
    return {
        on: ( _ ) => {},
    };
}


function createMockBaseQuote( bucket )
{
    const quote = {
        visitData:           ( cb ) => { cb( bucket ) },
        setData:             ( _ ) => { return quote },
        setCurrentStepId:    ( _ ) => { return quote },
        setTopVisitedStepId: ( _ ) => { return quote },
        setAgentId:          ( _ ) => { return quote },
        setAgentName:        ( _ ) => { return quote },
        setAgentEntityId:    ( _ ) => { return quote },
        setStartDate:        ( _ ) => { return quote },
        setInitialRatedDate: ( _ ) => { return quote },
        setLastPremiumDate:  ( _ ) => { return quote },
        setImported:         ( _ ) => { return quote },
        setBound:            ( _ ) => { return quote },
        needsImport:         ( _ ) => { return quote },
        setExplicitLock:     ( _ ) => { return quote },
        on:                  ( _, cb ) => { cb() },
    };

    return quote;
}

function createMockTransport( data = {}, err = '' )
{
    return {
        send( _, cb ){ cb( err, data ); }
    };
}