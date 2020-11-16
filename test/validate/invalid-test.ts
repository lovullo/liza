/**
 * Test transitionary module for invalid bucket state
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

import {expect} from 'chai';

import * as sut from '../../src/validate/invalid';

describe('invalidate', () => {
  it('creates invalid strings', () => {
    expect(sut.isInvalid(sut.invalidate(''))).to.be.true;
  });

  it('recovers values from invalid strings (identity)', () => {
    const given = 'some invalid value';
    expect(sut.recoverValue(sut.invalidate(given))).to.equal(given);
  });

  it('recovers values from invalid strings without marker (identity)', () => {
    const given = 'another invalid value';
    expect(
      sut.recoverValue(sut.invalidateWithoutPrintableMarker(given))
    ).to.equal(given);
  });

  it('does nothing when recovering non-invalid values', () => {
    const given = 'ok';
    expect(sut.recoverValue(given)).to.equal(given);
  });

  it('clears invalid values', () => {
    expect(sut.clearInvalid(sut.invalidate('foo'))).to.equal('');
  });

  it('does not clear valid values', () => {
    const given = 'ok';
    expect(sut.clearInvalid(given)).to.equal(given);
  });
});
