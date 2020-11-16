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
import {___Writable} from 'naughty';

import {
  applyDocumentDefaults,
  cleanDocument,
  kickBackToNewlyApplicable,
} from '../../../src/server/quote/loader';
import {Program} from '../../../src/program/Program';
import {DocumentData} from '../../../src/server/db/MongoServerDao';
import {ServerSideQuote} from '../../../src/server/quote/ServerSideQuote';
import {PositiveInteger} from '../../../src/numeric';
import {invalidate} from '../../../src/validate/invalid';

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

describe('loader.kickBackToNewlyApplicable', () => {
  it('fails if field state is not available', () => {
    const program = createStubProgram({});
    const quote = createStubQuote({}, {});

    quote.getFieldState = () => undefined;

    const result = kickBackToNewlyApplicable(program)(quote)();
    expect(E.isLeft(result)).to.be.true;
  });

  type TestData = {
    label: string;
    field_state: Record<string, number | number[]>;
    last_field_state: Record<string, number | number[]>;
    qstep: Record<string, number>;
    data: Record<string, string[]>;
    locked?: boolean;
    lock_step?: PositiveInteger;
    current_step_id: number;
    expected_step_id: number;
    expected_data: Record<string, Array<undefined | string>>;
  };

  (<TestData[]>[
    // If no fields have changed applicability, then we want to leave the user
    // at whatever step they left off on.
    {
      label: 'keeps document at current step if no fields changed',

      // Identical field states
      field_state: {foo: [1, 0]},
      last_field_state: {foo: [1, 0]},

      // We must provide some mapping to ensure the system fails if it
      // _thinks_ there is some sort of change, and _this must be less than
      // current_step_id below_
      qstep: {foo: 2},

      current_step_id: 3,
      expected_step_id: 3,

      // And so should not invalidate anything
      expected_data: {},
    },

    {
      label: 'kicks back to step on single index change',

      // Second index changes
      field_state: {foo: [1, 1]},
      last_field_state: {foo: [1, 0]},

      // And so should kick back to this step
      qstep: {foo: 2},

      current_step_id: 3,
      expected_step_id: 2,

      // And should invalidate only the changed index
      expected_data: {foo: [undefined, invalidate('')]},
    },

    {
      label: 'kicks back to step on multiple index change',

      // Both indexes change
      field_state: {foo: [1, 1]},
      last_field_state: {foo: [0, 0]},

      // And so should kick back to this step
      qstep: {foo: 2},

      current_step_id: 3,
      expected_step_id: 2,

      // And should invalidate both changed indexes
      expected_data: {foo: [invalidate(''), invalidate('')]},
    },

    {
      label: 'does not kick back on single index change to N/A',

      // The first index changed, but we're now N/A, so there's no use
      // kicking the user back to address something that can't be seen
      field_state: {foo: [0, 0]},
      last_field_state: {foo: [1, 0]},

      // And so there should _not_ be a kickback to this step
      qstep: {foo: 2},

      current_step_id: 3,
      expected_step_id: 3,

      // And so should not invalidate anything
      expected_data: {},
    },

    {
      label: 'does not kick back on multiple index change to N/A',

      // Both index changed, but we're now N/A, so there's no use
      // kicking the user back to address something that can't be seen
      field_state: {foo: [0, 0]},
      last_field_state: {foo: [1, 1]},

      // And so there should _not_ be a kickback to this step
      qstep: {foo: 2},

      current_step_id: 3,
      expected_step_id: 3,

      // And so should not invalidate anything
      expected_data: {},
    },

    {
      label: 'missing prior field state is implicitly zero (no kickback)',

      // No change, because it should be implicitly [0, 0]
      field_state: {foo: [0, 0]},
      last_field_state: {},

      // And so there should _not_ be a kickback to this step
      qstep: {foo: 2},

      current_step_id: 3,
      expected_step_id: 3,

      // And so should not invalidate anything
      expected_data: {},
    },

    {
      label: 'missing prior field state is implicitly zero (kickback)',

      // Change, because it should be implicitly [0, 0]
      field_state: {foo: [1, 0]},
      last_field_state: {},

      // And so there should be a kickback to this step
      qstep: {foo: 1},

      current_step_id: 4,
      expected_step_id: 1,

      // And so should invalidate only the changed index
      expected_data: {foo: [invalidate(''), undefined]},
    },

    {
      label: 'missing current field state is ignored (implicitly NA)',

      // It's okay that we're now implicitly [0, 0]; we shouldn't kick back
      // to something that's N/A
      field_state: {},
      last_field_state: {foo: [1, 1]},

      // And so there should _not_ be a kickback to this step
      qstep: {foo: 1},

      current_step_id: 4,
      expected_step_id: 4,

      // And so should not invalidate anything
      expected_data: {},
    },

    {
      label: 'current field state is scalar, last was vector, no kickback',

      // Current field state is broadcasted into [1, 1], which matches the
      // last field state
      field_state: {foo: 1},
      last_field_state: {foo: [1, 1]},

      // And so there should _not_ be a kickback to this step
      qstep: {foo: 1},

      current_step_id: 4,
      expected_step_id: 4,

      // And so should not invalidate anything
      expected_data: {},
    },

    {
      label: 'current field state is scalar, last was vector, kickback',

      // Current field state is broadcasted into [1, 1], which differs from
      // the last field state
      field_state: {foo: 1},
      last_field_state: {foo: [1, 0]},

      // And so there should be a kickback to this step
      qstep: {foo: 1},

      current_step_id: 4,
      expected_step_id: 1,

      // And so should invalidate only the changed index
      expected_data: {foo: [undefined, invalidate('')]},
    },

    {
      label: 'last field state was scalar, current is vector, no kickback',

      // Last field state is broadcasted into [1, 1], which matches the
      // current field state
      field_state: {foo: [1, 1]},
      last_field_state: {foo: 1},

      // And so there should _not_ be a kickback to this step
      qstep: {foo: 1},

      current_step_id: 4,
      expected_step_id: 4,

      // And so should not invalidate anything
      expected_data: {},
    },

    {
      label: 'last field state was scalar, current is vector, kickback',

      // Last field state is broadcasted into [1, 1], which differs from
      // the current field state
      field_state: {foo: [1, 0]},
      // (Though note that this won't actually happen, since it'd be stripped
      // out, and if this were 1, this test would have to make current 0,
      // which means N/A, and therefore wouldn't kick back)
      last_field_state: {foo: 0},

      // And so there should be a kickback to this step
      qstep: {foo: 1},

      current_step_id: 4,
      expected_step_id: 1,

      // And so should invalidate only the changed index
      expected_data: {foo: [invalidate(''), undefined]},
    },

    {
      label: 'does not kick forward past current step',

      // Field state differs
      field_state: {foo: [1]},
      last_field_state: {foo: [0]},

      // And the field is on this step
      qstep: {foo: 7},

      // But that's _past_ the current step, and so we should not make the
      // change, otherwise we'd be kicking _forward_
      current_step_id: 4,
      expected_step_id: 4,

      // And so should not invalidate anything
      expected_data: {},
    },

    {
      label: 'kicks back to lowest of applicable step ids',

      // Multiple field states differ
      field_state: {foo: [1], bar: [1], baz: [1], quux: [1]},
      last_field_state: {quux: [1]},

      // Each located on these steps (one intentionally > current_step_id)
      qstep: {foo: 7, bar: 2, baz: 3, quux: 1},

      // We should kick back to the lowest of each of the above, which will
      // be all except for quux, having filtered out foo for being greater
      // than the current_step_id
      current_step_id: 4,
      expected_step_id: 2,

      // And so should invalidate only the fields prior to the current step
      expected_data: {bar: [invalidate('')], baz: [invalidate('')]},
    },

    {
      label: 'does not kick back if quote is locked without lock step',

      // Field state differs
      field_state: {foo: [1]},
      last_field_state: {foo: [0]},

      // And the field is on this step
      qstep: {foo: 1},

      // But our quote is locked, without an explicit lock step, meaning no
      // modifications to any step are possible
      locked: true,
      lock_step: 0,

      // And so we should not kick back at all, despite the kickback step
      // being less than our current step
      current_step_id: 4,
      expected_step_id: 4,

      // And so should not invalidate anything
      expected_data: {},
    },

    {
      label: 'kicks back, but not before explicit lock step',

      // Field state differs
      field_state: {foo: [1], bar: [1], baz: [1]},
      last_field_state: {foo: [0], bar: [0], baz: [0]},

      // Foo is before the lock step, bar is after but before the current
      // step, and baz is after the current step
      qstep: {foo: 1, bar: 3, baz: 9},
      //                   ^ kick back here

      // Our quote is locked at this step
      locked: true,
      lock_step: 2,

      // And so we should not kick back to before the lock, but we should
      // kick back after the lock but before the current step
      current_step_id: 4,
      expected_step_id: 3,

      // And so should invalidate the fields after the lock but before the
      // current step
      expected_data: {bar: [invalidate('')]},
    },

    // This feature flag test will be removed with the flag for release
    {
      label: 'does not kick back if feature flag is not set',

      // Field state differs
      field_state: {foo: [1], samestep: [1]},
      last_field_state: {foo: [0], samestep: [0]},

      // One field is on a prior step, one is on the same step
      qstep: {foo: 1, samestep: 4},

      // But the feature flag is cleared
      data: {__feature_pver_kickback: ['0']},

      // And so we should not kick back at all, despite the kickback step
      // being less than our current step
      current_step_id: 4,
      expected_step_id: 4,

      // And we should not invalidate anything, _including_ the field on the
      // same step (that is, the feature flag being unset must filter _all_
      // fields, not just restrict them to the current step)
      expected_data: {},
    },

    // This feature flag test will be removed with the flag for release
    {
      label: 'does not kick back if feature flag is undefined',

      // Field state differs
      field_state: {foo: [1], samestep: [1]},
      last_field_state: {foo: [0], samestep: [0]},

      // One field is on a prior step, one is on the same step
      qstep: {foo: 1, samestep: 4},

      // But the feature flag does not exist at all
      data: {},

      // And so we should not kick back at all, despite the kickback step
      // being less than our current step
      current_step_id: 4,
      expected_step_id: 4,

      // And we should not invalidate anything, _including_ the field on the
      // same step (that is, the feature flag being unset must filter _all_
      // fields, not just restrict them to the current step)
      expected_data: {},
    },

    // Be careful with this one.  This _should_ be safe, because if we have
    // a scalar 0, that surely means that all indexes were hidden.
    //
    // There is a situation where this could potentially be wrong: if the
    // indexes within a group somehow got out-of-sync and the cleaner fixed
    // them up.  That would be a bug, but it could potentially cause data to
    // be overwritten.  But the user would at least be forced to re-enter
    // those data, so the error is recoverable in a safe (albeit
    // inconvenient) way.
    {
      label: 'invalidation broadcasts scalar state onto bucket field',

      // Both states are scalar, where foo is now applicable for all
      // indexes, whereas before it was applicable for none
      field_state: {foo: 1},
      last_field_state: {foo: 0},

      // And so there should be a kickback to this step
      qstep: {foo: 1},

      current_step_id: 4,
      expected_step_id: 1,

      // The bucket contains two indexes for this field
      data: {
        foo: ['bar', 'baz'],
        __feature_pver_kickback: ['1'],
      },

      // And so we should broadcast the above state to two indexes so that
      // it overwrites both bucket values (since neither was applicable
      // previously, according to `last_field_state`)
      expected_data: {foo: [invalidate(''), invalidate('')]},
    },
  ]).forEach(({label, ...tdata}) =>
    it(label, () => {
      const program = createStubProgram({});
      const quote = createStubQuote({}, {});

      quote.getFieldState = () => tdata.field_state;
      quote.getLastPersistedFieldState = () => tdata.last_field_state;
      quote.getCurrentStepId = () => tdata.current_step_id;

      // This is the mapping from field -> step id
      program.qstep = tdata.qstep;

      let given_current = NaN;
      let given_top = NaN;
      let given_data = {};

      // These will be called regardless of whether the step actually differs
      // from the current
      quote.setCurrentStepId = given_id => {
        given_current = given_id;
        return quote;
      };
      quote.setTopVisitedStepId = given_id => {
        given_top = given_id;
        return quote;
      };

      // The bucket is consulted for the feature flag, which is temporary
      // until release.  Default to on, so that we don't have to pollute all
      // of our test cases, but note that this should default to `0` in the
      // real bucket (configured via program.xml)
      const {data = {__feature_pver_kickback: ['1']}} = tdata;
      quote.getDataByName = (field: string) => data[field];

      // These are only relevent to a couple of test cases above, meant to
      // play well with the locking system
      quote.isLocked = () => tdata.locked || false;
      quote.getExplicitLockStep = () => tdata.lock_step || <PositiveInteger>0;
      quote.setData = given => {
        given_data = given;
        return quote;
      };

      const result = kickBackToNewlyApplicable(program)(quote)();

      expect(E.isRight(result)).to.be.true;
      expect(given_current).to.equal(tdata.expected_step_id);
      expect(given_top).to.equal(tdata.expected_step_id);
      expect(given_data).to.deep.equal(tdata.expected_data);
    })
  );
});

function createStubQuote(
  data: Record<string, any[]>,
  metadata: Record<string, any>
) {
  const quote = <ServerSideQuote>(<unknown>{
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
    getCurrentStepId: () => 0,
    setCurrentStepId: () => quote,
    setTopVisitedStepId: () => quote,
    classify: () => ({}),
    getFieldState: () => ({}),
    getLastPersistedFieldState: () => ({}),
    isLocked: () => false,
    getExplicitLockStep: () => 0,
  });

  return quote;
}

function createStubProgram(meta_fields: Record<string, any>) {
  return <___Writable<Program>>(<unknown>{
    getId: () => 'foo',
    meta: {fields: meta_fields},
    defaults: {},
    classify: () => ({}),
  });
}
