/**
 * Tests document loading
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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

import {expect} from 'chai';
import * as E from 'fp-ts/Either';

import {
  applyDocumentDefaults,
  cleanDocument,
} from '../../../src/server/quote/loader';
import {Program} from '../../../src/program/Program';
import {DocumentData} from '../../../src/server/db/MongoServerDao';
import {ServerSideQuote} from '../../../src/server/quote/ServerSideQuote';

describe('loader.applyDocumentDefaults', () => {
  [
    {
      label: 'initializes defaults',
      defaults: {a: 'one', b: 'two'},
      meta: {
        groups: {},
        qtypes: {
          a: {type: 'noyes'},
          b: {type: 'noyes'},
        },
      },
      groupExclusiveFields: {
        Something: ['a', 'b'],
      },
      doc_data: {},
      expected: {
        a: ['one'],
        b: ['two'],
      },
    },
    // for ancient versions of liza-proguic (before it was even called
    // "liza")
    {
      label: 'initializes defaults for ancient data representations',
      defaults: {a: 'one', b: 'two'},
      meta: {
        groups: {},
        qtypes: {
          a: 'noyes',
          b: 'noyes',
        },
      },
      groupExclusiveFields: {
        Something: ['a', 'b'],
      },
      doc_data: {},
      expected: {
        a: ['one'],
        b: ['two'],
      },
    },
    {
      label: 'does nothing with no data or defaults',
      defaults: {},
      meta: {
        groups: {},
      },
      groupExclusiveFields: {},
      doc_data: {},
      expected: {},
    },
    {
      label: 'produces empty object given undefined data',
      defaults: {},
      meta: {
        groups: {},
      },
      groupExclusiveFields: {},
      doc_data: undefined,
      expected: {},
    },
    {
      label: 'keeps existing data with defaults',
      defaults: {
        foo: 'init',
        bar: 'test',
      },
      meta: {
        groups: {},
        qtypes: {
          foo: {type: 'noyes'},
          bar: {type: 'noyes'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
        SomethingElse: ['bar'],
      },
      doc_data: {bar: ['baz']},
      expected: {
        foo: ['init'],
        bar: ['baz'],
      },
    },
    {
      label: 'keeps existing data with no defaults',
      defaults: {},
      meta: {
        groups: {},
        qtypes: {
          bar: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        SomethingElse: ['bar'],
      },
      doc_data: {bar: ['baz']},
      expected: {
        bar: ['baz'],
      },
    },
    {
      label: 'does not overwrite existing data with defaults',
      defaults: {foo: 'init'},
      meta: {
        groups: {},
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {foo: ['bar']},
      expected: {
        foo: ['bar'],
      },
    },
    {
      label: 'does not overwrite existing data with defaults and multiple rows',
      defaults: {foo: 'init'},
      meta: {
        groups: {
          Something: {
            min: 3,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {foo: ['bar', 'baz', 'test']},
      expected: {
        foo: ['bar', 'baz', 'test'],
      },
    },
    {
      label: 'initializes with default bucket data',
      defaults: {foo: 'init'},
      meta: {
        groups: {
          Something: {
            min: 5,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {},
      expected: {
        foo: ['init', 'init', 'init', 'init', 'init'],
      },
    },
    {
      label: 'does not reset applicable fields on init',
      defaults: {foo: 'init'},
      whens: {},
      meta: {
        groups: {
          Something: {
            min: 2,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {},
      expected: {
        foo: ['init', 'init'],
      },
      clearNaFields: true,
      naFieldValue: '',
    },
    {
      label: 'does not reset retained fields on init',
      defaults: {foo: 'init'},
      cretain: {foo: true},
      meta: {
        groups: {
          Something: {
            min: 2,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {},
      expected: {
        foo: ['init', 'init'],
      },
      clearNaFields: true,
      naFieldValue: '',
    },
    {
      label: 'fix missing bucket data values',
      defaults: {foo: 'init'},
      meta: {
        groups: {
          Something: {
            min: 5,
          },
        },
        qtypes: {
          foo: {type: 'text'},
        },
      },
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {
        foo: ['1', '2', '3', '4'],
      },
      expected: {
        foo: ['1', '2', '3', '4', 'init'],
      },
    },
    {
      label: 'ignores undefined types',
      defaults: {foo: 'default'},
      meta: {
        groups: {},
        qtypes: {
          foo: {type: 'undefined'},
        },
      },
      hasKnownType: () => false,
      groupExclusiveFields: {
        Something: ['foo'],
      },
      doc_data: {},
      expected: {},
    },
  ].forEach(
    ({
      label,
      doc_data,
      defaults,
      meta,
      groupExclusiveFields,
      expected,
      clearNaFields,
      naFieldValue,
      whens,
      cretain,
      hasKnownType,
    }) => {
      it(label, () => {
        const program = <Program>(<unknown>{
          id: 'foo',
          defaults: defaults,
          meta: meta,
          groupExclusiveFields: groupExclusiveFields,
          whens: whens ? whens : defaults,
          clearNaFields,
          naFieldValue,
          cretain: cretain ? cretain : {},
          hasKnownType: hasKnownType ? hasKnownType : () => true,
        });

        expect(
          applyDocumentDefaults(program)(<DocumentData>{data: doc_data})().data
        ).to.deep.equal(expected);
      });
    }
  );
});

describe('cleanQuote', () => {
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

        hasKnownType: (name: string) => name !== 'unknown_ignore_me',
      },
    ].forEach(test =>
      it(test.label, () => {
        const quote = createStubQuote(test.existing, {});
        const program = createStubProgram({});

        program.defaults = test.defaults;
        program.groupIndexField = test.group_index;
        program.groupExclusiveFields = test.exclusive;
        program.meta.qtypes = test.qtypes;
        program.whens = {
          field11: ['--vis-field11'],
          field12: ['--vis-field12'],
        };
        program.hasNaField = () => false;
        program.hasKnownType = test.hasKnownType
          ? test.hasKnownType
          : () => true;

        const updates: Record<string, any> = {};

        quote.setData = given => {
          Object.keys(given).forEach(k => (updates[k] = given[k]));
          return quote;
        };

        return cleanDocument(<Program>program)(quote)().then(result => {
          expect(E.isRight(result)).to.be.true;
          expect(updates).to.deep.equal(test.expected);
        });
      })
    );
  });

  describe('fixGroup', () => {
    [
      {
        label: 'clears NA fields when vector',

        group_index: {
          one: 'field11', // linked
        },

        exclusive: {
          one: ['field11', 'field12'],
        },

        defaults: {
          field12: '12default',
        },

        qtypes: {
          field11: {type: 'text'},
          field12: {type: 'text'},
        },

        existing: {
          field11: ['1', '', '3'], // leader one, two
          field12: ['a', 'b'],
        },

        expected: {
          field12: [, , ''],
        },

        bucket: {
          field11: [1, 1, 0],
          field12: [1, 1],
        },

        classify: {
          '--vis-field11': {is: true, indexes: [1, 1, 0]},
          '--vis-field12': {is: true, indexes: [1, 1]},
        },
      },

      {
        label: 'clears NA fields when matrix',

        group_index: {
          one: 'field11', // linked
        },

        exclusive: {
          one: ['field11', 'field12'],
        },

        defaults: {
          field12: '12default',
        },

        qtypes: {
          field11: {type: 'text'},
          field12: {type: 'text'},
        },

        existing: {
          field11: ['1', '', '3'], // leader one, two
          field12: ['a', 'b'],
        },

        expected: {
          field12: [, , ''],
        },

        bucket: {
          field11: [1, 1, 0],
          field12: [1, 1],
        },

        classify: {
          '--vis-field11': {
            is: true,
            indexes: [
              [1, 1, 1],
              [1, 1, 1],
              [0, 0, 0],
            ],
          },
          '--vis-field12': {
            is: true,
            indexes: [
              [1, 1, 1],
              [1, 1, 1],
            ],
          },
        },
      },
      {
        label: 'applies default values when visible as vector',

        group_index: {
          one: 'field11', // linked
        },

        exclusive: {
          one: ['field11', 'field12'],
        },

        defaults: {
          field12: '12default',
        },

        qtypes: {
          field11: {type: 'text'},
          field12: {type: 'text'},
        },

        existing: {
          field11: ['1', '', '3'], // leader one, two
          field12: ['a', 'b'],
        },

        expected: {
          field12: [, , '12default'],
        },

        bucket: {
          field11: [1, 1, 1],
          field12: [1, 1],
        },

        classify: {
          '--vis-field11': {is: true, indexes: [1, 1, 1]},
          '--vis-field12': {is: true, indexes: [1, 1]},
        },

        hasNaField: () => false,
      },
      {
        label: 'applies default values when visible as matrix',

        group_index: {
          one: 'field11', // linked
        },

        exclusive: {
          one: ['field11', 'field12'],
        },

        defaults: {
          field12: '12default',
        },

        qtypes: {
          field11: {type: 'text'},
          field12: {type: 'text'},
        },

        existing: {
          field11: ['1', '', '3'], // leader one, two
          field12: ['a', 'b'],
        },

        expected: {
          field12: [, , '12default'],
        },

        bucket: {
          field11: [1, 1, 1],
          field12: [1, 1],
        },

        classify: {
          '--vis-field11': {
            is: true,
            indexes: [
              [1, 1, 1],
              [1, 1, 1],
              [0, 1, 0],
            ],
          },
          '--vis-field12': {
            is: true,
            indexes: [
              [1, 1, 1],
              [1, 1, 1],
            ],
          },
        },

        hasNaField: () => false,
      },
    ].forEach(test =>
      it(test.label, () => {
        const quote = createStubQuote(test.existing, {});
        const program = createStubProgram({});

        program.defaults = test.defaults;
        program.groupIndexField = test.group_index;
        program.groupExclusiveFields = test.exclusive;
        program.meta.qtypes = test.qtypes;
        program.clearNaFields = true;
        program.naFieldValue = '';
        program.whens = {
          field11: ['--vis-field11'],
          field12: ['--vis-field12'],
        };

        program.hasNaField = test.hasNaField ? test.hasNaField : () => true;
        program.hasKnownType = () => true;

        program.classify = () => test.classify;

        quote.getBucket = () =>
          <any>{
            getData() {
              return test.bucket;
            },
          };

        const updates: Record<string, any> = {};

        quote.setData = given => {
          Object.keys(given).forEach(k => (updates[k] = given[k]));
          return quote;
        };

        return cleanDocument(<Program>program)(quote)().then(result => {
          expect(E.isRight(result)).to.be.true;
          expect(updates).to.deep.equal(test.expected);
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
      it(label, () => {
        const quote = createStubQuote({}, existing);
        const program = createStubProgram(fields);

        return cleanDocument(<Program>program)(quote)().then(result => {
          expect(E.isRight(result)).to.be.true;
          expect(quote.getMetabucket().getData()).to.deep.equal(expected);
        });
      })
    );
  });
});

function createStubQuote(
  data: Record<string, any[]>,
  metadata: Record<string, any>
) {
  return <ServerSideQuote>(<unknown>{
    getProgramId: () => 'foo',
    setData: () => {},
    getDataByName: (name: string) => data[name],
    getMetabucket: () => ({
      getDataByName: (name: string) => metadata[name],
      getData: () => metadata,
      setValues: (data: Record<string, any>) => {
        Object.keys(data).forEach(
          field_name => (metadata[field_name] = data[field_name])
        );
      },
    }),
    getBucket: () => ({
      getData() {
        return {};
      },
    }),
  });
}

function createStubProgram(meta_fields: Record<string, any>) {
  return <Record<string, any>>{
    getId: () => 'foo',
    meta: {fields: meta_fields},
    defaults: {},
    classify: () => ({}),
  };
}
