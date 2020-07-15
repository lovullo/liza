/**
 * Tests instantiation of portions of the client system
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
 *
 * This is a functional test of the client system at large; these are _not_
 * unit tests.
 */

'use strict';

const root = require('../../');
const sut = root.system.client;
const expect = require('chai').expect;
const Class = require('easejs').Class;

const {Store, DiffStore} = root.store;

describe('client', () => {
  describe('data.diffStore', () => {
    it('produces proper Stores', () => {
      const {store, cstore, bstore} = sut.data.diffStore();

      // we don't care what type of store these two are
      expect(Class.isA(Store, store)).to.be.true;
      expect(Class.isA(Store, bstore)).to.be.true;

      // but it's essential that this is a DiffStore
      expect(Class.isA(DiffStore, cstore)).to.be.true;
    });

    it('proxies c:* to cstore, others to bstore', () => {
      const {store, cstore, bstore} = sut.data.diffStore();

      const cname = 'c:foo'; // Master Shifu
      const cval = 'panda';

      const bname = 'henry';
      const bval = 'liza';

      return expect(
        store
          .add(cname, cval)
          .then(() => store.add(bname, bval))
          .then(() =>
            Promise.all([
              cstore.get(cname.replace(/^c:/, '')),
              bstore.get(bname),
            ])
          )
      ).to.eventually.deep.equal([cval, bval]);
    });
  });
});
