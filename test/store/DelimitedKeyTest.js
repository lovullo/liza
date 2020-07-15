/**
 * Tests DelimitedKey
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

chai.use(require('chai-as-promised'));

const {
  DelimitedKey: Sut,
  MemoryStore: Store,
  StoreMissError,
} = require('../../').store;

describe('DelimitedKey', () => {
  describe('#get', () => {
    it('retrieves nested store keys', () => {
      const outer = Store.use(Sut('.'))();
      const middle = Store();
      const inner = Store();
      const inner_val = {};

      return expect(
        inner
          .add('foo', inner_val)
          .then(() => middle.add('inner', inner))
          .then(() => outer.add('middle', middle))
          .then(() => outer.get('middle.inner.foo'))
      ).to.eventually.equal(inner_val);
    });

    it('fails on unknown nested key', () => {
      const outer = Store.use(Sut('.'))();
      const inner = Store();

      return expect(
        outer.add('inner', inner).then(() => outer.get('inner.foo.bar.baz'))
      ).to.eventually.be.rejectedWith(StoreMissError, /[^.]foo\b/);
    });

    // rather than blowing up attempting to split
    it('fails gracefully on non-string key', () => {
      return expect(
        Store.use(Sut('.'))().get(undefined)
      ).to.eventually.be.rejectedWith(StoreMissError);
    });
  });

  describe('#add', () => {
    it('sets nested store keys', () => {
      const outer = Store.use(Sut('.'))();
      const inner = Store();
      const inner_val = {};

      return expect(
        inner
          .add('foo', inner_val)
          .then(() => outer.add('inner', inner))
          .then(() => outer.add('inner.foo', inner_val))
          .then(() => inner.get('foo'))
      ).to.eventually.equal(inner_val);
    });

    it('fails on unknown nested key', () => {
      const outer = Store.use(Sut('.'))();
      const inner = Store();

      return expect(
        outer
          .add('inner', inner)
          .then(() => outer.add('inner.none.foo', 'fail'))
      ).to.eventually.be.rejectedWith(StoreMissError, /[^.]none\b/);
    });
  });
});
