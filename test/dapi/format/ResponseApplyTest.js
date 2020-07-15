/**
 * Tests ResponseApply
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
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

const {expect} = require('chai');
const {Class} = require('easejs');
const DummyDataApi = require('../DummyDataApi');

const {
  DataApi,
  format: {ResponseApply: Sut},
} = require('../../../').dapi;

describe('ResponseApply', () => {
  it('applies function to response', done => {
    const expected = {};
    const given = {given: 'data'};

    const f = src => {
      expect(src).to.equal(given);
      return expected;
    };

    DummyDataApi.use(Sut(f))((_, c) => c(null, given)).request(
      given,
      (e, data) => {
        expect(data).to.equal(expected);
        done();
      }
    );
  });

  it('returns self', () => {
    const sut = DummyDataApi.use(Sut(_ => {}))(_ => {});

    expect(sut.request({}, () => {})).to.equal(sut);
  });
});
