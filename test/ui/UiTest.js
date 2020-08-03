/**
 * Test case for Ui
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

'use strict';

const chai = require('chai');
const expect = chai.expect;
const Sut = require('../../').ui.Ui;

describe('Ui', () => {
  it('isSaving is true while step is being saved', () => {
    const step = createMockStepUi();

    const sut = Sut.extend({
      'override __construct': function (options) {},
      'override hideErrors': function () {},
    })();

    expect(sut.isSaving()).to.be.false;

    let is_saving_calls = 0;

    // set save hook
    sut.saveStep(function () {
      expect(sut.isSaving()).to.be.true;
      is_saving_calls++;
    });

    sut.saveStep(
      step,
      function () {},
      function () {},
      true
    );

    expect(sut.isSaving()).to.be.false;
    expect(is_saving_calls).to.equal(1);
  });
});

function createMockStepUi() {
  return {
    getFirstInvalidField: () => ['', 1, true],
    scrollTo: () => {
      return;
    },
    isValid: () => true,
  };
}
