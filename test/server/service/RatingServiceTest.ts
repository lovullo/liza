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
import { Rater, RateResult, WorksheetData } from "../../../src/server/rater/Rater";
import { ServerSideQuote } from "../../../src/server/quote/ServerSideQuote";
import { UserSession } from "../../../src/server/request/UserSession";
import { QuoteDataBucket } from "../../../src/bucket/QuoteDataBucket";
import { PositiveInteger } from "../../../src/numeric";
import { Kv } from "../../../src/bucket/delta";

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
            raters,
            dao,
            session,
            quote,
            stub_rate_data,
            createDelta,
            ts_ctor,
        } = getStubs();

        const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );

        const expected = {
            content: {
                data:             stub_rate_data,
                initialRatedDate: quote.getRatedDate(),
                lastRatedDate:    quote.getLastPremiumDate(),
            },
            actions: [],
        };

        return expect( sut.request( session, quote, "" ) )
            .to.eventually.deep.equal( expected );
    } );

    it( "returns previous rating results when rating is not performed", () =>
    {
        const {
            logger,
            raters,
            dao,
            session,
            quote,
            stub_rate_data,
            createDelta,
            ts_ctor,
        } = getStubs();

        let last_premium_date_call_count = 0;
        let initial_date_call_count = 0;

        const initial_date = <UnixTimestamp>2345;
        const cur_date     = <UnixTimestamp>Math.round(
            ( ( new Date() ).getTime() / 1000 )
        );

        // setup recent last prem date to ensure quote is valid
        quote.getLastPremiumDate = () =>
        {
            last_premium_date_call_count++;
            return cur_date;
        };

        quote.getRatedDate = () =>
        {
            initial_date_call_count++;
            return initial_date;
        };

        const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );

        return sut.request( session, quote, "" )
            .then( ( result: RateRequestResult ) =>
            {
                expect( result.content.initialRatedDate ).to.equal( initial_date );
                expect( result.content.lastRatedDate ).to.equal( cur_date );
                expect( result.content.data ).to.equal( stub_rate_data );
                expect( last_premium_date_call_count ).to.equal( 2 );
                expect( initial_date_call_count ).to.equal( 1 );
            } );
    } );


    it( "Invalidates a quote with a meta bucket updated after last rate", () =>
    {
        const {
            logger,
            raters,
            dao,
            session,
            quote,
            stub_rate_data,
            createDelta,
            ts_ctor,
        } = getStubs();

        let last_premium_date_call_count = 0;
        let initial_date_call_count = 0;

        const initial_date = <UnixTimestamp>2345;
        const cur_date     = <UnixTimestamp>Math.round(
            ( ( new Date() ).getTime() / 1000 )
        );

        // setup recent last prem date to ensure quote is valid
        quote.getLastPremiumDate = () =>
        {
            last_premium_date_call_count++;
            return cur_date;
        };

        quote.getRatedDate = () =>
        {
            initial_date_call_count++;
            return initial_date;
        };

        const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );

        return sut.request( session, quote, "" )
            .then( ( result: RateRequestResult ) =>
            {
                expect( result.content.initialRatedDate ).to.equal( initial_date );
                expect( result.content.lastRatedDate ).to.equal( cur_date );
                expect( result.content.data ).to.equal( stub_rate_data );
                expect( last_premium_date_call_count ).to.equal( 2 );
                expect( initial_date_call_count ).to.equal( 1 );
            } );
    } );


    it( "updates rating dates before serving to client", () =>
    {
        const {
            logger,
            raters,
            dao,
            session,
            quote,
            stub_rate_data,
            createDelta,
            ts_ctor,
        } = getStubs();

        const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );

        let last_prem_called  = false;
        let rated_date_called = false;

        let stub_last_prem_ts  = <UnixTimestamp>0;
        let stub_rated_date_ts = <UnixTimestamp>0;

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

        const expected = {
            content: {
                data:             stub_rate_data,
                initialRatedDate: stub_rated_date_ts,
                lastRatedDate:    stub_last_prem_ts,
            },
            actions: [],
        };

        return expect( sut.request( session, quote, "" ) )
            .to.eventually.deep.equal( expected )
            .then( ( result: RateRequestResult ) =>
            {
                expect( result.content.initialRatedDate ).to.equal( stub_rated_date_ts );
                expect( result.content.lastRatedDate ).to.equal( stub_last_prem_ts );

                expect( last_prem_called ).to.be.true;
                expect( rated_date_called ).to.be.true;
            } );
    } );

    it( "saves rate data to its own field", () =>
    {
        const {
            logger,
            raters,
            dao,
            session,
            quote,
            stub_rate_data,
            createDelta,
            ts_ctor,
        } = getStubs();

        let saved_rates = false;

        dao.saveQuote = (
            quote:      ServerSideQuote,
            success:    ServerDaoCallback,
            _failure:   ServerDaoCallback,
            save_data:  Record<string, any>,
            _push_data: Record<string, any>,
        ) =>
        {
            expect( save_data.ratedata ).to.deep.equal( stub_rate_data );

            saved_rates = true;
            success( quote );

            return dao;
        };

        const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );

        return sut.request( session, quote, "" )
            .then( () =>
            {
                expect( saved_rates ).to.be.true;
            } );
    } );


    it( "saves delta to its own field", () =>
    {
        const {
            logger,
            raters,
            dao,
            session,
            quote,
            stub_rate_delta,
            createDelta,
            ts_ctor,
        } = getStubs();

        let saved_quote = false;

        let timestamp = 0;

        quote.setLastPremiumDate = ( ts: UnixTimestamp ) =>
        {
            timestamp = ts;
            return quote;
        };

        dao.saveQuote = (
            quote:      ServerSideQuote,
            success:    ServerDaoCallback,
            _failure:   ServerDaoCallback,
            _save_data: Record<string, any>,
            push_data:  Record<string, any>,
        ) =>
        {
            stub_rate_delta[ "rdelta.ratedata" ].timestamp = timestamp;
            saved_quote                                    = true;

            expect( push_data ).to.deep.equal( stub_rate_delta );
            success( quote );

            return dao;
        };

        const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );

        return sut.request( session, quote, "" )
            .then( () => { expect( saved_quote ).to.be.true; } );
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
            session,
            createDelta,
            ts_ctor,
        } = getStubs();

        const expected_error = new Error( "expected error" );

        rater.rate = () => { throw expected_error; };

        const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );

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

        return expect( sut.request( session, quote, "" ) )
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
            session,
            createDelta,
            ts_ctor,
        } = getStubs();

        const expected_message = 'expected foo';

        const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );

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

        return expect( sut.request( session, quote, "" ) )
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
            session,
            stub_rate_data,
            createDelta,
            ts_ctor,
        } = getStubs();

        stub_rate_data._cmpdata = {
            deferred: [ 'supp1', 'supp2' ],
        };

        const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );

        return sut.request( session, quote, "" )
            .then( ( result: RateRequestResult ) =>
            {
                expect( result.actions ).to.deep.equal( [
                    { action: 'indvRate', id: 'supp1' },
                    { action: 'indvRate', id: 'supp2' },
                ] );
            } );
    } );

    ( <[
        string,
        Record<string, any>,
        number,
        number[],
        boolean,
        boolean[],
        number,
        number,
        boolean,
    ][]>[
        [
            "delay action is returned when raters are pending",
            {
                'supplier-a__retry': [ 0 ],
                'supplier-b__retry': [ 1 ],
                'supplier-c__retry': [ 1 ],
                'supplier-d__retry': [ 0 ],
            },
            2,
            [ 2 ],
            true,
            [ true ],
            0,
            0,
            true,
        ],
        [
            "delay action is not returned when all raters are completed",
            {
                'supplier-a__retry': [ 0 ],
                'supplier-b__retry': [ 0 ],
                'supplier-c__retry': [ 0 ],
                'supplier-d__retry': [ [ 0 ] ],
            },
            0,
            [ 0 ],
            false,
            [ true ],
            0,
            0,
            true,
        ],
        [
            "Undefined ratesteps defaults gracefully",
            {
                'supplier-a__retry': [ 0 ],
                'supplier-b__retry': [ 0 ],
                'supplier-c__retry': [ 1 ],
                'supplier-d__retry': [ 1 ],
            },
            2,
            [ 2 ],
            false,
            undefined,
            0,
            0,
            true,
        ],
        [
            "Set __rate_pending to zero after max attempts are reached",
            {
                'supplier-a__retry': [ 0 ],
                'supplier-b__retry': [ 0 ],
                'supplier-c__retry': [ 1 ],
                'supplier-d__retry': [ 1 ],
            },
            2,
            [ 0 ],
            false,
            undefined,
            0,
            30,
            false,
        ],
    ] ).forEach( ([
        label,
        supplier_data,
        retry_count,
        expected_count,
        expected_delay_action,
        rate_steps,
        step_id,
        attempts,
        expected_save_meta,
    ]) =>
    {
        it( label, () =>
        {
            const {
                dao,
                logger,
                quote,
                raters,
                session,
                stub_rate_data,
                createDelta,
                program,
                ts_ctor,
            } = getStubs();

            let meta_save_called = false;

            Object.assign( stub_rate_data, supplier_data );

            if( expected_save_meta )
            {
                dao.saveQuoteMeta = ( _, data, __, ___ ) =>
                {
                    expect( data[ 'liza_timestamp_rate_request' ] )
                        .to.deep.equal( [ ts_ctor() ] );

                    meta_save_called = true;

                    return dao;
                }
            }
            else
            {
                meta_save_called = true;
            }

            program.rateSteps      = rate_steps;
            quote.getProgram       = () => { return program; };
            quote.getCurrentStepId = () => { return step_id; };
            quote.getRetryAttempts = () => { return attempts; };
            quote.getRetryCount    = () => { return retry_count; };

            const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );
            return sut.request( session, quote, "" )
                .then( ( result: RateRequestResult ) =>
                {
                    const expected_action = {
                        "action":    "delay",
                        "seconds":   5,
                        "then":      {
                            action:  "rate",
                            value:  -1,
                        },
                    };

                    ( expected_delay_action )
                        ? expect( result.actions ).to.deep.equal( [ expected_action ] )
                        : expect( result.actions ).to.not.equal( [ expected_action ] );

                    expect( result.content.data[ '__rate_pending' ] )
                        .to.deep.equal( expected_count );

                    if( expected_count === [ 0 ] )
                    {
                        supplier_data.forEach( ( datum: number[] ) => {
                            expect( datum[ 0 ] ).to.equal( 0 );
                        });
                    }
                } )
                .then( () => expect( meta_save_called ).to.be.true );
        } );
    } );

    describe( "protected API", () =>
    {
        it( "calls #postProcessRaterData after rating before save", done =>
        {
            let processed = false;

            const {
                logger,
                raters,
                dao,
                session,
                quote,
                createDelta,
                ts_ctor,
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
            }( logger, dao, raters, createDelta, ts_ctor );

            sut.request( session, quote, 'something' );
        } );

        it( "calls getLastPremiumDate during #_performRating", () =>
        {
            let getLastPremiumDateCallCount = 0;

            const last_date    = <UnixTimestamp>1234;
            const initial_date = <UnixTimestamp>2345;

            const {
                logger,
                raters,
                dao,
                session,
                quote,
                createDelta,
                ts_ctor,
            } = getStubs();

            quote.getLastPremiumDate = () =>
            {
                getLastPremiumDateCallCount++;
                return last_date
            };

            quote.getRatedDate = () => initial_date;

            const sut = new Sut( logger, dao, raters, createDelta, ts_ctor );

            return sut.request( session, quote, "" )
                .then( ( result: RateRequestResult ) =>
                {
                    expect( getLastPremiumDateCallCount ).to.equal( 2 );
                    expect( result.content.initialRatedDate ).to.equal( initial_date );
                    expect( result.content.lastRatedDate ).to.equal( last_date );
                } );
        } );
    } );
} );


