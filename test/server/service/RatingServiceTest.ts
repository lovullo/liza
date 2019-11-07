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

import {
    RatingService as Sut,
    RateRequestResult
} from "../../../src/server/service/RatingService";

import { ClientActions } from "../../../src/client/action/ClientAction";
import { PriorityLog } from "../../../src/server/log/PriorityLog";
import { ProcessManager } from "../../../src/server/rater/ProcessManager";
import { Program } from "../../../src/program/Program";
import { QuoteId } from "../../../src/quote/Quote";
import { Rater, RateResult } from "../../../src/server/rater/Rater";
import { Server } from "../../../src/server/Server";
import { ServerSideQuote } from "../../../src/server/quote/ServerSideQuote";
import { UserRequest } from "../../../src/server/request/UserRequest";
import { UserResponse } from "../../../src/server/request/UserResponse";
import { UserSession } from "../../../src/server/request/UserSession";
import { QuoteDataBucket } from "../../../src/bucket/QuoteDataBucket";

import {
    ServerDao,
    Callback as ServerDaoCallback
} from "../../../src/server/db/ServerDao";

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );


describe( 'RatingService', () =>
{
    it( "returns rating results", () =>
    {
        const {
            logger,
            server,
            raters,
            dao,
            request,
            response,
            quote,
            stub_rate_data,
        } = getStubs();

        const sut = new Sut( logger, dao, server, raters );

        const expected = {
            data:             stub_rate_data,
            initialRatedDate: quote.getRatedDate(),
            lastRatedDate:    quote.getLastPremiumDate(),
        };

        return expect( sut.request( request, response, quote, "" ) )
            .to.eventually.deep.equal( expected );
    } );


    it( "updates rating dates before serving to client", () =>
    {
        const {
            logger,
            server,
            raters,
            dao,
            request,
            response,
            quote,
            stub_rate_data,
        } = getStubs();

        const sut = new Sut( logger, dao, server, raters );

        let last_prem_called  = false;
        let rated_date_called = false;

        let stub_last_prem_ts  = <UnixTimestamp>12345;
        let stub_rated_date_ts = <UnixTimestamp>23456;

        let sent = false;

        quote.setLastPremiumDate = () =>
        {
            last_prem_called = true;
            return quote;
        };

        quote.setRatedDate = () =>
        {
            rated_date_called = true;
            return quote;
        };

        quote.getLastPremiumDate = () => stub_last_prem_ts;
        quote.getRatedDate       = () => stub_rated_date_ts;

        server.sendResponse = (
            _request: any,
            _quote:   any,
            resp:     RateRequestResult,
            _actions: ClientActions
        ) =>
        {
            expect( resp.initialRatedDate ).to.equal( stub_rated_date_ts );
            expect( resp.lastRatedDate ).to.equal( stub_last_prem_ts );

            expect( last_prem_called ).to.be.true;
            expect( rated_date_called ).to.be.true;

            sent = true;

            return server;
        };

        const expected = {
            data:             stub_rate_data,
            initialRatedDate: stub_rated_date_ts,
            lastRatedDate:    stub_last_prem_ts,
        };

        return expect( sut.request( request, response, quote, "" ) )
            .to.eventually.deep.equal( expected )
            .then( () => expect( sent ).to.be.true );
    } );

    it( "saves rate data to it's own field", () =>
    {
        const {
            logger,
            server,
            raters,
            dao,
            request,
            response,
            quote,
            stub_rate_data,
        } = getStubs();

        let saved_rates = false;

        dao.saveQuote = (
            quote:     ServerSideQuote,
            success:   ServerDaoCallback,
            _failure:  ServerDaoCallback,
            save_data: Record<string, any>,
        ) =>
        {
            expect( save_data ).to.deep.equal( {
                ratedata: stub_rate_data,
            } );

            saved_rates = true;
            success( quote );

            return dao;
        };

        const sut = new Sut( logger, dao, server, raters );

        return sut.request( request, response, quote, "" )
            .then( () =>
            {
                expect( saved_rates ).to.be.true;
            } );
    } );


    it( "rejects and responds with error", () =>
    {
        const {
            dao,
            logger,
            program,
            quote,
            rater,
            raters,
            request,
            response,
            server,
        } = getStubs();

        const expected_error = new Error( "expected error" );

        rater.rate = () => { throw expected_error; };

        const sut = new Sut( logger, dao, server, raters );

        let logged = false;

        logger.log = function(
            priority:   number,
            _format:    string,
            qid:        QuoteId,
            program_id: string,
            message:    string,
        )
        {
            if ( typeof message === 'string' )
            {
                expect( priority ).to.equal( logger.PRIORITY_ERROR );
                expect( qid ).to.equal( quote.getId() );
                expect( program_id ).to.equal( program.getId() );
                expect( message ).to.contain( expected_error.message );

                logged = true;
            }

            return logger;
        };

        return expect( sut.request( request, response, quote, "" ) )
            .to.eventually.rejectedWith( expected_error )
            .then( () => expect( logged ).to.be.true );
    } );


    it( "returns error message from rater", () =>
    {
        const {
            dao,
            logger,
            quote,
            rater,
            raters,
            request,
            response,
            server,
        } = getStubs();

        const expected_message = 'expected foo';

        const sut = new Sut( logger, dao, server, raters );

        rater.rate = (
            _quote:   ServerSideQuote,
            _session: UserSession,
            _indv:    string,
            _success: ( data: RateResult, actions: ClientActions ) => void,
            failure:  ( message: string ) => void,
        ) =>
        {
            failure( expected_message );
            return rater;
        };

        return expect( sut.request( request, response, quote, "" ) )
            .to.eventually.rejectedWith( Error, expected_message );
    } );


    // this means of deferred rating is deprecated and is being superceded
    // in the near future by a better system; it will hopefully be removed
    // at some point
    it( "sends indvRate action for old-style deferred suppliers", () =>
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
        } = getStubs();

        let sent = false;

        stub_rate_data._cmpdata = {
            deferred: [ 'supp1', 'supp2' ],
        };

        server.sendResponse = (
            _request: any,
            _quote: any,
            _resp: any,
            actions: ClientActions
        ) =>
        {
            expect( actions ).to.deep.equal( [
                { action: 'indvRate', id: 'supp1' },
                { action: 'indvRate', id: 'supp2' },
            ] );

            sent = true;

            return server;
        };

        const sut = new Sut( logger, dao, server, raters );

        return sut.request( request, response, quote, "" )
            .then( () => expect( sent ).to.be.true );
    } );


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
            } = getStubs();

            dao.mergeBucket = () =>
            {
                expect( processed ).to.equal( true );
                done();

                return dao;
            };

            const sut = new class extends Sut
            {
                postProcessRaterData()
                {
                    processed = true;
                }
            }( logger, dao, server, raters );

            sut.request( request, response, quote, 'something' );
        } );

        it( "calls getLastPremiumDate during #_performRating", done =>
        {
            let getLastPremiumDateCallCount = 0;

            const last_date    = <UnixTimestamp>1234;
            const initial_date = <UnixTimestamp>2345;

            const {
                logger,
                server,
                raters,
                dao,
                request,
                response,
                quote,
            } = getStubs();

            quote.getLastPremiumDate = () =>
            {
                getLastPremiumDateCallCount++;
                return last_date
            };

            quote.getRatedDate = () => initial_date;

            const sut = new Sut( logger, dao, server, raters );

            server.sendResponse = ( _request: any, _quote: any, resp: any, _actions: any ) =>
            {
                expect( getLastPremiumDateCallCount ).to.equal( 2 );
                expect( resp.initialRatedDate ).to.equal( initial_date );
                expect( resp.lastRatedDate ).to.equal( last_date );

                done();

                return server;
            };

            sut.request( request, response, quote, "" );
        } );
    } );
} );


