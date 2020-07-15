/**
 * Tests ProgramQuoteCleaner
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

const {expect} = require('chai');
const Sut = require('../../../').server.quote.ProgramQuoteCleaner;

describe('ProgramQuoteCleaner', () => {
  describe('group cleaning', () => {
    [
      {
        label: 'expands indexes of linked and non-linked groups',

        group_index: {
          one: 'field11', // linked
          two: 'field11', // linked
          three: 'field31',
        },

        exclusive: {
          one: ['field11', 'field12'],
          two: ['field21', 'field22'],
          three: ['field31', 'field32', 'unknown_ignore_me'],
        },

        defaults: {
          field12: '12default',
        },

        qtypes: {
          field11: {type: 'text'},
          field12: {type: 'text'},
          field21: {type: 'text'},
          field22: {type: 'text'},
          field31: {type: 'text'},

          // ancient pre-"liza" data representation
          field32: 'text',
        },

        existing: {
          field11: ['1', '', '3'], // leader one, two
          field12: ['a', 'b'],
          field21: ['e'],
          field22: ['I', 'II'],
          field31: ['i', 'ii'], // leader three
          field32: ['x'],
        },

        expected: {
          field12: [, , '12default'],
          field21: [, '', ''],
          field22: [, , ''],
          field32: [, ''],
        },
      },
    ].forEach(test =>
      it(test.label, done => {
        const quote = createStubQuote(test.existing, {});
        const program = createStubProgram({});

        program.defaults = test.defaults;
        program.groupIndexField = test.group_index;
        program.groupExclusiveFields = test.exclusive;
        program.meta.qtypes = test.qtypes;

        const updates = {};

        quote.setData = given =>
          Object.keys(given).forEach(k => (updates[k] = given[k]));

        Sut(program).clean(quote, err => {
          expect(err).to.deep.equal(null);
          expect(updates).to.deep.equal(test.expected);

          done();
        });
      })
    );
  });

  describe('metadata cleaning', () => {
    [
      {
        label: 'populates all fields when empty',
        existing: {},
        fields: {foo: {}, bar: {}},
        expected: {foo: [], bar: []},
      },
      {
        label: 'populates only missing fields when non-empty',
        existing: {foo: [1], baz: [2]},
        fields: {foo: {}, bar: {}},
        expected: {foo: [1], bar: [], baz: [2]},
      },
      {
        label: 'does nothing with no fields',
        existing: {foo: [1], baz: [2]},
        fields: {},
        expected: {foo: [1], baz: [2]},
      },
    ].forEach(({label, existing, fields, expected}) =>
      it(label, done => {
        const quote = createStubQuote({}, existing);
        const program = createStubProgram(fields);

        Sut(program).clean(quote, err => {
          expect(err).to.equal(null);
          expect(quote.getMetabucket().getData()).to.deep.equal(expected);

          done();
        });
      })
    );
  });
});

function createStubQuote(data, metadata) {
  return {
    getProgramId: () => 'foo',
    setData: () => {},
    getDataByName: name => data[name],
    getMetabucket: () => ({
      getDataByName: name => metadata[name],
      getData: () => metadata,
      setValues: data => {
        Object.keys(data).forEach(
          field_name => (metadata[field_name] = data[field_name])
        );
      },
    }),
  };
}

function createStubProgram(meta_fields) {
  return {
    getId: () => 'foo',
    meta: {fields: meta_fields},
    defaults: {},
  };
}
