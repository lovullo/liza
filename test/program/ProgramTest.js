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
const expect = chai.expect;
const Program = require('../../src/program/Program').Program;

describe('Program#postSubmit', () => {
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

describe('Program#hasNaField', () => {
  [
    {
      label: 'detects a NA field when it is missing a "when" classification',
      result: true,
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

function getSut(step_data) {
  return Program.extend({
    'override __construct': function (dapi_manager) {},
    initQuote: function (bucket, store_only) {},
    eventData: step_data,
    steps: [
      ,
      {id: 'Manage Quote', type: 'manage'},
      {id: 'Info', type: ''},
      {id: 'Location', type: ''},
    ],
  })();
}