function getStubs()
{
    const program_id = 'foo';

    const program = <Program>{
        getId:               () => program_id,
        ineligibleLockCount: 0,
        rateSteps:           [ true ],
    };

    // rate reply
    const stub_rate_data: RateResult = {
        _unavailable_all: '0',
    };

    const stub_rate_delta: any = {
        "rdelta.ratedata": {
            data:      {
                _unavailable_all: [ undefined ]
            },
            concluding_save: false,
            timestamp: 123
        }
    };

    const createDelta = ( _src: Kv, _dest: Kv ) => {
        return stub_rate_delta[ "rdelta.ratedata" ][ "data" ];
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

    const dao = new class implements ServerDao
    {
        saveQuote(
            quote:      ServerSideQuote,
            success:    ServerDaoCallback,
            _failure:   ServerDaoCallback,
            _save_data: Record<string, any>,
            _push_data: Record<string, any>,
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
            return this;
        }

        saveQuoteRateRetries(): this
        {
            return this;
        }

        updateQuoteRateRetries(
            quote: ServerSideQuote
        ): Promise<ServerSideQuote>
        {
            return Promise.resolve( quote );
        }

        ensurePendingSuppliers(
            quote: ServerSideQuote
        ): Promise<ServerSideQuote>
        {
            return Promise.resolve( quote );
        }

        saveQuoteMeta( _: any, __:any, ___:any, ____:any ): this
        {
            return this;
        }

        mergeData(): this
        {
            return this;
        }

        saveQuoteLockState(): this
        {
            throw new Error( "Unused method" );
        }

        getWorksheet(): Promise<WorksheetData>
        {
            throw new Error( "Unused method" );
        }
    };

    const session = <UserSession>{
        isInternal: () => false,
    };

    const quote = <ServerSideQuote>{
        getProgramId:          () => program_id,
        getProgram:            () => program,
        getId:                 () => <QuoteId>0,
        setLastPremiumDate:    () => quote,
        setRatedDate:          () => quote,
        getRatedDate:          () => <UnixTimestamp>0,
        getLastPremiumDate:    () => <UnixTimestamp>0,
        getCurrentStepId:      () => 0,
        setExplicitLock:       () => quote,
        setRateBucket:         () => quote,
        setRatingData:         () => quote,
        getRatingData:         () => stub_rate_data,
        getBucket:             () => new QuoteDataBucket(),
        getMetabucket:         () => new QuoteDataBucket(),
        getMetaUpdatedDate:    () => <UnixTimestamp>0,
        getProgramVersion:     () => 'Foo',
        getExplicitLockReason: () => 'Reason',
        getExplicitLockStep:   () => <PositiveInteger>1,
        isImported:            () => true,
        isBound:               () => true,
        getTopVisitedStepId:   () => <PositiveInteger>1,
        getTopSavedStepId:     () => <PositiveInteger>1,
        setRetryAttempts:      () => quote,
        getRetryAttempts:      () => 1,
        retryAttempted:        () => quote,
        setMetadata:           () => quote,
        getRetryCount:         () => 0,
    };

    const ts_ctor = () => { return <UnixTimestamp>2592001 };

    return {
        program:         program,
        stub_rate_data:  stub_rate_data,
        stub_rate_delta: stub_rate_delta,
        createDelta:     createDelta,
        rater:           rater,
        raters:          raters,
        logger:          logger,
        dao:             dao,
        session:         session,
        quote:           quote,
        ts_ctor:         ts_ctor,
    };
};
