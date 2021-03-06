/**
 * Test case for JSON formatting of API result
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

var dapi = require('../../../').dapi,
  expect = require('chai').expect,
  Class = require('easejs').Class,
  DataApi = dapi.DataApi,
  Sut = dapi.format.JsonResponse;

describe('dapi.format.JsonRepsonse trait', function () {
  describe('.request', function () {
    it('passes data to encapsulated DataApi', function () {
      var stubs = _createStubbedDapi(null, '0'),
        expected = {};

      stubs.request(expected, function () {});
      expect(stubs.given).to.equal(expected);
    });

    it('converts response to JSON', function (done) {
      var raw = '{"foo": "bar"}';

      _createStubbedDapi(null, raw).request('', function (err, data) {
        // should have been converted to JSON
        expect(data).to.deep.equal({foo: 'bar'});
        expect(err).to.equal(null);
        done();
      });
    });

    describe('when JSON parsing fails', function () {
      it('returns error', function (done) {
        _createStubbedDapi(null, 'ERR').request('', function (err, data) {
          expect(err).to.be.instanceOf(SyntaxError);
          done();
        });
      });

      it('provides bad text as object.text', function (done) {
        var text = 'NOT JSON';

        _createStubbedDapi(null, text).request('', function (err, data) {
          expect(data).to.be.a('object');
          expect(data.text).to.equal(text);
          done();
        });
      });
    });

    describe('on request error from supertype', function () {
      it('attempts to format output as JSON', function (done) {
        var chk = '{"foo": "bar"}';

        _createStubbedDapi(null, chk).request('', function (_, data) {
          expect(data).to.be.a('object');
          expect(data.foo).to.equal('bar');
          done();
        });
      });

      it('proxies error when JSON output valid', function (done) {
        var e = Error('foo');

        _createStubbedDapi(e, '{}').request('', function (err, _) {
          expect(err).to.equal(e);
          done();
        });
      });

      it('produces both errors on bad JSON output', function (done) {
        var e = Error('foo');

        _createStubbedDapi(e, 'BAD JSON').request('', function (err, _) {
          // the main error should indicate both
          expect(err).to.be.instanceOf(Error);

          // and we should provide references to both
          expect(err.list[0]).to.equal(e);
          expect(err.list[1]).to.be.instanceOf(SyntaxError);

          done();
        });
      });
    });
  });
});

function _createStubbedDapi(err, resp) {
  return Class.implement(DataApi)
    .extend({
      given: null,

      'virtual public request': function (data, callback, id) {
        this.given = data;
        callback(err, resp);
      },
    })
    .use(Sut)();
}
