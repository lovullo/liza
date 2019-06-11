/**
 * Tests RateEventHandler
 *
 *  Copyright (C) 2019, 2019 R-T Specialty, LLC.
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

const { expect } = require( 'chai' );
const Sut        = require( '../../..' ).client.event.RateEventHandler;

describe( 'RateEventHandler', () =>
{
    describe( "Handle Rating Event", () =>
    {
        it( "calls #handle to do the rating", done =>
        {
            const stepId = 0;
            const lockStep = 1;
            const indv = "somerater";

            const quote = {
                getExplicitLockStep: () => lockStep,
                setInitialRatedDate: ( value ) => {},
                getCurrentStepId:    () => stepId,
                refreshData:         () => {},
                isLocked:            () => false
            };

            const step = {
                invalidate: () => {}
            };

            const ui = {
                getStep: ( dest ) => step
            };

            const client = {
                getQuote: () => quote,
                isSaving: () => false,
                once:     ( event, callback ) => {},
                getUi:    () => ui
            };

            const response = {
                content: {
                    data: "Some Data"
                }
            };

            const error = "ERROR";

            const proxy = {
                get: ( url, callback ) => callback( response, error )
            };

            const sut = Sut( client, proxy );

            sut.handle( "", function() {}, {
                indv:   indv,
                stepId: stepId
            } );
            done();
        } )
    } )
} )
