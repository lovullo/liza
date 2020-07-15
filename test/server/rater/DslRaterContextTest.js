/**
 * Tests DslRaterContext
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

const root = require('../../..');
const expect = require('chai').expect;

const {DslRaterContext: Sut} = root.server.rater;

describe('DslRaterContext', () => {
  describe('Defaults', () => {
    it(`canTerm is true if not included`, () => {
      const expected = true;
      const data = {foo: 'bar'};
      const sut = Sut(data);
      const actual = sut.canTerm();

      expect(actual).to.equal(expected);
    });

    it(`canTerm can be set to false`, () => {
      const expected = false;
      const data = {foo: 'bar'};
      const sut = Sut(data, expected);
      const actual = sut.canTerm();

      expect(actual).to.equal(expected);
    });

    it(`data can be retrieved`, () => {
      const expected = {foo: 'bar'};
      const sut = Sut(expected);
      const actual = sut.getSourceData();

      expect(actual).to.deep.equal(expected);
    });
  });
});
