/**
 * Tests RatingServiceSubmitNotify
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
        // not available; make successful request and save flag
        {
            prem_avail_count: [ 0 ],
            prev_called:      false,
            expected_request: true,
            request_err:      null,
            save:             true,
        },
        // not available; make failing request, don't save flag
        {
            prem_avail_count: [ 0 ],
            prev_called:      false,
            expected_request: true,
            request_err:      Error(),
            save:             false,
        },
        // available
        {
            prem_avail_count: [ 2 ],
            prev_called:      false,
            expected_request: false,
            request_err:      null,
            save:             false,
        },
        // this shouldn't happen; ignore all but first index
        {
            prem_avail_count: [ 2, 2 ],
            prev_called:      false,
            expected_request: false,
            request_err:      null,
            save:             false,
        },
        // save as above, but already saved
        {
            prem_avail_count: [ 0 ],
            prev_called:      true,
            expected_request: false,
            request_err:      null,
            save:             false,
        },
        // available; don't make request
        {
            prem_avail_count: [ 2 ],
            prev_called:      true,
            expected_request: false,
            request_err:      null,
            save:             false,
        },
        // this shouldn't happen; ignore all but first index
        {
            prem_avail_count: [ 2, 2 ],
            prev_called:      true,
            expected_request: false,
            request_err:      null,
            save:             false,
        },
    ].forEach( ( expected, i ) =>
        it( `sends request on post process if no premiums (#${i})`, done =>
        {
            const {
                dao,
                logger,
                quote,
                raters,
                request,
                response,
                server,
                stub_rate_data,
            } = RatingServiceStub.getStubs();

            const quote_id  = 1234;
            let   requested = false;

            const dapif = given_request =>
                Class.implement( DataApi ).extend(
                {
                    // warning: if an expectation fails, because of how
                    // RatingService handles errors, it will cause the test to
                    // _hang_ rather than throw the assertion error
                    request( data, callback, id )
                    {
                        expect( given_request ).to.equal( request );
                        expect( data ).to.deep.equal( { quote_id: quote_id } );

                        requested = true;

                        callback( expected.request_err, null );
                    },
                } )();

            const sut = RatingService.use( Sut( dapif, dao ) )(
                logger, dao, server, raters
            );

            quote.getId = () => quote_id;

            // one of the methods that is called by the supertype
            let save_called = false;
            dao.setWorksheets = () => save_called = true;

            // whether the notify flag is actually set
            let notify_saved = false;

            // request for notification status
            dao.getDocumentField = ( qid, key, callback ) =>
            {
                expect( qid ).to.equal( quote_id );
                expect( key ).to.equal( 'submitNotified' );

                callback( expected.flag_error, expected.prev_called );
            };

            dao.setDocumentField = ( qid, key, value, callback ) =>
            {
                expect( qid ).to.equal( quote_id );
                expect( key ).to.equal( 'submitNotified' );
                expect( value ).to.equal( true );

                notify_saved = true;
            };

            stub_rate_data.__prem_avail_count = expected.prem_avail_count;

            sut.request( request, response, quote, 'something', () =>
            {
                expect( requested ).to.equal( expected.expected_request );
                expect( save_called ).to.be.true;

                // only save notification status if we're notifying
                expect( notify_saved ).to.equal( expected.save );

                done();
            } );
        } )
    );
} );
