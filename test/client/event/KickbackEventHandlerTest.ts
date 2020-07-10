/**
 * Tests KickbackEventHandler
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

import { expect } from 'chai';
import { KickbackEventHandler as Sut } from '../../../src/client/event/KickbackEventHandler';
import { ClientQuote } from "../../../src/client/quote/ClientQuote";
import { Client } from "../../../src/client/Client";
import { Nav } from "../../../src/client/nav/Nav";
import { Ui } from "../../../src/ui/Ui";


describe( 'Handle kickback event', () =>
{
    [
        {
            label: 'kickback when top and current step is greater than kickback step',
            kb_step: 3,
            current_step: 5,
            top_visited_step: 5,
            expected_nav_called: true
        },
        {
            label: 'does not kickback when current step is less than the kickback step',
            kb_step: 3,
            current_step: 2,
            top_visited_step: 5,
            expected_nav_called: false,
        },
        {
            label: 'does not kickback when top visited step is less than kickback step',
            kb_step: 5,
            current_step: 4,
            top_visited_step: 4,
            expected_nav_called: false
        },
        {
            label: 'does not kickback when current step matches the kickback step',
            kb_step: 5,
            current_step: 5,
            top_visited_step: 6,
            expected_nav_called: false,
        },
    ].forEach( ( {
        label,
        kb_step,
        current_step,
        top_visited_step,
        expected_nav_called} ) => {
    it( label, done =>
    {
            const {
                nav,
                client,
            } = createStubs( top_visited_step, current_step );

            let navigate_to_step_called = false;
            nav.navigateToStep = ( _step_id: any, _force: any ) =>
            {
                navigate_to_step_called = true;
            };

            const sut = new Sut( client );
            sut.handle(
                'kickBack',
                function() {},
                {
                    action : 'kickBack',
                    stepId : kb_step
                }
            );

            expect( navigate_to_step_called ).to.equal( expected_nav_called );
            done();
        } );
    } );
} );


function createStubClientQuote( top_visited_step: any, current_step: any )
{
    return <ClientQuote><unknown>{
        getTopVisitedStepId: () => top_visited_step,
        setTopVisitedStepId: () => {},
        getCurrentStepId: () => current_step,
    };
}


function createStubNavigation()
{
    return <Nav><unknown>{
        navigateToStep: ( _step_id: any ) => {},
        setTopVisitedStepId: ( _step_id: any ) => {},
    };
}

function createStubUi()
{
    return <Ui><unknown>{
        redrawNav: () => {},
    };
}


function createStubClient( quote: ClientQuote, nav: Nav, ui: Ui )
{
    return <Client><unknown>{
        getQuote: () => quote,
        nav: nav,
        getUi: () => ui
    };
}


function createStubs( top_visited_step: any, current_step: any )
{
    const quote  = createStubClientQuote( top_visited_step, current_step );
    const nav    = createStubNavigation();
    const ui     = createStubUi();
    const client = createStubClient( quote, nav, ui );

    return {
        client: client,
        quote:  quote,
        nav:    nav,
        ui:     ui,
    };
}