/**
 * Tests RateEventHandler
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

const { expect } = require( 'chai' );
const Sut        = require( '../../..' ).client.event.RateEventHandler;

describe( 'RateEventHandler', () =>
{
    describe( "Handle Rating Event with all conditions met for clean rating", () =>
    {
        it( "calls #handle to do the rating", done =>
        {
            let test_init_date = false;
            let test_last_prem_date = false;
            let test_lock_quote = false;

            const stepId = 1;
            const lockStep = 0;
            const indv = "somerater";
            const initial_rated_date = 111;
            const last_premium_date  = 222;

            const quote = {
                getExplicitLockStep: () => lockStep,
                setLastPremiumDate:  given =>
                {
                    expect( given ).to.equal( last_premium_date );
                    test_init_date = true;
                },
                setInitialRatedDate: given =>
                {
                    expect( given ).to.equal( initial_rated_date );
                    test_last_prem_date = true;
                },
                getCurrentStepId:    () => stepId,
                refreshData:         () => {},
                isLocked:  given =>
                {
                    test_lock_quote = true;
                    return false;
                },
                getId:               () => "111111"
            };

            const step = {
                invalidate: () => {}
            };

            const ui = {
                getStep: ( dest ) => step
            };

            const client = {
                showRatingInProgressDialog: () => "Some Dialog",
                getQuote: () => quote,
                isSaving: () => false,
                once:     ( event, callback ) => {},
                getUi:    () => ui
            };

            const response = {
                content: {
                    data: "Some Data",
                    initialRatedDate: initial_rated_date,
                    lastRatedDate: last_premium_date
                }
            };

            const error = null;

            const proxy = {
                get: ( url, callback ) => callback( response, error )
            };

            const sut = Sut( client, proxy );

            sut.handle(
                "",
                ( err, result ) =>
                {
                    expect( err ).to.equal( error );
                    expect( result ).to.equal( response.content.data );
                    expect( test_init_date ).to.equal( true );
                    expect( test_last_prem_date ).to.equal( true );
                    expect( test_lock_quote ).to.equal( true );
                    done();
                },
                {
                    indv:   indv,
                    stepId: stepId
                }
            )

        } )
    } );

    describe( "Handle Rating Event with locked quote", () =>
    {
        it( "calls #handle to do the rating with a locked quote", done =>
        {

            let test_lock_quote = false;

            const stepId = 1;
            const lockStep = 0;
            const indv = "somerater";
            const error = null;
            const proxy = {
                get: ( url, callback ) => callback( response, error )
            };

            const quote = {
                getExplicitLockStep: () => lockStep,
                getCurrentStepId:    () => stepId,
                isLocked:  given =>
                {
                    test_lock_quote = true;
                    return true;
                }
            };

            const client = {
                getQuote: () => quote,
                isSaving: () => false,
                getUi:    () => ui
            };


            const sut = Sut( client, proxy );

            sut.handle(
                "",
                ( err, result ) =>
                {
                    expect( test_lock_quote ).to.equal( true );
                    done();
                },
                {
                    indv:   indv,
                    stepId: stepId
                }
            )
        } )
    } );

    describe( "Handle Rating Event during a save event", () =>
    {
        it( "calls #handle to do the rating with a saving quote", done =>
        {
            let test_init_date = false;
            let test_last_prem_date = false;
            let test_save_quote = false;

            const stepId = 1;
            const lockStep = 0;
            const indv = "somerater";
            const initial_rated_date = 111;
            const last_premium_date  = 222;

            const quote = {
                getExplicitLockStep: () => lockStep,
                setLastPremiumDate:  given =>
                {
                    expect( given ).to.equal( last_premium_date );
                    test_init_date = true;
                },
                setInitialRatedDate: given =>
                {
                    expect( given ).to.equal( initial_rated_date );
                    test_last_prem_date = true;
                },
                getCurrentStepId:    () => stepId,
                refreshData:         () => {},
                isLocked:            () => false,
                getId:               () => "111111"
            };

            const step = {
                invalidate: () => {}
            };

            const ui = {
                getStep: ( dest ) => step
            };

            const client = {
                showRatingInProgressDialog: () => "Some Dialog",
                getQuote: () => quote,
                isSaving: given =>
                {
                    test_save_quote = true;
                    return true;
                },
                once:     ( event, callback ) => callback(),
                getUi:    () => ui
            };

            const response = {
                content: {
                    data: "Some Data",
                    initialRatedDate: initial_rated_date,
                    lastRatedDate: last_premium_date
                }
            };

            const error = null;

            const proxy = {
                get: ( url, callback ) => callback( response, error )
            };

            const sut = Sut( client, proxy );

            sut.handle(
                "",
                ( err, result ) =>
                {
                    expect( err ).to.equal( error );
                    expect( result ).to.equal( response.content.data );
                    expect( test_init_date ).to.equal( true );
                    expect( test_last_prem_date ).to.equal( true );
                    expect( test_save_quote ).to.equal( true );
                    done();
                },
                {
                    indv:   indv,
                    stepId: stepId
                }
            )
        } )
    } );
} )
