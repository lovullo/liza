/**
 * Tests that an appropriate console is created.
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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

import {createConsole as sut} from '../../src/system/ConsoleFactory';
import {expect} from 'chai';

describe('createConsole', () => {
  it('no input gives console', () => {
    const given = sut();
    expect(given).to.be.equal(console);
  });

  it('null input gives console', () => {
    const given = sut(undefined);
    expect(given).to.be.equal(console);
  });

  it('undefined input gives console', () => {
    const given = sut(undefined);
    expect(given).to.be.equal(console);
  });

  it('empty input gives console', () => {
    const given = sut('');
    expect(given).to.be.equal(console);
  });
});
