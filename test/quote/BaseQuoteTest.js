/**
 * Tests BaseQuote
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

const chai = require('chai');
const expect = chai.expect;
const {BaseQuote} = require('../../').quote;
const Program = require('../../src/program/Program').Program;
const Util = require('../../src/test/program/util');

const messages = {
  expire:
    'This quote has expired and cannot be modified. ' +
    'Please contact support with any questions.',
  bound: 'This quote has been bound and cannot be modified.',
};

describe('BaseQuote', () => {
  describe('accessors & mutators', () => {
    [
      {
        property: 'startDate',
        default: 0,
        value: 946684800,
      },
      {
        property: 'initialRatedDate',
        default: 0,
        value: 946684800,
      },
      {
        property: 'agentId',
        default: 0,
        value: 12345678,
      },
      {
        property: 'agentEntityId',
        default: 0,
        value: 12345678,
      },
      {
        property: 'agentName',
        default: '',
        value: 'name',
      },
      {
        property: 'userName',
        default: '',
        value: undefined,
        expected: '',
      },
      {
        property: 'userName',
        default: '',
        value: 'foo@bar.com',
      },
      {
        property: 'createdByUserName',
        default: '',
        value: undefined,
        expected: '',
      },
      {
        property: 'createdByUserName',
        default: '',
        value: 'bar@baz.com',
      },
      {
        property: 'lastUpdatedByUserName',
        default: '',
        value: undefined,
        expected: '',
      },
      {
        property: 'lastUpdatedByUserName',
        default: '',
        value: 'baz@qux.com',
      },
      {
        property: 'imported',
        default: false,
        value: true,
        accessor: 'is',
      },
      {
        property: 'bound',
        default: false,
        value: true,
        accessor: 'is',
      },
      {
        property: 'currentStepId',
        default: 1,
        value: 2,
      },
      {
        property: 'topVisitedStepId',
        default: 1,
        value: 2,
      },
      {
        property: 'topSavedStepId',
        value: 1,
      },
      {
        property: 'error',
        default: '',
        value: 'ERROR',
      },
    ].forEach(testCase => {
      const quote = BaseQuote(123, {}, createStubProgram());
      const property = testCase.property;
      const title_cased = property.charAt(0).toUpperCase() + property.slice(1);
      const setter = (testCase.mutator || 'set') + title_cased;
      const getter = (testCase.accessor || 'get') + title_cased;

      it(property + ' can be mutated and accessed', () => {
        expect(quote[getter].call(quote)).to.equal(testCase.default);
        quote[setter].call(quote, testCase.value);
        const expected =
          typeof testCase.expected !== 'undefined'
            ? testCase.expected
            : testCase.value;
        expect(quote[getter].call(quote)).to.equal(expected);
      });
    });
  });

  describe('locking mechanisms', () => {
    [
      {
        description: 'default values',
        reason: '',
        step: 0,
        bound: false,
        imported: false,
        locks: false,
      },
      {
        description: 'quote with a reason',
        reason: 'reason',
        step: 0,
        bound: false,
        imported: false,
        locks: true,
      },
      {
        description: 'quote with a lock on step #2',
        reason: '',
        step: 2,
        bound: false,
        imported: false,
        locks: false,
      },
      {
        description: 'quote with a reason and a lock on step #2',
        reason: 'reason',
        step: 2,
        bound: false,
        imported: false,
        locks: false,
      },
      {
        description: 'bound quote',
        reason: {given: '', expected: messages.bound},
        step: 0,
        bound: true,
        imported: false,
        locks: true,
      },
      {
        description: 'imported quote',
        reason: '',
        step: 0,
        bound: false,
        imported: true,
        locks: true,
      },
      {
        description: 'bound and imported quote',
        reason: {given: '', expected: messages.bound},
        step: 0,
        bound: true,
        imported: true,
        locks: true,
      },
      {
        description: 'bound quote with a lock on step #2',
        reason: {given: '', expected: messages.bound},
        step: {given: 2, expected: 0},
        bound: true,
        imported: false,
        locks: true,
      },
      {
        description: 'imported quote with a lock on step #2',
        reason: '',
        step: 2,
        bound: false,
        imported: true,
        locks: false,
      },
    ].forEach(testCase => {
      const quote = BaseQuote(123, {});
      const description = 'Locking is correct for ' + testCase.description;
      const bound = !!testCase.bound;
      const imported = !!testCase.imported;
      const locks = !!testCase.locks;

      const givenReason =
        testCase.reason.given !== undefined
          ? '' + testCase.reason.given
          : '' + testCase.reason;
      const expectedReason =
        testCase.reason.expected !== undefined
          ? '' + testCase.reason.expected
          : '' + testCase.reason;

      const givenStep =
        testCase.step.given !== undefined
          ? +testCase.step.given
          : +testCase.step;
      const expectedStep =
        testCase.step.expected !== undefined
          ? +testCase.step.expected
          : +testCase.step;

      it(description, () => {
        expect(quote.getExplicitLockReason()).to.equal('');
        expect(quote.getExplicitLockStep()).to.equal(0);

        quote
          .setBound(bound)
          .setImported(imported)
          .setExplicitLock(givenReason, givenStep);

        expect(quote.getExplicitLockReason()).to.equal(expectedReason);
        expect(quote.getExplicitLockStep()).to.equal(expectedStep);
        expect(quote.isLocked()).to.equal(locks);

        quote.clearExplicitLock();
        expect(quote.getExplicitLockReason()).to.equal(
          bound ? messages.bound : ''
        );
        expect(quote.getExplicitLockStep()).to.equal(0);
      });
    });
  });

  describe('quote expiration', () => {
    [
      {
        description: 'default values',
        currentDate: 0,
        expired: false,
      },
      {
        description: 'quote immediately after start',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
        },
        startDate: 86400,
        expirationDate: 7862400,
        currentDate: 86400,
        expired: false,
      },
      {
        description: 'quote immediately after rate',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
        },
        startDate: 86400000,
        initialRatedDate: 172800,
        expirationDate: 2764800,
        currentDate: 172800,
        expired: false,
      },
      {
        description: 'quote 31 days after rate',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
        },
        startDate: 86400,
        initialRatedDate: 172800,
        expirationDate: 2764800,
        currentDate: 2851200,
        expired: true,
      },
      {
        description: 'quote 31 days after rate (with grace period)',
        lockTimeout: {
          preRateExpiration: 90,
          preRateGracePeriod: 15,
          postRateExpiration: 30,
          postRateGracePeriod: 5,
        },
        startDate: 86400,
        initialRatedDate: 172800,
        expirationDate: 2764800,
        currentDate: 2851200,
        expired: false,
      },
      {
        description: 'quote 62 days after start',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
        },
        startDate: 86400,
        expirationDate: 7862400,
        currentDate: 5356800,
        expired: false,
      },
      {
        description: 'quote 61 days after rate',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
        },
        startDate: 86400, //  01/02/1970 @ 12:00am
        initialRatedDate: 208800, //  01/03/1970 @ 10:00am
        expirationDate: 2800800, //  02/02/1970 @ 10:00pm
        currentDate: 5356800, //  03/04/1970 @ 12:00am
        expired: true,
      },
      {
        description: 'quote 91 days after start',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
        },
        startDate: 118800, //  01/02/1970 @ 9:00am
        expirationDate: 7894800, //  04/02/1970 @ 9:00pm
        currentDate: 7948800, //  04/03/1970 @ 12:00am
        expired: true,
      },
      {
        description: 'quote 91 days after start (with grace period)',
        lockTimeout: {
          preRateExpiration: 90,
          preRateGracePeriod: 15,
          postRateExpiration: 30,
          postRateGracePeriod: 5,
        },
        startDate: 86400,
        expirationDate: 7862400,
        currentDate: 7948800,
        expired: false,
      },
      {
        description: 'quote 121 days after start',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
        },
        startDate: 86400,
        expirationDate: 7862400,
        currentDate: 10540800,
        expired: true,
      },
      {
        description: 'quote 120 days after rate',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
        },
        startDate: 86400,
        initialRatedDate: 172800,
        expirationDate: 2764800,
        currentDate: 10540800,
        expired: true,
      },
      {
        description: 'preRateExpiration set to zero',
        lockTimeout: {
          preRateExpiration: 0,
          postRateExpiration: 30,
        },
        startDate: 86400,
        initialRatedDate: 172800,
        expirationDate: 2764800,
        currentDate: 10540800,
        expired: true,
      },
      {
        description: 'postRateExpiration set to zero',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 0,
        },
        startDate: 86400,
        expirationDate: 7862400,
        currentDate: 10540800,
        expired: true,
      },
      {
        description: 'preRateExpiration and postRateExpiration set to zero',
        lockTimeout: {
          preRateExpiration: 0,
          postRateExpiration: 0,
        },
        startDate: 86400,
        initialRatedDate: 172800,
        expirationDate: Infinity,
        currentDate: 10540800,
        expired: false,
      },
      {
        description: 'renewalExpiration does not expire on day 90 after start',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
          renewalExpiration: 90,
        },
        bucketData: {
          renewal_quote: ['1'],
          eff_date_timestamp: ['10540800'],
        },
        startDate: 118800, //  01/02/1970 @ 9:00am
        expirationDate: 7894800, //  04/02/1970 @ 9:00am
        currentDate: 7912800, //  04/02/1970 @ 2:00pm
        expired: false,
      },
      {
        description: 'renewalExpiration will expire 91 days after start',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
          renewalExpiration: 90,
        },
        bucketData: {
          renewal_quote: ['1'],
          eff_date_timestamp: ['10540800'],
        },
        startDate: 118800, //  01/02/1970 @ 9:00am
        expirationDate: 7894800, //  04/02/1970 @ 9:00am
        currentDate: 7948800, //  04/03/1970 @ 12:00am
        expired: true,
      },
      {
        description:
          'renewalExpiration expires after only 11 days after start, day after the eff date',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
          renewalExpiration: 90,
        },
        bucketData: {
          renewal_quote: ['1'],
          eff_date_timestamp: ['950400'],
        },
        startDate: 86400,
        expirationDate: 950400,
        currentDate: 1036800,
        expired: true,
      },
      {
        description:
          'renewalExpiration will not expire 93 days after start (with grace period)',
        lockTimeout: {
          preRateExpiration: 90,
          preRateGracePeriod: 5,
          postRateExpiration: 30,
          renewalExpiration: 90,
        },
        bucketData: {
          renewal_quote: ['1'],
        },
        startDate: 118800, //  01/02/1970 @ 9:00am
        expirationDate: 7894800, //  04/02/1970 @ 9:00am
        currentDate: 8154000, //  04/05/1970 @ 12:00am
        expired: false,
      },
      {
        description:
          'renewalExpiration will not expire 2 days after effective date (with pre rate grace period)',
        lockTimeout: {
          preRateExpiration: 90,
          postRateExpiration: 30,
          preRateGracePeriod: 5,
          renewalExpiration: 90,
        },
        bucketData: {
          renewal_quote: ['1'],
          eff_date_timestamp: ['824400'], //  01/10/1970 @ 1:00pm
        },
        startDate: 118800, //  01/02/1970 @ 9:00am
        expirationDate: 824400, //  01/10/1970 @ 1:00pm
        currentDate: 1000800, //  01/12/1970 @ 2:00pm
        expired: false,
      },
      {
        description:
          'quote expires even if if renewal_quote does not exist in bucket',
        lockTimeout: {
          preRateExpiration: 90,
        },
        bucketData: {
          eff_date_timestamp: ['824400'], //  01/10/1970 @ 1:00pm
        },
        startDate: 118800, //  01/02/1970 @ 9:00am
        expirationDate: 7894800, //  04/02/1970 @ 9:00am
        currentDate: 7981200, //  04/03/1970 @ 9:00am
        expired: true,
      },
    ].forEach(testCase => {
      let bucket_data = testCase.bucketData;
      if (bucket_data === undefined) {
        bucket_data = {
          renewal_quote: ['0'],
        };
      }
      const bucket = createStubBucket(bucket_data);
      const quote = BaseQuote(
        123,
        bucket,
        createStubProgram(testCase.lockTimeout)
      );
      const description = 'Expiration is correct for ' + testCase.description;
      const start_date = testCase.startDate;
      const initial_rated_date = testCase.initialRatedDate;
      const current_date = testCase.currentDate;
      const expiration_date =
        typeof testCase.expirationDate === 'number'
          ? testCase.expirationDate * 1000
          : undefined;
      const expired = testCase.expired;

      it(description, () => {
        if (start_date !== undefined) {
          quote.setStartDate(start_date);
        }

        if (initial_rated_date !== undefined) {
          quote.setInitialRatedDate(initial_rated_date);
        }

        if (expiration_date !== undefined) {
          expect(quote.getExpirationDate()).to.equal(expiration_date);
        }

        expect(quote.hasExpired(current_date)).to.equal(expired);
      });
    });
  });
});

function createStubProgram(lockTimeout) {
  let stubProgram = Util.stubProgram(Program)();
  stubProgram.lockTimeout = lockTimeout || {};
  return stubProgram;
}

function createStubBucket(metadata) {
  return {
    getDataByName: name => metadata[name],
    getData() {
      return metadata;
    },
  };
}
