/**
 * Tests Calc
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
 */

var liza = require('../..'),
  relativeDate = liza.calc.Calc.relativeDate,
  expect = require('chai').expect;

describe('relativeDate', function () {
  //returns a date relative to another date by adding a given value

  it("assert 10 days is added, the date's month changes", function () {
    expect(relativeDate(['2019-11-25'], ['10d'])).to.have.all.members([
      '2019-12-05',
    ]);
  });

  it("assert 10 days is added, the date's month and year changes", function () {
    expect(relativeDate(['2019-12-28'], ['10d'])).to.have.all.members([
      '2020-01-07',
    ]);
  });

  it('assert edge case 6 months is added, the date does not go into the 7th month', function () {
    expect(relativeDate(['2019-12-31'], ['6m'])).to.have.all.members([
      '2020-06-30',
    ]);
  });

  it('assert edge case 3 months is added, the date does not go into the 4th month', function () {
    expect(relativeDate(['2019-08-31'], ['3m'])).to.have.all.members([
      '2019-11-30',
    ]);
  });

  it('assert 2 years is added', function () {
    expect(relativeDate(['2019-12-31'], ['2y'])).to.have.all.members([
      '2021-12-31',
    ]);
  });

  it('assert edge case february', function () {
    expect(relativeDate(['2018-12-31'], ['2m'])).to.have.all.members([
      '2019-02-28',
    ]);
  });

  it('assert edge case february leap year', function () {
    expect(relativeDate(['2019-12-31'], ['2m'])).to.have.all.members([
      '2020-02-29',
    ]);
  });
});
