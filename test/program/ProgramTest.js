/**
 * Tests Program
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

'use strict';

const chai = require('chai');
const program = require('../../src/test/program');
const {resolve} = require('path');
const expect = chai.expect;
const Program = require('../../src/program/Program').Program;

describe('Program', _ => {
  describe('#postSubmit', () => {
    it('returns false when step is invalid', done => {
      // setup 2 steps
      const sut = getSut([0, 1]);

      // call with invalid step #3
      expect(sut.postSubmit(3, {}, {})).to.be.false;
      done();
    });

    it('returns false when step is manage type', done => {
      // setup 2 steps
      const sut = getSut([0, 1]);

      // call with manage step #1
      expect(sut.postSubmit(1, {}, {})).to.be.false;
      done();
    });

    it('kicks back when valid step', done => {
      // setup 2 steps
      const sut = getSut([0, 1, 2]);
      const kb_step_id = 2;
      let callback_called = false;

      const callback = (event, quote_id, value) => {
        expect(event).to.equal('kickBack');
        expect(value).to.equal(kb_step_id);
        callback_called = true;
      };

      expect(sut.postSubmit(kb_step_id, {}, callback)).to.be.true;
      expect(callback_called).to.be.true;
      done();
    });
  });

  describe('#hasNaField', () => {
    [
      {
        label:
          'does not detect a NA field when it is missing a "when" classification',
        result: false,
        clearNaFields: true,
        is: false,
        whens: {},
      },
      {
        label: 'does not detect a NA field via applicable scalar',
        result: false,
        clearNaFields: true,
        indexes: 1,
        is: true,
      },
      {
        label: 'detects a NA field via NA scalar',
        result: true,
        clearNaFields: true,
        indexes: 0,
        is: false,
      },
      {
        label: 'does not detect a NA field via applicable vector index',
        result: false,
        clearNaFields: true,
        index: 0,
        indexes: [1, 0],
        is: true,
      },
      {
        label: 'detects a NA field via NA vector index',
        result: true,
        clearNaFields: true,
        index: 1,
        indexes: [1, 0],
        is: true,
      },
      {
        label: 'does not detect a NA field via applicable matrix index',
        result: false,
        clearNaFields: true,
        index: 0,
        indexes: [
          [1, 0],
          [0, 0],
        ],
        is: true,
      },
      {
        label: 'detects a NA field via matrix NA index',
        result: true,
        clearNaFields: true,
        index: 1,
        indexes: [
          [1, 0],
          [0, 0],
        ],
        is: true,
      },
      {
        label: 'does not detect a field with a retained value',
        result: false,
        retain: {foo: true},
        clearNaFields: true,
      },
      {
        label: 'does not a detect a field without a default',
        result: false,
        defaults: {},
        clearNaFields: true,
      },
    ].forEach(
      ({
        label,
        result,
        retain,
        whens,
        defaults,
        clearNaFields,
        index,
        indexes,
        is,
      }) => {
        it(label, () => {
          const sut = getSut([0, 1]);

          index = index || 0;
          indexes = indexes || 0;

          sut.cretain = retain || {};
          sut.whens = whens || {foo: ['--vis-foo']};
          sut.defaults = defaults || {foo: '0'};
          sut.clearNaFields = clearNaFields;

          const classes = {'--vis-foo': {is, indexes}};

          const resetable = sut.hasNaField('foo', classes, index);

          expect(resetable).to.be[result];
        });
      }
    );
  });

  describe('#processNaFields', () => {
    [
      {
        label: 'has no effect when clearNaFields is disabled',
        clearNaFields: false,
        input: {na: 'default', not_na: 'default'},
        output: {na: 'default', not_na: 'default'},
      },
      {
        label: 'process non-applicable fields',
        clearNaFields: true,
        input: {na: ['default'], not_na: ['default']},
        output: {na: [''], not_na: ['default']},
      },
    ].forEach(({label, clearNaFields, input, output}) => {
      it(label, done => {
        const sut = getSut([0, 1]);

        sut.clearNaFields = clearNaFields;
        sut.hasNaField = field => field === 'na';
        sut.classify = _ => {};
        sut.processNaFields(input);

        expect(output).to.deep.equal(input);
        done();
      });
    });
  });

  describe('#getNextVisibleStep', () => {
    [
      {
        label: 'next immediate step is visible',
        whens: {
          foo: '--visstep-foo',
          bar: '--visstep-bar',
          baz: '--visstep-baz',
        },
        class_data: {
          '--visstep-foo': {is: true},
          '--visstep-bar': {is: true},
          '--visstep-baz': {is: true},
        },
        steps: [null, {id: 'foo'}, {id: 'bar'}, {id: 'baz'}],
        step_id: 1,
        expected: 2,
      },
      {
        label: 'step whens are not defined will return next step',
        whens: undefined,
        class_data: {
          '--visstep-foo': {is: true},
          '--visstep-bar': {is: true},
          '--visstep-baz': {is: true},
        },
        steps: [null, {id: 'foo'}, {id: 'bar'}, {id: 'baz'}],
        step_id: 1,
        expected: 2,
      },
      {
        label: 'next step is not visible',
        whens: {
          foo: '--visstep-foo',
          bar: '--visstep-bar',
          baz: '--visstep-baz',
          baq: '--visstep-baq',
        },
        class_data: {
          '--visstep-foo': {is: true},
          '--visstep-bar': {is: true},
          '--visstep-baz': {is: false},
          '--visstep-baq': {is: true},
        },
        steps: [null, {id: 'foo'}, {id: 'bar'}, {id: 'baz'}, {id: 'baq'}],
        step_id: 2,
        expected: 4,
      },
      {
        label: 'no remaining steps are visible returns undefined',
        whens: {
          foo: '--visstep-foo',
          bar: '--visstep-bar',
          baz: '--visstep-baz',
        },
        class_data: {
          '--visstep-foo': {is: true},
          '--visstep-bar': {is: false},
          '--visstep-baz': {is: false},
        },
        steps: [null, {id: 'foo'}, {id: 'bar'}, {id: 'baz'}],
        step_id: 1,
        expected: undefined,
      },
    ].forEach(({label, whens, class_data, steps, step_id, expected}) => {
      it(label, done => {
        const sut = getSut([0, 1]);
        sut.stepWhens = whens;
        sut.steps = steps;

        expect(sut.getNextVisibleStep(class_data, step_id)).to.equal(expected);
        done();
      });
    });
  });

  describe('#getPreviousVisibleStep', () => {
    [
      {
        label: 'previous immediate step is visible',
        whens: {
          foo: '--visstep-foo',
          bar: '--visstep-bar',
          baz: '--visstep-baz',
        },
        class_data: {
          '--visstep-foo': {is: true},
          '--visstep-bar': {is: true},
          '--visstep-baz': {is: true},
        },
        steps: [null, {id: 'foo'}, {id: 'bar'}, {id: 'baz'}],
        step_id: 3,
        expected: 2,
      },
      {
        label: 'step whens are not defined will return previous step',
        whens: undefined,
        class_data: {
          '--visstep-foo': {is: true},
          '--visstep-bar': {is: true},
          '--visstep-baz': {is: true},
        },
        steps: [null, {id: 'foo'}, {id: 'bar'}, {id: 'baz'}],
        step_id: 3,
        expected: 2,
      },
      {
        label: 'previous step is not visible, go to step before it',
        whens: {
          foo: '--visstep-foo',
          bar: '--visstep-bar',
          baz: '--visstep-baz',
          baq: '--visstep-baq',
        },
        class_data: {
          '--visstep-foo': {is: true},
          '--visstep-bar': {is: true},
          '--visstep-baz': {is: false},
          '--visstep-baq': {is: true},
        },
        steps: [null, {id: 'foo'}, {id: 'bar'}, {id: 'baz'}, {id: 'baq'}],
        step_id: 4,
        expected: 2,
      },
      {
        label: 'no previous steps are visible returns undefined',
        whens: {
          foo: '--visstep-foo',
          bar: '--visstep-bar',
          baz: '--visstep-baz',
        },
        class_data: {
          '--visstep-foo': {is: false},
          '--visstep-bar': {is: false},
          '--visstep-baz': {is: true},
        },
        steps: [null, {id: 'foo'}, {id: 'bar'}, {id: 'baz'}],
        step_id: 1,
        expected: undefined,
      },
    ].forEach(({label, whens, class_data, steps, step_id, expected}) => {
      it(label, done => {
        const sut = getSut([0, 1]);
        sut.stepWhens = whens;
        sut.steps = steps;

        expect(sut.getPreviousVisibleStep(class_data, step_id)).to.equal(
          expected
        );
        done();
      });
    });
  });

  describe('#isManageQuoteStep', () => {
    it('is determined correctly by step type', () => {
      const sut = getSut();

      // default manage step is setup as step 1
      expect(sut.isManageQuoteStep(2)).to.be.false;
      expect(sut.isManageQuoteStep(1)).to.be.true;
    });
  });

  describe('#isStepVisible', () => {
    [
      {
        label: 'step is visible when step classification is true',
        whens: {applicant: '--visstep-applicant'},
        class_data: {'--visstep-applicant': {is: true, indexes: 0}},
        step_id: 3,
        expected: true,
      },
      {
        label: 'step is not visible when step classification is false',
        whens: {applicant: '--visstep-applicant'},
        class_data: {'--visstep-applicant': {is: false, indexes: 0}},
        step_id: 3,
        expected: false,
      },
      {
        label: 'first step is always visible',
        whens: {firststep: '--visstep-firststep'},
        class_data: {'--visstep-firststep': {is: false, indexes: 0}},
        step_id: 2,
        expected: true,
      },
      {
        label: 'unknown step is not visible',
        whens: {firststep: '--visstep-firststep'},
        class_data: [{'--visstep-firststep': {is: true, indexes: 0}}],
        step_id: 99,
        expected: false,
      },
      {
        label: 'step is visible when step classification is missing',
        whens: {foo: '--visstep-applicant'},
        class_data: [],
        step_id: 3,
        expected: true,
      },
      {
        label: 'step is visible when step classification is undefined',
        whens: {applicant: '--visstep-applicant'},
        class_data: [{}],
        step_id: 3,
        expected: true,
      },
      {
        label: 'step is visible when no step id is defined',
        whens: undefined,
        class_data: [],
        step_id: 3,
        expected: true,
      },
      {
        label: 'step is visible when no classifications are defined',
        whens: undefined,
        class_data: [{'--visstep-firststep': {is: true, indexes: 0}}],
        step_id: 2,
        expected: true,
      },
      {
        label: 'manage step is not visible',
        whens: {manage: '--visstep-manage'},
        class_data: [{'--visstep-manage': {is: true, indexes: 0}}],
        step_id: 1,
        expected: false,
      },
    ].forEach(({label, whens, class_data, step_id, expected}) => {
      it(label, done => {
        const first_step_id = 2;
        const sut = getSut([0, 1], first_step_id);
        sut.stepWhens = whens;
        sut.steps = [
          null,
          {id: 'manage', title: 'Manage Quote', type: 'manage'},
          {id: 'firststep', title: 'First Step', type: ''},
          {id: 'applicant', title: 'Applicant', type: ''},
          {title: 'Mystery Step', type: ''},
        ];

        const given = sut.isStepVisible(class_data, step_id);
        expect(given).to.equal(expected);
        done();
      });
    });
  });
});

function getSut(step_data, first_step_id) {
  return Program.extend({
    'override __construct': function (dapi_manager) {},
    initQuote: function (bucket, store_only) {},
    eventData: step_data,
    firstStepId: first_step_id || 1,
    steps: [
      ,
      {id: 'Manage Quote', type: 'manage'},
      {id: 'Info', type: ''},
      {id: 'Location', type: ''},
    ],
  })();
}
