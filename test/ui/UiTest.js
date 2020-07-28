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
  it('stepSave calls save hooks', () => {
    const step = createMockStepUi();

    const sut = Sut.extend({
      'override __construct': function (options) {},
      'override hideErrors': function () {},
    })();

    let hook_one_called = false;
    let hook_two_called = false;

    // set a save hook
    sut.saveStep(function () {
      hook_one_called = true;
    });
    sut.saveStep(function () {
      hook_two_called = true;
    });

    sut.saveStep(
      step,
      function () {},
      function () {},
      true
    );

    expect(hook_one_called).to.true;
    expect(hook_two_called).to.true;
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
