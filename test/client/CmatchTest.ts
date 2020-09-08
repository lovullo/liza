/**
 * Test case for Cmatch
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

import {ClientQuote} from '../../src/client/quote/ClientQuote';
import {Client} from '../../src/client/Client';
import {CmatchVisibility} from '../../src/client/CmatchVisibility';
import {DataApiResult} from '../../src/dapi/DataApi';
import {ExclusiveFields, Step} from '../../src/step/Step';
import {FieldClassMatcher} from '../../src/field/FieldClassMatcher';
import {FieldResetter} from '../../src/client/FieldResetter';
import {GroupUi} from '../../src/ui/group/GroupUi';
import {PositiveInteger} from '../../src/numeric';
import {StagingBucket} from '../../src/bucket/StagingBucket';
import {StepUi} from '../../src/ui/step/StepUi';
import {expect} from 'chai';
import {
  Cmatch as Sut,
  CmatchData,
  VisibilityQueue,
} from '../../src/client/Cmatch';
import {
  createStubClientQuote,
  createStubUi,
  createStubClient,
  createStubProgram,
} from './CommonResources';
import {
  DataDiff,
  DataValidator,
  ValidationFailure,
} from '../../src/validate/DataValidator';

const sinon = require('sinon');

type FieldKey = 'shown_field' | 'hidden_field';
type FieldObject = {[key in FieldKey]: any};

// these tests aren't terribly effective right now
describe('Cmatch', () => {
  it('marks hidden fields on class change to show', () => {
    const {sut} = createStubs();

    expect(
      sut.markShowHide('foo', {}, [<PositiveInteger>1, <PositiveInteger>2], [])
    ).to.deep.equal({foo: {show: [1, 2]}});
  });

  it('marks shown fields on class change to hide', () => {
    const {sut} = createStubs();

    expect(
      sut.markShowHide(
        'foo',
        {},
        [],
        [<PositiveInteger>3, <PositiveInteger>4, <PositiveInteger>5]
      )
    ).to.deep.equal({foo: {hide: [3, 4, 5]}});
  });

  it('marks combination show/hide on class change', () => {
    const {sut} = createStubs();

    expect(
      sut.markShowHide(
        'foo',
        {},
        [<PositiveInteger>2, <PositiveInteger>3],
        [<PositiveInteger>4, <PositiveInteger>5, <PositiveInteger>6]
      )
    ).to.deep.equal({
      foo: {
        show: [2, 3],
        hide: [4, 5, 6],
      },
    });
  });

  it('marks no fields with no show or hide', () => {
    const {sut} = createStubs();

    expect(sut.markShowHide('foo', {}, [], [])).to.deep.equal({});
  });

  it('does not affect marking of other fields', () => {
    const barval = {};
    const visq = {bar: barval};

    const {sut} = createStubs();

    const results: VisibilityQueue = sut.markShowHide(
      'foo',
      visq,
      [<PositiveInteger>1],
      [<PositiveInteger>0]
    );

    expect(results.bar).to.equal(barval);
  });

  it('getCmatchFields returns only fields with cmatch data', () => {
    const expected_fields = ['foo_address', 'foo_phone'];

    const field_names = [
      'foo_name',
      'foo_id',
      'foo_address',
      'foo_term',
      'foo_date',
      'foo_phone',
      'foo_email',
    ];

    const cmatch: CmatchData = {
      foo_address: {all: true, any: true, indexes: [0]},
      foo_phone: {all: true, any: true, indexes: [0]},
    };

    const {sut, quote, data_validator} = createStubs(cmatch);

    sut.hookClassifier(data_validator);
    quote.emit('classify');

    expect(sut.getCmatchFields(field_names)).to.deep.equal(expected_fields);
  });

  /**
   * __classes is always returned (at least at the time of writing) by
   * TAME.  here was a bug when it was recognized as a field (e.g. marked
   * as an `external' in program.xml),
   */
  it('does not fail when __classes is a known field', () => {
    const cmatch = {
      // populated by TAME, always
      __classes: {},
    };

    const field_names = {
      __classes: true,
    };

    const step_ui = createStubStepUi(field_names);
    const {sut, quote, data_validator} = createStubs(cmatch, step_ui);

    sut.hookClassifier(data_validator);
    quote.emit('classify');
  });

  describe('handleClassMatch', () => {
    it('throws error if step is undefined', () => {
      const {sut} = createStubs();

      expect(() => sut.handleClassMatch({}, false)).to.throw(TypeError);
    });

    it('triggers dapi for every visible queued element', () => {
      const field_names = {
        foo: true,
        bar: true,
        baz: true,
      };

      const cmatch: CmatchData = {
        foo: {all: true, any: true, indexes: [0]},
        baz: {all: true, any: true, indexes: [0]},
      };

      const step_ui = createStubStepUi(field_names);

      const {data_validator, quote, program, sut} = createStubs(
        cmatch,
        step_ui
      );

      let given: string[] = [];
      let dapi_call_count = 0;

      program.dapi = (
        _step_id: PositiveInteger,
        field: string,
        _bucket: StagingBucket,
        _diff: Record<string, any>,
        _cmatch: CmatchData,
        _callback: (() => void) | null
      ) => {
        given.push(field);
        ++dapi_call_count;
        return <DataApiResult>{};
      };

      sut.hookClassifier(data_validator);
      quote.emit('classify');

      expect(dapi_call_count).to.equal(2);
      expect(given).to.deep.equal(['foo', 'baz']);
    });

    [
      {
        label: 'handles only current indexes in bucket',
        cur_data: ['bar'],
        cmatch: {foo: {all: true, any: true, indexes: [1, 1]}},
        expected: {foo: {all: true, any: true, indexes: [1]}},
      },
      {
        label:
          'handles indexes requested when bucket and cmatch index counts are equal',
        cur_data: ['bar', 'baz'],
        cmatch: {foo: {all: true, any: true, indexes: [1, 1]}},
        expected: {foo: {all: true, any: true, indexes: [1, 1]}},
      },
      {
        label: 'handles indexes requested when bucket values exist',
        cur_data: ['bar', 'baz', 'foo'],
        cmatch: {foo: {all: true, any: true, indexes: [1, 1]}},
        expected: {foo: {all: true, any: true, indexes: [1, 1]}},
      },
    ].forEach(({label, cur_data, cmatch, expected}) => {
      it(label, done => {
        const step_ui = createStubStepUi({foo: true});
        const {sut, client, quote} = createStubs({}, step_ui);

        let get_data_call_count = 0;
        quote.getDataByName = (_field: string) => {
          ++get_data_call_count;
          return cur_data;
        };

        client.handleEvent = (_event_id: string, _data: any) => {
          expect(get_data_call_count).to.equal(1);
          expect(sut.getMatches()).to.deep.equal(expected);
          done();
          return client;
        };

        sut.handleClassMatch(cmatch);
      });
    });

    [
      {
        label: "clear a field's value when a new index is automatically hidden",
        bucket: {
          foo: ['1', 'default'],
        },
        previous_cmatch: {foo: {all: true, any: true, indexes: [1]}},
        cmatch: {foo: {all: true, any: true, indexes: [1, 0]}},
        expected: [
          // show events
          {
            foo: {},
          },
          // hide events
          {
            foo: {1: ''},
          },
        ],
        hasNaField: true,
      },

      {
        label:
          'does not clear a retained value when a new index is automatically hidden',
        bucket: {
          foo: ['1', 'default'],
        },
        cretain: {foo: true},
        cmatch: {foo: {all: true, any: true, indexes: [1, 0]}},
        expected: [
          // show events
          {
            foo: {},
          },
          // hide events
          {
            foo: {},
          },
        ],
      },

      {
        label:
          'does not clear a field that has no default when index is automatically hidden',
        bucket: {
          foo: ['1', 'default'],
        },
        defaults: {},
        cmatch: {foo: {all: true, any: true, indexes: [1, 0]}},
        expected: [
          // show events
          {
            foo: {},
          },
          // hide events
          {
            foo: {},
          },
        ],
      },
      {
        label: "restores a field's default value when it is shown",
        bucket: {
          foo: ['1', ''],
        },
        cmatch: {foo: {all: true, any: true, indexes: [1, 1]}},
        expected: [
          // show events
          {
            foo: {1: 'default'},
          },
          // hide events
          {
            foo: {},
          },
        ],
      },
    ].forEach(
      ({
        label,
        bucket,
        previous_cmatch,
        cmatch,
        expected,
        cretain,
        defaults,
        hasNaField,
      }) => {
        it(label, () => {
          const bucket_saves: any[] = [];

          const step_ui = createStubStepUi({foo: true});
          const {sut, quote, program} = createStubs({}, step_ui);
          program.clearNaFields = true;
          program.cretain = cretain ?? {};
          program.defaults = defaults ?? program.defaults;
          program.hasNaField = () => {
            return hasNaField ?? false;
          };

          quote.setData = data => {
            const output: {[key: string]: any} = {foo: {}};

            for (let i in data.foo) {
              output.foo[i] = data.foo[i];
            }

            bucket_saves.push(output);

            return <ClientQuote>{};
          };

          quote.getDataByName = (key: string): any => {
            if (key === 'foo') {
              return bucket.foo;
            }
          };

          sut.handleClassMatch(previous_cmatch || {}, true);
          sut.handleClassMatch(cmatch, true);

          const finished = new Promise((resolve, _reject) => {
            setTimeout(() => {
              resolve(bucket_saves);
            }, 0);
          });

          expect(finished).to.eventually.deep.equal(expected);
        });
      }
    );
  });

  describe('clearCmatchFields', () => {
    it('clear only invisible fields', () => {
      const data = {
        shown_field: ['foo'],
        hidden_field: ['foo'],
      };

      const expected = {
        shown_field: ['foo'],
        hidden_field: ['default'],
      };

      const fields = {
        shown_field: true,
        hidden_field: true,
      };

      const cmatch = {};
      const step_ui = createStubStepUi(fields);

      const {sut, quote, visibility} = createStubs(cmatch, step_ui, {
        program: {
          defaults: {
            shown_field: 'default',
            hidden_field: 'default',
          },
        },
      });

      sinon.stub(quote, 'setData').callsFake((new_data: FieldObject) => {
        if (new_data.shown_field) {
          data.shown_field = new_data.shown_field;
        }

        if (new_data.hidden_field) {
          data.hidden_field = new_data.hidden_field;
        }
      });

      sinon.stub(quote, 'getDataByName').callsFake(() => {
        return ['foo'];
      });

      sinon.stub(visibility, 'getBlueprints').callsFake(() => {
        return [
          {
            name: 'shown_field',
            cname: '--vis-shown-field',
            show: [0],
            hide: [],
          },
          {
            name: 'hidden_field',
            cname: '--vis-hidden-field',
            show: [],
            hide: [0],
          },
        ];
      });

      sut.clearCmatchFields();

      expect(data).to.deep.equal(expected);
    });
  });
});

