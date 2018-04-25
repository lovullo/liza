/**
 * Tests RatingServiceSubmitNotify
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
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

const { Class }  = require( 'easejs' );
const { expect } = require( 'chai' );


const {
    dapi: {
        DataApi,
    },
    server: {
        service: {
            RatingServiceSubmitNotify: Sut,
            RatingService,
        },
    },
    test: {
        server: {
            service: {
                RatingServiceStub,
            },
        },
    },
} = require( '../../../' );


describe( 'RatingServiceSubmitNotify', () =>
{
    [
        {
            prem_avail_count: [ 0 ],
            expected_request: true,
        },
        {
            prem_avail_count: [ 2 ],
            expected_request: false,
        },
        {
            // this shouldn't happen; ignore all but first index
            prem_avail_count: [ 2, 2 ],
            expected_request: false,
        },
    ].forEach( ( { prem_avail_count, expected_request }, i ) =>
        it( `sends request on post process if no premiums (#${i})`, done =>
        {
            const {
                stub_rate_data,
                logger,
                server,
                raters,
                dao,
                request,
                response,
                quote,
            } = RatingServiceStub.getStubs();

            const quote_id  = 1234;
            let   requested = false;

            const dapi = Class.implement( DataApi ).extend(
            {
                // warning: if an expectation fails, because of how
                // RatingService handles errors, it will cause the test to
                // _hang_ rather than throw the assertion error
                request( data, callback )
                {
                    expect( data ).to.deep.equal( { quote_id: quote_id } );

                    requested = true;
                },
            } )();

            const sut = RatingService.use( Sut( dapi ) )(
                logger, dao, server, raters
            );

            quote.getId = () => quote_id;

            // one of the methods that is called by the supertype
            let save_called = false;
            dao.setWorksheets = () => save_called = true;

            stub_rate_data.__prem_avail_count = prem_avail_count;

            sut.request( request, response, quote, 'something', () =>
            {
                expect( requested ).to.equal( expected_request );
                expect( save_called ).to.be.true;

                done();
            } );
        } )
    );
} );
