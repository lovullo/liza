/**
 * Tests HttpDataApiUrlData
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

'use strict';

const {Class} = require('easejs');
const {expect} = require('chai');

const {
  dapi: {
    http: {HttpDataApi, HttpImpl, HttpDataApiUrlData: Sut},
  },
} = require('../../../');

describe('HttpDataApiUrlData', () => {
  [
    {
      fields: [],
      data: {
        foo: 'foodata',
        bar: 'bardata',
      },
      base_url: 'base',
      after_data: 'foo=foodata&bar=bardata',
      expected: 'base',
    },
    {
      fields: ['foo', 'bar'],
      data: {
        foo: 'foodata',
        bar: 'bardata',
        baz: 'shouldnotuse',
      },
      base_url: 'base2',
      after_data: 'baz=shouldnotuse',
      expected: 'base2/foodata/bardata',
    },
  ].forEach(({fields, data, base_url, after_data, expected}, i) =>
    it(`can include portion of data in url (#${i})`, done => {
      const expected_method = 'PUT';

      const impl = Class.implement(HttpImpl).extend({
        'virtual requestData'(url, method, given_data, callback) {
          expect(url).to.equal(expected);
          expect(method).to.equal(expected_method);
          expect(given_data).to.deep.equal(after_data);

          // should not have mutated the original object
          // (they shouldn't be the same object)
          expect(data).to.not.equal(given_data);

          // should be done
          callback();
        },

        setOptions: () => {},
      })();

      const sut = HttpDataApi.use(Sut(fields))(base_url, expected_method, impl);

      const result = sut.request(data, done);
    })
  );

  it('throws error if param is missing from data', done => {
    const impl = Class.implement(HttpImpl).extend({
      'virtual requestData': (url, method, data, callback) => {},
      setOptions: () => {},
    })();

    const sut = HttpDataApi.use(Sut(['foo']))('', 'PUT', impl);

    // missing `foo` in data
    sut.request({unused: 'missing foo'}, (err, data) => {
      expect(err).to.be.instanceof(Error);
      expect(err.message).to.match(/\bfoo\b/);

      expect(data).to.equal(null);

      done();
    });
  });
});
