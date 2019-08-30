/**
 * Tests RatingService
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

'use strict'

const { expect }        = require( 'chai' );
const Sut               = require( '../../../' ).server.service.RatingService;
const RatingServiceStub = require( '../../../' ).test.server.service.RatingServiceStub;

describe( 'RatingService', () =>
{
    describe( "protected API", () =>
    {
        it( "calls #postProcessRaterData after rating before save", done =>
        {
            let processed = false;

            const {
                logger,
                server,
                raters,
                dao,
                request,
                response,
                quote,
            } = RatingServiceStub.getStubs();

            dao.mergeBucket = () =>
            {
                expect( processed ).to.equal( true );
                done();
            };

            const sut = Sut.extend(
            {
                'override postProcessRaterData'(
                    request, data, actions, program, quote
                )
                {
                    processed = true;
                }
            } )( logger, dao, server, raters );

            sut.request( request, response, quote, 'something', () => {} );
        } );

        it( "calls getLastPremiumDate during #_performRating", done =>
        {
            let getLastPremiumDateCallCount = 0;

            const last_date    = 1234;
            const initial_date = 2345;

            const {
                logger,
                server,
                raters,
                dao,
                request,
                response,
                quote,
            } = RatingServiceStub.getStubs();

            quote.getLastPremiumDate = () =>
            {
                getLastPremiumDateCallCount++;
                return last_date
            };

            quote.getRatedDate = () => initial_date;

            const sut = Sut( logger, dao, server, raters );

            server.sendResponse = ( request, quote, resp, actions ) =>
            {
                expect( getLastPremiumDateCallCount ).to.equal( 2 );
                expect( resp.initialRatedDate ).to.equal( initial_date );
                expect( resp.lastRatedDate ).to.equal( last_date );

                done();
            };

            sut.request( request, response, quote, null, () => {} );
        } );

    } );
} );
