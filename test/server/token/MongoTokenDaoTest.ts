/**
 * Token state management test
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
  TokenData,
  TokenQueryResult,
  TokenStatus,
} from '../../../src/server/token/TokenDao';

import {MongoTokenDao as Sut} from '../../../src/server/token/MongoTokenDao';
import {MongoCollection} from 'mongodb';
import {
  TokenId,
  TokenNamespace,
  TokenState,
} from '../../../src/server/token/Token';

import {DocumentId} from '../../../src/document/Document';
import {UnknownTokenError} from '../../../src/server/token/UnknownTokenError';
import {hasContext} from '../../../src/error/ContextError';

import {expect, use as chai_use} from 'chai';
chai_use(require('chai-as-promised'));

describe('server.token.TokenDao', () => {
  describe('#updateToken', () => {
    const field = 'foo_field';
    const did = <DocumentId>12345;
    const ns = <TokenNamespace>'namespace';
    const tok_id = <TokenId>'tok123';
    const tok_type = TokenState.DONE;
    const data = 'some data';
    const timestamp = <UnixTimestamp>12345;

    const root = field + '.' + ns;

    const last_tok_id = <TokenId>'last-tok';

    const last: TokenStatus = {
      type: TokenState.DEAD,
      timestamp: <UnixTimestamp>4567,
      data: 'last token',
    };

    const prev: TokenStatus = {
      type: TokenState.ACTIVE,
      timestamp: <UnixTimestamp>11111,
      data: 'prev status',
    };

    (<{label: string; given: TokenQueryResult; expected: TokenData}[]>[
      {
        label: 'updates token and returns previous data',

        given: {
          [field]: {
            [ns]: {
              last: last_tok_id,
              lastState: {
                [prev.type]: last_tok_id,
              },
              lastStatus: {
                type: last.type,
                timestamp: last.timestamp,
                data: last.data,
              },
              [tok_id]: {
                status: {
                  type: prev.type,
                  timestamp: prev.timestamp,
                  data: prev.data,
                },
              },
            },
          },
        },
        expected: {
          id: tok_id,
          status: {
            type: tok_type,
            timestamp: timestamp,
            data: data,
          },
          prev_state: {
            [prev.type]: last_tok_id,
          },
          prev_status: prev,
          prev_last: {
            id: last_tok_id,
            status: last,
            prev_status: null,
            prev_last: null,
            prev_state: {},
          },
        },
      },

      {
        label: 'returns null for prev status if missing data',

        given: {
          [field]: {
            [ns]: {
              last: last_tok_id,
              lastStatus: {
                type: last.type,
                timestamp: last.timestamp,
                data: last.data,
              },
            },
          },
        },
        expected: {
          id: tok_id,
          status: {
            type: tok_type,
            timestamp: timestamp,
            data: data,
          },
          prev_status: null,
          prev_state: {},
          prev_last: {
            id: last_tok_id,
            status: last,
            prev_status: null,
            prev_last: null,
            prev_state: {},
          },
        },
      },

      {
        label: 'returns null for missing namespace data',

        given: {
          [field]: {
            [ns]: {},
          },
        },
        expected: {
          id: tok_id,
          status: {
            type: tok_type,
            timestamp: timestamp,
            data: data,
          },
          prev_status: null,
          prev_state: {},
          prev_last: null,
        },
      },

      {
        label: 'returns null for missing namespace',

        given: {
          [field]: {},
        },
        expected: {
          id: tok_id,
          status: {
            type: tok_type,
            timestamp: timestamp,
            data: data,
          },
          prev_status: null,
          prev_state: {},
          prev_last: null,
        },
      },

      {
        label: 'returns null for missing root field',

        given: {},
        expected: {
          id: tok_id,
          status: {
            type: tok_type,
            timestamp: timestamp,
            data: data,
          },
          prev_status: null,
          prev_state: {},
          prev_last: null,
        },
      },
    ]).forEach(({given, expected, label}) =>
      it(label, () => {
        const coll: MongoCollection = {
          findAndModify(selector, _sort, given_data, options, callback) {
            const expected_entry: TokenStatus = {
              type: tok_type,
              timestamp: timestamp,
              data: data,
            };

            expect(selector.id).to.equal(did);

            expect(given_data).to.deep.equal({
              $set: {
                [`${root}.last`]: tok_id,
                [`${root}.lastState.${tok_type}`]: tok_id,
                [`${root}.lastStatus`]: expected_entry,
                [`${root}.${tok_id}.status`]: expected_entry,
              },
              $push: {
                [`${root}.${tok_id}.statusLog`]: expected_entry,
              },
            });

            expect(options).to.deep.equal({
              upsert: true,
              new: false,
              fields: {
                [`${root}.last`]: 1,
                [`${root}.lastState`]: 1,
                [`${root}.lastStatus`]: 1,
                [`${root}.${tok_id}.status`]: 1,
              },
            });

            callback(null, given);
          },

          update() {},
          findOne() {},
          find() {},
          createIndex() {},
          insert() {},
        };

        return expect(
          new Sut(coll, field, () => timestamp).updateToken(
            did,
            ns,
            tok_id,
            tok_type,
            data
          )
        ).to.eventually.deep.equal(expected);
      })
    );

    it('proxies error to callback', () => {
      const expected_error = Error('expected error');

      const coll: MongoCollection = {
        findAndModify(_selector, _sort, _update, _options, callback) {
          callback(expected_error, {});
        },

        update() {},
        findOne() {},
        find() {},
        createIndex() {},
        insert() {},
      };

      return expect(
        new Sut(coll, 'foo', () => <UnixTimestamp>0).updateToken(
          <DocumentId>0,
          <TokenNamespace>'ns',
          <TokenId>'id',
          TokenState.DONE,
          null
        )
      ).to.eventually.be.rejectedWith(expected_error);
    });
  });

  describe('#getToken', () => {
    const field = 'get_field';
    const did = <DocumentId>12345;
    const ns = <TokenNamespace>'get_ns';

    const expected_status: TokenStatus = {
      type: TokenState.ACTIVE,
      timestamp: <UnixTimestamp>0,
      data: '',
    };

    const last_tok_id = <TokenId>'last-tok';

    const last: TokenStatus = {
      type: TokenState.DEAD,
      timestamp: <UnixTimestamp>4567,
      data: 'last token',
    };

    (<[string, TokenId, TokenQueryResult, TokenData | null, any, any][]>[
      [
        'retrieves token by id',
        <TokenId>'tok123',
        {
          [field]: {
            [ns]: {
              last: last_tok_id,
              lastState: {
                [TokenState.ACTIVE]: last_tok_id,
                [TokenState.DONE]: last_tok_id,
              },
              lastStatus: last,

              tok123: {
                status: expected_status,
                statusLog: [expected_status],
              },
            },
          },
        },
        {
          id: <TokenId>'tok123',
          status: expected_status,
          prev_status: expected_status,
          prev_state: {
            [TokenState.ACTIVE]: last_tok_id,
            [TokenState.DONE]: last_tok_id,
          },
          prev_last: {
            id: last_tok_id,
            status: last,
            prev_status: null,
            prev_last: null,
            prev_state: {},
          },
        },
        null,
        null,
      ],

      [
        'rejects for namespace if token is not found',
        <TokenId>'tok123',
        {
          [field]: {
            [ns]: {
              last: last_tok_id,
              lastStatus: last,

              // just to make sure we don't grab another tok
              othertok: {
                status: expected_status,
                statusLog: [expected_status],
              },
            },
          },
        },
        null,
        `${ns}.tok123`,
        {
          doc_id: did,
          quote_id: did,
          ns: ns,
          token_id: 'tok123',
        },
      ],

      [
        'rejects if namespace is not found',
        <TokenId>'tok123',
        {
          [field]: {},
        },
        null,
        ns,
        {
          doc_id: did,
          quote_id: did,
          ns: ns,
        },
      ],

      [
        'returns last modified token given no token id',
        <TokenId>'',
        {
          [field]: {
            [ns]: {
              last: last_tok_id,
              lastState: {
                [TokenState.DEAD]: last_tok_id,
              },
              lastStatus: last,

              [last_tok_id]: {
                status: expected_status,
                statusLog: [expected_status],
              },
            },
          },
        },
        {
          id: last_tok_id,
          status: last,
          prev_status: last,
          prev_state: {
            [TokenState.DEAD]: last_tok_id,
          },
          prev_last: {
            id: last_tok_id,
            status: last,
            prev_status: null,
            prev_last: null,
            prev_state: {},
          },
        },
        null,
        null,
      ],

      [
        'rejects unknown last modified token given no token id',
        <TokenId>'',
        {
          [field]: {
            [ns]: {},
          },
        },
        null,
        ns,
        {
          doc_id: did,
          quote_id: did,
          ns: ns,
        },
      ],

      [
        'rejects unknown namespace token given no token id',
        <TokenId>'',
        {
          [field]: {},
        },
        null,
        ns,
        {
          doc_id: did,
          quote_id: did,
          ns: ns,
        },
      ],
    ]).forEach(([label, tok_id, dbresult, expected, fmsg, fcontext]) =>
      it(label, () => {
        const coll: MongoCollection = {
          findOne(selector, {fields}, callback) {
            const expected_fields = {
              [`${field}.${ns}.last`]: 1,
              [`${field}.${ns}.lastState`]: 1,
              [`${field}.${ns}.lastStatus`]: 1,
            };

            if (tok_id) {
              expected_fields[`${field}.${ns}.${tok_id}`] = 1;
            }

            expect(fields).to.deep.equal(expected_fields);
            expect(selector).to.deep.equal({id: did});

            callback(null, dbresult);
          },

          update() {},
          findAndModify() {},
          find() {},
          createIndex() {},
          insert() {},
        };

        const result = new Sut(coll, field, () => <UnixTimestamp>0).getToken(
          did,
          ns,
          tok_id
        );

        return fmsg !== null
          ? Promise.all([
              expect(result).to.eventually.be.rejectedWith(
                UnknownTokenError,
                fmsg
              ),
              expect(result).to.eventually.be.rejectedWith(
                UnknownTokenError,
                '' + did
              ),
              result.catch(e => {
                if (!hasContext(e)) {
                  // TS will soon have type assertions and
                  // then this conditional and return can be
                  // removed
                  return expect.fail();
                }

                return expect(e.context).to.deep.equal(fcontext);
              }),
            ])
          : expect(result).to.eventually.deep.equal(expected);
      })
    );

    it('proxies error to callback', () => {
      const expected_error = Error('expected error');

      const coll: MongoCollection = {
        findOne(_selector, _fields, callback) {
          callback(expected_error, {});
        },

        update() {},
        findAndModify() {},
        find() {},
        createIndex() {},
        insert() {},
      };

      return expect(
        new Sut(coll, 'foo', () => <UnixTimestamp>0).getToken(
          <DocumentId>0,
          <TokenNamespace>'ns',
          <TokenId>'id'
        )
      ).to.eventually.be.rejectedWith(expected_error);
    });
  });
});
