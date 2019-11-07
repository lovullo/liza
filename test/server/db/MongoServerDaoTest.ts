/**
 * Tests MongoServerDao
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

import { MongoServerDao as Sut } from "../../../src/server/db/MongoServerDao";
import { MongoSelector, MongoUpdate } from "mongodb";
import { expect, use as chai_use } from 'chai';
import { ServerSideQuote } from "../../../src/server/quote/ServerSideQuote";
import { PositiveInteger } from "../../../src/numeric";
import { Program } from "../../../src/program/Program";
import { RateResult } from "../../../src/server/rater/Rater";
import { QuoteDataBucket } from "../../../src/bucket/QuoteDataBucket";
import { QuoteId } from "../../../src/quote/Quote";

chai_use( require( 'chai-as-promised' ) );


describe( 'MongoServerDao', () =>
{
    describe( '#saveQuote', () =>
    {
        describe( "with no save data or push data", () =>
        {
            it( "saves entire metabucket record individually", done =>
            {
                const metadata = {
                    foo: [ 'bar', 'baz' ],
                    bar: [ { quux: 'quuux' } ],
                };

                const quote = createStubQuote( metadata );

                const sut = new Sut( createMockDb(
                    // update
                    ( _selector: MongoSelector, data: MongoUpdate ) =>
                    {
                        expect( data.$set[ 'meta.foo' ] )
                            .to.deep.equal( metadata.foo );

                        expect( data.$set[ 'meta.bar' ] )
                            .to.deep.equal( metadata.bar );


                        expect( data.$push ).to.equal( undefined );

                        done();
                    }
                ) );

                sut.init( () =>
                    sut.saveQuote( quote, () => {}, () => {} )
                );
            } );
        } );

        describe( "with push data", () =>
        {
            it( "adds push data to the collection", done =>
            {
                const push_data = {
                    foo: [ 'bar', 'baz' ],
                    bar: [ { quux: 'quuux' } ],
                };

                const quote = createStubQuote( {} );

                const sut = new Sut( createMockDb(
                    // update
                    (_selector: MongoSelector, data: MongoUpdate ) =>
                    {
                        expect( data.$push[ 'foo' ] )
                            .to.deep.equal( push_data.foo );

                        expect( data.$push[ 'bar' ] )
                            .to.deep.equal( push_data.bar );

                        done();
                    }
                ) );

                sut.init( () =>
                    sut.saveQuote(
                        quote,
                        () => {},
                        () => {},
                        undefined,
                        push_data
                    )
                );
            } );

            it( "skips push data when it is an empty object", done =>
            {
                const push_data = {};

                const quote = createStubQuote( {} );

                const sut = new Sut( createMockDb(
                    // update
                    ( _selector: MongoSelector, data: MongoUpdate ) =>
                    {
                        expect( data.$push ).to.equal( undefined );

                        done();
                    }
                ) );

                sut.init( () =>
                    sut.saveQuote(
                        quote,
                        () => {},
                        () => {},
                        undefined,
                        push_data
                    )
                );
            } );
        } );
    } );
} );


function createMockDb( on_update: any )
{
    const collection_quotes = {
        update: on_update,
        createIndex: ( _: any, __: any, c: any ) => c(),
    };

    const collection_seq = {
        find( _: any, __: any, c: any )
        {
            c( null, {
                toArray: ( c: any ) => c( null, { length: 5 } ),
            } );
        },
    };

    const db = {
        collection( id: any, c: any )
        {
            const coll = ( id === 'quotes' )
                ? collection_quotes
                : collection_seq;

            c( null, coll );
        },
    };

    const driver = {
        open: ( c: any ) => c( null, db ),
        on:   () => {},
    };

    return driver;
}


function createStubQuote( metadata: Record<string, any> )
{
    const program = <Program>{
        getId:               () => '1',
        ineligibleLockCount: 0,
        apis:                {},
        internal:            {},
        meta:                {
            arefs:  {},
            fields: {},
            groups: {},
            qdata:  {},
            qtypes: {},
        },
        mapis:               {},
        initQuote:           () => {},
    };

    const quote = <ServerSideQuote>{
        getBucket: () => <QuoteDataBucket>( {
            getData: () => {},
        } ),

        getMetabucket: () => <QuoteDataBucket>( {
            getData: () => metadata,
        } ),

        getId:                 () => <QuoteId>123,
        getProgramVersion:     () => 'Foo',
        getLastPremiumDate:    () => <UnixTimestamp>0,
        getRatedDate:          () => <UnixTimestamp>0,
        getExplicitLockReason: () => "",
        getExplicitLockStep:   () => <PositiveInteger>1,
        isImported:            () => false,
        isBound:               () => false,
        getTopVisitedStepId:   () => <PositiveInteger>1,
        getTopSavedStepId:     () => <PositiveInteger>1,
        setRatedDate:          () => quote,
        setRateBucket:         () => quote,
        setRatingData:         () => quote,
        getRatingData:         () => <RateResult>{ _unavailable_all: '0' },
        getProgram:            () => program,
        setExplicitLock:       () => quote,
        getProgramId:          () => 'Foo',
        getCurrentStepId:      () => 0,
        setLastPremiumDate:    () => quote,
    };

    return quote;
}
