/**
 * Test the delta generated from two key/value stores
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
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
 *
 */
import {
  createDelta as sutCreate,
  applyDelta as sutApply,
  mergeDeltas as sutMerge,
  mergeSimilarDeltas as sutMergeSimilarDeltas,
  differentiateDeltas as sutDifferentiateDeltas,
  Kv,
  DeltaResult,
  Delta,
} from '../../src/bucket/delta';
import {PositiveInteger} from '../../src/numeric';

import {expect, use as chai_use} from 'chai';
chai_use(require('chai-as-promised'));

interface SutCreateTestCase<T> {
  label: string;
  src_data: T;
  dest_data: T;
  expected: DeltaResult<T>;
}

interface SutApplyTestCase<T> {
  label: string;
  bucket: T;
  delta: DeltaResult<T>;
  expected: T;
}

interface SutMergeSimilarTestCase<T> {
  label: string;
  deltas: Delta<T>[];
  expected: Delta<T> | null;
}

interface SutDifferentiateTestCase<T> {
  label: string;
  deltas: Delta<T>[];
  expected: Delta<T>[];
}

interface SutmergeTestCase<T> {
  label: string;
  deltas: Delta<T>[];
  expected: Delta<T>[];
}

describe('Delta', () => {
  describe('#createDelta', () => {
    (<SutCreateTestCase<Kv<string>>[]>[
      {
        label: 'No changes are made, key is dropped',
        src_data: {foo: ['bar', 'baz']},
        dest_data: {foo: ['bar', 'baz']},
        expected: {},
      },
      {
        label: 'Only the unchanged key is dropped',
        src_data: {foo: ['bar', 'baz'], bar: ['qwe']},
        dest_data: {foo: ['bar', 'baz'], bar: ['asd']},
        expected: {bar: ['asd']},
      },
      {
        label: 'Changed values are updated by index with old value',
        src_data: {foo: ['bar', 'baz', 'quux']},
        dest_data: {foo: ['bar', 'quuux'], moo: ['cow']},
        expected: {foo: [undefined, 'quuux', null], moo: ['cow']},
      },
      {
        label: 'The keys are null when they do not exist in first set',
        src_data: {},
        dest_data: {foo: ['bar', 'quuux'], moo: ['cow']},
        expected: {foo: ['bar', 'quuux'], moo: ['cow']},
      },
      {
        label: 'Removed keys in new set show up',
        src_data: {foo: ['bar']},
        dest_data: {},
        expected: {foo: null},
      },
      {
        label: 'Indexes after a null terminator are not included',
        src_data: {foo: ['one', 'two', 'three', 'four']},
        dest_data: {foo: ['one', 'done']},
        expected: {foo: [undefined, 'done', null]},
      },
      {
        label: 'Consider nested arrays to be scalar values',
        src_data: {foo: [['one'], ['two', 'three']]},
        dest_data: {foo: [['one'], ['two']]},
        expected: {foo: [undefined, ['two']]},
      },
      {
        label: 'Do not evaluate zeros as falsy',
        src_data: {foo: [0]},
        dest_data: {foo: [0]},
        expected: {},
      },
      {
        label: 'Do not evaluate empty strings as falsy',
        src_data: {foo: ['']},
        dest_data: {foo: ['']},
        expected: {},
      },
    ]).forEach(({label, src_data, dest_data, expected}) => {
      it(label, () => {
        expect(sutCreate(src_data, dest_data)).to.deep.equal(expected);
      });
    });
  });

  describe('#applyDelta', () => {
    (<SutApplyTestCase<Kv<string>>[]>[
      {
        label: 'Empty delta changes nothing',
        bucket: {foo: ['bar', 'baz']},
        delta: {},
        expected: {foo: ['bar', 'baz']},
      },
      {
        label: 'Undefined delta changes nothing',
        bucket: {foo: ['bar', 'baz']},
        delta: undefined,
        expected: {foo: ['bar', 'baz']},
      },
      {
        label: 'Field not in delta is unchanged',
        bucket: {foo: ['bar', 'baz'], bar: ['qwe']},
        delta: {bar: ['asd']},
        expected: {foo: ['bar', 'baz'], bar: ['asd']},
      },
      {
        label: 'Undefined does not affect its corresponding index',
        bucket: {foo: ['bar', 'baz', 'quux']},
        delta: {foo: [undefined, 'quuux', null], moo: ['cow']},
        expected: {foo: ['bar', 'quuux'], moo: ['cow']},
      },
      {
        label: 'Delta applys correctly on empty bucket',
        bucket: {},
        delta: {foo: ['bar', 'quuux'], moo: ['cow']},
        expected: {foo: ['bar', 'quuux'], moo: ['cow']},
      },
      {
        label: 'Keys are removed properly',
        bucket: {foo: ['bar']},
        delta: {foo: null},
        expected: {},
      },
      {
        label: 'Indexes after a null terminator are not included',
        bucket: {foo: ['one', 'two', 'three', 'four']},
        delta: {foo: [undefined, 'done', null]},
        expected: {foo: ['one', 'done']},
      },
      {
        label: 'Consider nested arrays to be scalar values',
        bucket: {foo: [['one'], ['two', 'three']]},
        delta: {foo: [undefined, ['two']]},
        expected: {foo: [['one'], ['two']]},
      },
      {
        label: 'Do not evaluate zeros as falsy',
        bucket: {foo: [0]},
        delta: {},
        expected: {foo: [0]},
      },
      {
        label: 'Do not evaluate empty strings as falsy',
        bucket: {foo: ['']},
        delta: {},
        expected: {foo: ['']},
      },
    ]).forEach(({label, bucket, delta, expected}) => {
      it(label, () => {
        expect(sutApply(bucket, delta)).to.deep.equal(expected);
      });
    });
  });

  describe('mergeSimilarDeltas', () => {
    (<SutMergeSimilarTestCase<Kv<string>>[]>[
      {
        label: 'Empty delta array returns null',
        deltas: [],
        expected: null,
      },
      {
        label: 'The most recent timestamp is used',
        deltas: [
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>234,
            step_id: 1,
            data: {foo: ['']},
          },
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {foo: ['']},
          },
        ],
        expected: {
          type: 'data',
          concluding_save: false,
          timestamp: <UnixTimestamp>234,
          step_id: 1,
          data: {},
        },
      },
      {
        label: 'The last occuring type is used',
        deltas: [
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>234,
            step_id: 1,
            data: {foo: ['']},
          },
          {
            type: 'bar',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {foo: ['']},
          },
        ],
        expected: {
          type: 'bar',
          concluding_save: false,
          timestamp: <UnixTimestamp>234,
          step_id: 1,
          data: {},
        },
      },
      {
        label: 'The highest step id is used',
        deltas: [
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 2,
            data: {foo: ['']},
          },
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {foo: ['']},
          },
        ],
        expected: {
          type: 'data',
          concluding_save: false,
          timestamp: <UnixTimestamp>123,
          step_id: 2,
          data: {},
        },
      },
      {
        label: 'A single concluding save marks the result as saved',
        deltas: [
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {foo: ['']},
          },
          {
            type: 'data',
            concluding_save: true,
            timestamp: <UnixTimestamp>234,
            step_id: 1,
            data: {foo: ['']},
          },
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>234,
            step_id: 1,
            data: {foo: ['']},
          },
        ],
        expected: {
          type: 'data',
          concluding_save: true,
          timestamp: <UnixTimestamp>234,
          step_id: 1,
          data: {},
        },
      },
    ]).forEach(({label, deltas, expected}) => {
      it(label, () => {
        const apply = (bucket: any, _: any) => bucket;

        expect(sutMergeSimilarDeltas(deltas, apply)).to.deep.equal(expected);
      });
    });
  });

  describe('differentiateDeltas', () => {
    (<SutDifferentiateTestCase<Kv<string>>[]>[
      {
        label: 'Empty delta array returns empty array',
        deltas: [],
        expected: [],
      },
      {
        label: 'Two similar types are merged',
        deltas: [
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
        ],
        expected: [
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
        ],
      },
      {
        label: 'Two different types are not merged',
        deltas: [
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
          {
            type: 'bar',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
        ],
        expected: [
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
          {
            type: 'bar',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
        ],
      },
      {
        label: 'Two different steps are not merged',
        deltas: [
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 2,
            data: {},
          },
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
        ],
        expected: [
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 2,
            data: {},
          },
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
        ],
      },
      {
        label: 'Two inner deltas are merged',
        deltas: [
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
          {
            type: 'bar',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
          {
            type: 'bar',
            concluding_save: false,
            timestamp: <UnixTimestamp>234,
            step_id: 1,
            data: {},
          },
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
        ],
        expected: [
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
          {
            type: 'bar',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
        ],
      },
      {
        label: 'Two different steps are not merged',
        deltas: [
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>234,
            step_id: 2,
            data: {},
          },
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>345,
            step_id: 2,
            data: {},
          },
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>456,
            step_id: 1,
            data: {},
          },
        ],
        expected: [
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>123,
            step_id: 1,
            data: {},
          },
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>234,
            step_id: 2,
            data: {},
          },
          {
            type: 'foo',
            concluding_save: false,
            timestamp: <UnixTimestamp>456,
            step_id: 1,
            data: {},
          },
        ],
      },
    ]).forEach(({label, deltas, expected}) => {
      it(label, () => {
        // We don't care about merge logic here so just return the first
        const mergeSimilar = (deltas: any) => {
          return deltas.length > 0 ? deltas[0] : null;
        };

        expect(sutDifferentiateDeltas(deltas, mergeSimilar)).to.deep.equal(
          expected
        );
      });
    });
  });

  describe('mergeDeltas', () => {
    (<SutmergeTestCase<Kv<string>>[]>[
      {
        label: 'Empty delta array returns empty array',
        deltas: [],
        expected: [],
      },
      {
        label: 'Multiple deltas are merged correctly',
        deltas: [
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>1592574639,
            step_id: <PositiveInteger>1,
            data: {
              hired_non_owned_auto: [''],
            },
          },
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>1592574641,
            step_id: <PositiveInteger>1,
            data: {
              blanket_ai: [''],
            },
          },
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>1592574642,
            step_id: <PositiveInteger>1,
            data: {
              scheduled_ai: [''],
            },
          },
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>1592574643,
            step_id: <PositiveInteger>1,
            data: {
              blanket_ai_type_chosen: ['0'],
              scheduled_ai_type_chosen: ['0'],
              __tmp_trigger_helper: ['0'],
              blanket_ai_type: ['0'],
              blanket_ai_type_desc: ['(Please select)'],
              blanket_ai_type_chosen_label: ['(Please select)'],
              scheduled_ai_type: ['0'],
              scheduled_ai_type_desc: ['(Please select)'],
              scheduled_ai_type_chosen_label: ['(Please select)'],
            },
          },
        ],
        expected: [
          {
            type: 'data',
            concluding_save: false,
            timestamp: <UnixTimestamp>1592574643,
            step_id: <PositiveInteger>1,
            data: {
              hired_non_owned_auto: [''],
              blanket_ai: [''],
              scheduled_ai: [''],
              blanket_ai_type_chosen: ['0'],
              scheduled_ai_type_chosen: ['0'],
              __tmp_trigger_helper: ['0'],
              blanket_ai_type: ['0'],
              blanket_ai_type_desc: ['(Please select)'],
              blanket_ai_type_chosen_label: ['(Please select)'],
              scheduled_ai_type: ['0'],
              scheduled_ai_type_desc: ['(Please select)'],
              scheduled_ai_type_chosen_label: ['(Please select)'],
            },
          },
        ],
      },
    ]).forEach(({label, deltas, expected}) => {
      it(label, () => {
        expect(sutMerge(deltas)).to.deep.equal(expected);
      });
    });
  });
});
