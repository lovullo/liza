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

var Class = require('easejs').Class,
  store = require('../../').store,
  chai = require('chai'),
  expect = chai.expect,
  Store = store.MemoryStore,
  Sut = store.MissLookup;

chai.use(require('chai-as-promised'));

const StubStore = Class.extend(Store, {
  'virtual override get': function (key) {
    return this.__super(key).then(val => val + ' get');
  },
});

describe('store.MissLookup', () => {
  it('requires function for cache miss', () => {
    expect(() => StubStore.use(Sut({}))()).to.throw(TypeError);
  });

  it('invokes lookup on cache miss', () => {
    const expected = 'quux';
    const miss = key => Promise.resolve(key + expected);
    const sut = StubStore.use(Sut(miss))();

    // key + expected + StubStore#get
    return Promise.all([
      expect(sut.get('foo')).to.eventually.equal('foo' + expected + ' get'),

      expect(sut.get('bar')).to.eventually.equal('bar' + expected + ' get'),
    ]);
  });

  it('caches miss lookup', () => {
    let calln = 0;

    const expected = {};

    function miss() {
      // should not be called more than once
      expect(++calln).to.equal(1);
      return Promise.resolve(expected);
    }

    const sut = Store.use(Sut(miss))();

    // should miss
    return expect(sut.get('foo'))
      .to.eventually.equal(expected)
      .then(() => {
        // should not miss
        expect(sut.get('foo')).to.eventually.equal(expected);
      });
  });

  it('does not miss on existing cache item', () => {
    const fail = () => {
      throw Error('Should not have missed');
    };
    const sut = Store.use(Sut(fail))();

    return expect(
      sut.add('foo', 'bar').then(() => sut.get('foo'))
    ).to.eventually.equal('bar');
  });

  // prevent stampeding and concurrency issues
  it('shares promise given concurrent miss requests', () => {
    let n = 0;
    let resolve = null;

    const p = new Promise(r => (resolve = r));

    // return our mock promise, which should only be once (after
    // that, the SUT should have cached the promise)
    function miss() {
      if (n++ > 0) throw Error('Miss called more than once');
      return p;
    }

    const sut = Store.use(Sut(miss))();

    // set of three promises, each on the same key
    const misses = [1, 2, 3].map(i => sut.get('foo'));

    // we don't really care what promises were returned to us
    // (that's an implementation detail), but we do care that they
    // all resolve once we resolve our promise
    resolve(true);

    return Promise.all(misses);
  });

  it('does not share old promise after miss resolves', () => {
    let missret = {};

    const key = 'foo';
    const miss1 = {};
    const miss2 = {};

    function miss() {
      return Promise.resolve(missret);
    }

    const sut = Store.use(Sut(miss))();

    missret = miss1;

    return sut
      .get(key)
      .then(val => expect(val).to.equal(miss1))
      .then(() => {
        sut.clear();

        missret = miss2;
        return sut.get(key).then(val => expect(val).to.equal(miss2));
      });
  });
});