function createStubDataValidator() {
  return new (class implements DataValidator {
    validate(
      _diff: DataDiff | undefined,
      _classes: any,
      _validatef?: (diff: DataDiff, failures: ValidationFailure) => void
    ): Promise<any> {
      return new Promise<any>(() => {});
    }
  })();
}

function createStubClassMatcher(cmatch: CmatchData) {
  return new (class implements FieldClassMatcher {
    match(_classes: any, callback: (cmatch: any) => void): FieldClassMatcher {
      callback(cmatch);
      return this;
    }
  })();
}

function createStubStepUi(field_names: ExclusiveFields) {
  const step = <Step>{
    getExclusiveFieldNames: () => field_names,
  };

  const step_ui: StepUi = {
    getElementGroup: () => <GroupUi>{},
    getStep: () => <Step>step,
    init: () => step_ui,
    initGroupFieldData: () => undefined,
    setContent: _ => step_ui,
    getContent: () => <HTMLElement>{},
    setDirtyTrigger: () => undefined,
    postAppend: () => step_ui,
    emptyBucket: (_, __) => step_ui,
    reset: _ => step_ui,
    isValid: _ => true,
    getFirstInvalidField: _ => ['', 1, true],
    scrollTo: (_, __, ___, ____) => {
      return step_ui;
    },
    invalidate: () => undefined,
    isInvalid: () => false,
    hideAddRemove: _ => step_ui,
    preRender: () => step_ui,
    visit: _ => step_ui,
    setActive: _ => step_ui,
    lock: _ => step_ui,
  };

  return step_ui;
}

