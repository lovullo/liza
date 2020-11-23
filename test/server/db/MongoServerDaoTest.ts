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

import {MongoServerDao as Sut} from '../../../src/server/db/MongoServerDao';
import {MongoSelector, MongoUpdate, MongoDb} from 'mongodb';
import {expect, use as chai_use} from 'chai';
import {ServerSideQuote} from '../../../src/server/quote/ServerSideQuote';
import {PositiveInteger} from '../../../src/numeric';
import {ClassificationResult, Program} from '../../../src/program/Program';
import {RateResult} from '../../../src/server/rater/Rater';
import {QuoteDataBucket} from '../../../src/bucket/QuoteDataBucket';
import {QuoteId} from '../../../src/quote/Quote';
import {DataApiResult} from '../../../src/dapi/DataApi';

chai_use(require('chai-as-promised'));

describe('MongoServerDao', () => {
  describe('#saveQuote', () => {
    [
      {
        label:
          'will not unset last updated by user when session data is unavailable',
        username: '',
        expected_set_username: undefined,
      },
      {
        label: 'will set last updated by user when session data is available',
        username: 'foo',
        expected_set_username: ['foo'],
      },
    ].forEach(({label, username, expected_set_username}) => {
      it(label, done => {
        const quote = createStubQuote({});
        quote.getUserName = () => username;

        const sut = new Sut(
          createMockDb(
            // update
            (_selector: MongoSelector, data: MongoUpdate) => {
              expect(data.$set['meta.last_updated_by_username']).to.deep.equal(
                expected_set_username
              );
              done();
            }
          ),
          'test',
          () => <UnixTimestamp>123
        );

        sut.init(() =>
          sut.saveQuote(
            quote,
            () => {},
            () => {}
          )
        );
      });
    });

    describe('with no save data or push data', () => {
      it('saves initial rated individually', done => {
        const expected = 123321;
        const expected_username = 'foo@foo.com';
        const quote = createStubQuote({});

        quote.getRatedDate = () => {
          return <UnixTimestamp>expected;
        };
        quote.getUserName = () => expected_username;

        const sut = new Sut(
          createMockDb(
            // update
            (_selector: MongoSelector, data: MongoUpdate) => {
              expect(
                data.$set['meta.liza_timestamp_initial_rated']
              ).to.deep.equal([expected]);

              expect(
                data.$setOnInsert['meta.created_by_username']
              ).to.deep.equal([expected_username]);

              expect(data.$push).to.equal(undefined);

              done();
            }
          ),
          'test',
          () => {
            return <UnixTimestamp>123;
          }
        );

        sut.init(() =>
          sut.saveQuote(
            quote,
            () => {},
            () => {}
          )
        );
      });
    });

    describe('bound by username', () => {
      [
        {
          label: 'will set bound_by_username when quote is imported',
          username: 'foo@foo.com',
          expected_bound_username: ['foo@foo.com'],
          is_imported: true,
        },
        {
          label: 'will not set bound_by_username when quote is not imported',
          username: 'foo@foo.com',
          expected_bound_username: undefined,
          is_imported: false,
        },
      ].forEach(({label, username, expected_bound_username, is_imported}) => {
        it(label, done => {
          const quote = createStubQuote({});

          quote.getUserName = () => username;
          quote.isImported = () => is_imported;

          const sut = new Sut(
            createMockDb(
              // update
              (_selector: MongoSelector, data: MongoUpdate) => {
                expect(data.$set['meta.bound_by_username']).to.deep.equal(
                  expected_bound_username
                );

                done();
              }
            ),
            'test',
            () => {
              return <UnixTimestamp>123;
            }
          );

          sut.init(() =>
            sut.saveQuote(
              quote,
              () => {},
              () => {}
            )
          );
        });
      });
    });

    describe('with force_publish', () => {
      it('forced_reset resets published indicator', done => {
        const expected_ts = <UnixTimestamp>12345;
        const quote = createStubQuote({published: true});
        const sut = new Sut(
          createMockDb(
            // update
            (_selector: MongoSelector, data: MongoUpdate) => {
              expect(data.$set['published']).to.deep.equal(false);
              expect(data.$set['publishResetTs']).to.deep.equal(expected_ts);
              done();
            }
          ),
          'test',
          () => {
            return expected_ts;
          }
        );

        sut.init(() =>
          sut.saveQuote(
            quote,
            () => {},
            () => {},
            undefined,
            {},
            true
          )
        );
      });

      it('not forced will not change published indicator', done => {
        const quote = createStubQuote({published: true});
        const sut = new Sut(
          createMockDb(
            // update
            (_selector: MongoSelector, data: MongoUpdate) => {
              expect(data.$set['published']).to.not.exist;
              expect(data.$set['publishResetTs']).to.not.exist;
              done();
            }
          ),
          'test',
          () => {
            return <UnixTimestamp>123;
          }
        );

        sut.init(() =>
          sut.saveQuote(
            quote,
            () => {},
            () => {},
            undefined,
            {},
            false
          )
        );
      });
    });

    describe('with push data', () => {
      it('adds push data to the collection', done => {
        const push_data = {
          foo: ['bar', 'baz'],
          bar: [{quux: 'quuux'}],
        };

        const quote = createStubQuote({});

        const sut = new Sut(
          createMockDb(
            // update
            (_selector: MongoSelector, data: MongoUpdate) => {
              expect(data.$push['foo']).to.deep.equal(push_data.foo);

              expect(data.$push['bar']).to.deep.equal(push_data.bar);

              done();
            }
          ),
          'test',
          () => {
            return <UnixTimestamp>123;
          }
        );

        sut.init(() =>
          sut.saveQuote(
            quote,
            () => {},
            () => {},
            undefined,
            push_data
          )
        );
      });

      it('skips push data when it is an empty object', done => {
        const push_data = {};

        const quote = createStubQuote({});

        const sut = new Sut(
          createMockDb(
            // update
            (_selector: MongoSelector, data: MongoUpdate) => {
              expect(data.$push).to.equal(undefined);

              done();
            }
          ),
          'test',
          () => {
            return <UnixTimestamp>123;
          }
        );

        sut.init(() =>
          sut.saveQuote(
            quote,
            () => {},
            () => {},
            undefined,
            push_data
          )
        );
      });
    });
  });
});

