/**
 * Tests error chaining
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

import * as sut from '../../src/error/ChainedError';
import {expect} from 'chai';

describe('ChainedError', () => {
  it('can be created with generic error', () => {
    const eprev = new Error('previous error');

    expect(sut.chain(new Error('new error'), eprev).chain).to.equal(eprev);
  });

  it('can be chained to arbitrary depth', () => {
    const e1 = new Error('lower');
    const e2 = sut.chain(new Error('mid'), e1);
    const e3 = sut.chain(new Error('outer'), e2);

    expect(sut.isChained(e3)).to.be.true;
    expect(sut.isChained(e2)).to.be.true;
    expect(sut.isChained(e1)).to.be.false;
  });

  it('provides type predicate for TypeScript', () => {
    const inner = new Error('inner');

    // force to Error to discard ChainedError type
    const outer: Error = sut.chain(new Error('outer'), inner);

    if (sut.isChained(outer)) {
      // if isChained was properly defined, then outer should now
      // have type ChainedError, and so this should compile
      expect(outer.chain).to.equal(inner);
    } else {
      expect.fail();
    }
  });
});
