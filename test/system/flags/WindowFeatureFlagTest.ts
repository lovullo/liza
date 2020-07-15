/**
 * Test case for WindowFeatureFlag
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

import {expect} from 'chai';
import {WindowFeatureFlag as Sut} from '../../../src/system/flags/WindowFeatureFlag';

before(function () {
  this.jsdom = require('jsdom-global')();
});

after(function () {
  this.jsdom();
});

describe('WindowFeatureFlag', () => {
  it('getDomPerfFlag is true when global is set', () => {
    (<any>window).dom_perf_flag = true;
    const sut = Sut.getInstance();
    expect(sut.isEnabled('dom_perf_flag')).to.be.true;
    (<any>window).dom_perf_flag = undefined;
  });

  it('getDomPerfFlag is false when global is not defined', () => {
    const sut = Sut.getInstance();
    expect(sut.isEnabled('dom_perf_flag')).to.be.false;
  });

  it('getDomPerfFlag is false when global is false', () => {
    (<any>window).dom_perf_flag = false;
    const sut = Sut.getInstance();
    expect(sut.isEnabled('dom_perf_flag')).to.be.false;
    (<any>window).dom_perf_flag = undefined;
  });
});
