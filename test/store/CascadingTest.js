/**
 * Test case for Cascading store
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

'use strict';

var store = require('../../').store,
  chai = require('chai'),
  expect = chai.expect,
  Store = store.MemoryStore,
  Sut = store.Cascading;

chai.use(require('chai-as-promised'));

describe('store.Cascading', () => {
  describe('#add', () => {
    it('does not allow attaching non-store objects', () => {
      expect(Store.use(Sut)().add('invalid', {})).to.be.rejectedWith(TypeError);
    });

    it('allows attaching Store objects', () => {
      return Store.use(Sut)().add('valid', Store());
    });
  });

  describe('#clear', () => {
    it('invokes #clear on all contained stores', () => {
      const cleared = [];

      const MockStore = Store.extend({
        'override clear'() {
          cleared.push(this.__inst);

          return Promise.resolve(true);
        },
      });

      const stores = [1, 2, 3].map(() => MockStore());
      const sut = Store.use(Sut)();

      stores.forEach((store, i) => sut.add(i, store));

      // should trigger clear on all stores
      return sut.clear().then(() => {
        expect(stores.every(store => cleared.some(item => item === store))).to
          .be.true;
      });
    });

    it('does not clear self', () => {
      const sut = Store.use(Sut)();
      const substore = Store();

      return sut
        .add('foo', substore)
        .then(() => sut.clear())
        .then(() => {
          return expect(sut.get('foo')).to.eventually.equal(substore);
        });
    });

    [
      [[true, true, true], true],
      [[true, true, false], false],
      [[false, true, true], false],
      [[false, false, false], false],
    ].forEach(testdata => {
      let clears = testdata[0],
        expected = testdata[1];

      it('fails if any store fails to clear', () => {
        let StubStore = Store.extend({
          _result: false,

          __construct(result) {
            this._result = result;
          },

          'override clear'() {
            return Promise.resolve(this._result);
          },
        });

        let sut = Store.use(Sut)();

        clears.forEach((result, i) => {
          sut.add(i, StubStore(result));
        });

        return sut.clear().then(result => expect(result).to.equal(expected));
      });
    });
  });
});
