/**
 * Tests Program
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