function getStubs()
{
    const program_id = 'foo';

    const program = <Program>{
        getId:               () => program_id,
        ineligibleLockCount: 0,
    };

    // rate reply
    const stub_rate_data: RateResult = {
        _unavailable_all: '0',
    };

    const rater = new class implements Rater
    {
        rate(
            _quote:   ServerSideQuote,
            _session: UserSession,
            _indv:    string,
            success:  ( data: RateResult, actions: ClientActions ) => void,
            _failure: ( message: string ) => void,
        )
        {
            // force to be async so that the tests resemble how the code
            // actually runs
            process.nextTick( () => success( stub_rate_data, [] ) );

            return this;
        }
    };

    const raters = <ProcessManager>{
        byId: () => rater,
    };

    const logger = new class implements PriorityLog
    {
        readonly PRIORITY_ERROR: number     = 0;
        readonly PRIORITY_IMPORTANT: number = 1;
        readonly PRIORITY_DB: number        = 2;
        readonly PRIORITY_INFO: number      = 3;
        readonly PRIORITY_SOCKET: number    = 4;

        log( _priority: number, ..._args: Array<string|number> ): this
        {
            return this;
        }
    };

    const server = <Server>{
        sendResponse: () => server,
        sendError:    () => server,
    };

    const dao = new class implements ServerDao
    {
        saveQuote(
            quote:      ServerSideQuote,
            success:    ServerDaoCallback,
            _failure:   ServerDaoCallback,
            _save_data: Record<string, any>,
        ): this
        {
            success( quote );
            return this;
        }

        mergeBucket(): this
        {
            return this;
        }

        saveQuoteClasses(): this
        {
            return this;
        }

        setWorksheets(): this
        {
            return this;
        }

        saveQuoteState(): this
        {
            throw new Error( "Unused method" );
        }

        saveQuoteLockState(): this
        {
            throw new Error( "Unused method" );
        }

        getWorksheet(): this
        {
            throw new Error( "Unused method" );
        }
    };

    const session = <UserSession>{
        isInternal: () => false,
    };

    const request = <UserRequest>{
        getSession:       () => session,
        getSessionIdName: () => {},
    };

    const response = <UserResponse>{};

    const quote = <ServerSideQuote>{
        getProgramId:       () => program_id,
        getProgram:         () => program,
        getId:              () => <QuoteId>0,
        setLastPremiumDate: () => quote,
        setRatedDate:       () => quote,
        getRatedDate:       () => <UnixTimestamp>0,
        getLastPremiumDate: () => <UnixTimestamp>0,
        getCurrentStepId:   () => 0,
        setExplicitLock:    () => quote,
        setRateBucket:      () => quote,
        setRatingData:      () => quote,
        getRatingData:      () => stub_rate_data,
        getBucket:          () => new QuoteDataBucket(),
    };

    return {
        program:        program,
        stub_rate_data: stub_rate_data,
        rater:          rater,
        raters:         raters,
        logger:         logger,
        server:         server,
        dao:            dao,
        session:        session,
        request:        request,
        response:       response,
        quote:          quote,
    };
};