function createStubs(
  cmatch: CmatchData = {},
  step: StepUi | null = null,
  overrides: any = {}
) {
  const data_validator = createStubDataValidator();
  const quote = createStubClientQuote();
  const program = createStubProgram(overrides.program ?? {});
  const class_matcher = createStubClassMatcher(cmatch);
  const ui = createStubUi(step);
  const client = createStubClient(<ClientQuote>(<unknown>quote), ui, program);
  const visibility = createStubVisibility(client);
  const resetter = createStubFieldResetter(client);

  const sut = new (class extends Sut {
    public markShowHide(
      field: string,
      visq: VisibilityQueue,
      show: PositiveInteger[],
      hide: PositiveInteger[]
    ): VisibilityQueue {
      return super.markShowHide(field, visq, show, hide);
    }

    public handleClassMatch(cmatch: CmatchData, force?: boolean): void {
      super.handleClassMatch(cmatch, force);
    }
  })(class_matcher, program, client, visibility, resetter);

  return {
    sut,
    data_validator,
    quote,
    ui,
    client,
    program,
    class_matcher,
    visibility,
    resetter,
  };
}

function createStubFieldResetter(client: Client) {
  const element_styler = {
    getDefault(_field: string): string {
      return 'default';
    },
  };

  sinon.stub(client, 'elementStyler').get(() => {
    return element_styler;
  });

  return new (class extends FieldResetter {})(client);
}

function createStubVisibility(client: Client) {
  return new (class extends CmatchVisibility {})(client);
}