function createMockDb(on_update: any): MongoDb {
  const collection_quotes = {
    update: on_update,
    createIndex: (_: any, __: any, c: any) => c(),
  };

  const collection_seq = {
    find(_: any, __: any, c: any) {
      c(null, {
        toArray: (c: any) => c(null, {length: 5}),
      });
    },
  };

  const db = {
    collection(id: any, c: any) {
      const coll = id === 'quotes' ? collection_quotes : collection_seq;

      c(null, coll);
    },
  };

  const driver = <MongoDb>{
    open: (c: any) => c(null, db),
    close: () => {},
    on: () => {},
  };

  return driver;
}

function createStubQuote(metadata: Record<string, any>) {
  const program = <Program>(<unknown>{
    clearNaFields: false,
    naFieldValue: '',
    getId: () => '1',
    ineligibleLockCount: 0,
    cretain: {},
    defaults: {},
    apis: {},
    internal: {},
    autosave: false,
    whens: {},
    groupWhens: {},
    meta: {
      arefs: {},
      fields: {},
      groups: {},
      qdata: {},
      qtypes: {},
    },
    mapis: {},
    rateSteps: [],
    dapi: () => <DataApiResult>{},
    initQuote: () => {},
    getClassifierKnownFields: () => <ClassificationResult>{},
    classify: () => <ClassificationResult>{},
    hasNaField: () => false,
    hasKnownType: () => true,
  });

  const quote = <ServerSideQuote>(<unknown>{
    getBucket: () =>
      <QuoteDataBucket>{
        getData: () => {
          return {};
        },
      },

    getMetabucket: () =>
      <QuoteDataBucket>{
        getData: () => metadata,
      },

    getId: () => <QuoteId>123,
    getProgramVersion: () => 'Foo',
    getLastPremiumDate: () => <UnixTimestamp>0,
    getUserName: () => 'foo@foo.com',
    getRatedDate: () => <UnixTimestamp>0,
    getExplicitLockReason: () => '',
    getExplicitLockStep: () => <PositiveInteger>1,
    isImported: () => false,
    isBound: () => false,
    getTopVisitedStepId: () => <PositiveInteger>1,
    getTopSavedStepId: () => <PositiveInteger>1,
    setTopSavedStepId: () => quote,
    getMetaUpdatedDate: () => <UnixTimestamp>0,
    setRatedDate: () => quote,
    setRateBucket: () => quote,
    setRatingData: () => quote,
    getRatingData: () => <RateResult>{_unavailable_all: '0'},
    getProgram: () => program,
    setExplicitLock: () => quote,
    getProgramId: () => 'Foo',
    getCurrentStepId: () => 0,
    setCurrentStepId: () => quote,
    setLastPremiumDate: () => quote,
    setRetryAttempts: () => quote,
    getRetryAttempts: () => 1,
    retryAttempted: () => quote,
    setMetadata: () => quote,
    setInitialRatedDate: () => quote,
    getExpirationDate: () => 123,
  });

  return quote;
}
