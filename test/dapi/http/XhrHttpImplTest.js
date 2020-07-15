/**
 * Test case for XMLHttpRequest HTTP protocol implementation
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

const {expect} = require('chai');
const {Class} = require('easejs');

const {HttpImpl, XhrHttpImpl: Sut, HttpError} = require('../../../').dapi.http;

const DummyXhr = function () {
  this.open = function () {
    DummyXhr.args = arguments;
  };
};

describe('XhrHttpImpl', function () {
  /**
   * Since ECMAScript does not have return typing, we won't know if the ctor
   * actually returns an XMLHttpRequest until we try.
   */
  it('will accept any constructor', function () {
    expect(function () {
      Sut(function () {});
    }).to.not.throw(Error);
  });

  it('is an HttpImpl', function () {
    var sut = Sut(function () {});
    expect(Class.isA(HttpImpl, sut)).to.be.ok;
  });

  describe('.requestData', function () {
    it('requests a connection using the given method', function () {
      var method = 'GET',
        sut = Sut(DummyXhr);

      sut.requestData('http://foo', method, '', function () {});

      var args = DummyXhr.args;
      expect(args[0]).to.equal(method);
    });

    /**
     * Since the request is asynchronous, we should be polite and not return
     * errors in two different formats; we will catch it and instead pass it
     * back via the callback.
     */
    it('returns XHR open() errors via callback', function (done) {
      var e = Error('Test error'),
        Xhr = function () {
          this.open = function () {
            throw e;
          };
        };

      // should not throw an exception
      expect(function () {
        // should instead provide to callback
        Sut(Xhr).requestData('http://foo', 'GET', '', function (err, data) {
          expect(err).to.equal(e);
          expect(data).to.equal(null);
          done();
        });
      }).to.not.throw(Error);
    });

    it('returns XHR response via callback when no error', function (done) {
      var retdata = 'foobar',
        StubXhr = createStubXhr();

      StubXhr.prototype.responseText = retdata;
      StubXhr.prototype.readyState = 4; // done
      StubXhr.prototype.status = 200; // OK

      Sut(StubXhr).requestData('http://bar', 'GET', '', function (err, resp) {
        expect(err).to.equal(null);
        expect(resp).to.equal(retdata);
        done();
      });
    });

    describe('HTTP method is GET', function () {
      it('appends data to URL', function (done) {
        var url = 'http://bar',
          src = 'moocow%foocow%',
          StubXhr = createStubXhr();

        StubXhr.prototype.readyState = 4; // done
        StubXhr.prototype.status = 200; // OK

        StubXhr.prototype.open = function (_, given_url) {
          // no additional encoding should be performed; it's
          // assumed to have already been done
          expect(given_url).to.equal(url + '?' + src);
        };

        StubXhr.prototype.send = function (data) {
          // no posting on GET
          expect(data).is.equal(undefined);
          StubXhr.inst.onreadystatechange();
        };

        Sut(StubXhr).requestData(url, 'GET', src, done);
      });

      it('leaves URL unaltered when data is empty', function (done) {
        var url = 'http://bar',
          StubXhr = createStubXhr();

        StubXhr.prototype.readyState = 4; // done
        StubXhr.prototype.status = 200; // OK

        StubXhr.prototype.open = function (_, given_url) {
          // unaltered
          expect(given_url).to.equal(url);
        };

        Sut(StubXhr).requestData(url, 'GET', '', done);
      });

      it('does not set Content-Type', function (done) {
        var url = 'http://bar',
          StubXhr = createStubXhr();

        StubXhr.prototype.readyState = 4; // done
        StubXhr.prototype.status = 200; // OK

        StubXhr.prototype.setRequestHeader = function () {
          // warning: this is fragile, if additional headers are
          // ever set
          throw Error('Headers should not be set on GET');
        };

        Sut(StubXhr).requestData(url, 'GET', '', done);
      });
    });

    describe('HTTP method is not GET', function () {
      it('sends data verbatim as x-www-form-urlencoded', function (done) {
        var url = 'http://bar',
          src = 'moocow',
          StubXhr = createStubXhr(),
          open_called = false,
          send_called = false,
          header_called = false;

        StubXhr.prototype.readyState = 4; // done
        StubXhr.prototype.status = 200; // OK

        StubXhr.prototype.open = function (_, given_url) {
          open_called = true;

          // URL should be unchanged
          expect(given_url).to.equal(url);
        };

        StubXhr.prototype.send = function (data) {
          send_called = true;

          expect(data).is.equal(src);
          StubXhr.inst.onreadystatechange();
        };

        StubXhr.prototype.setRequestHeader = function (name, val) {
          header_called = true;

          // warning: this is fragile, if additional headers are
          // ever set
          expect(name).to.equal('Content-Type');
          expect(val).to.equal('application/x-www-form-urlencoded');
        };

        Sut(StubXhr).requestData(url, 'POST', src, function () {
          expect(open_called && send_called && header_called).to.be.true;
          done();
        });
      });
    });

    describe('if return status code is not successful', function () {
      /**
       * This is the default behavior, but can be changed by overriding
       * the onLoad method.
       */
      it('returns error to callback with status code', function (done) {
        var StubXhr = createStubXhr();
        StubXhr.prototype.status = 404;

        Sut(StubXhr).requestData('http://foo', 'GET', '', function (err, _) {
          expect(err).to.be.instanceOf(HttpError);

          expect(err.message).to.contain(StubXhr.prototype.status);

          expect(err.status).to.equal(StubXhr.prototype.status);

          done();
        });
      });

      it('returns response text as output', function (done) {
        var StubXhr = createStubXhr(),
          status = 404,
          reply = 'foobunny';

        StubXhr.prototype.responseText = reply;

        Sut(StubXhr).requestData('http://foo', 'GET', '', function (_, resp) {
          expect(resp).to.equal(reply);
          done();
        });
      });
    });

    it('considers any 2xx status to be successful', function (done) {
      var StubXhr = createStubXhr();
      StubXhr.prototype.status = 250;

      Sut(StubXhr).requestData('http://foo', 'GET', '', function (err, _) {
        expect(err).to.equal(null);
        done();
      });
    });

    it('allows overriding notion of success/failure', function (done) {
      var chk = 12345;

      // succeed on CHK
      var StubXhr = createStubXhr();
      StubXhr.prototype.status = chk;

      Sut.extend({
        'override protected isSuccessful': function (status) {
          return status === chk;
        },
      })(StubXhr).requestData('http://foo', 'GET', '', function (err, resp) {
        expect(err).to.equal(null);
        done();
      });
    });

    it('allows customizing error', function (done) {
      var _self = this,
        chk = {};

      var StubXhr = createStubXhr();
      StubXhr.prototype.status = 404;

      Sut.extend({
        'override protected serveError': function (req, callback) {
          var e = Error('foobunny');
          e.foo = true;

          expect(req).to.be.an.instanceOf(StubXhr);

          callback(e, chk);
        },
      })(StubXhr).requestData('http://foo', 'GET', '', function (err, resp) {
        expect((err || {}).foo).to.be.ok;
        expect(resp).to.equal(chk);

        done();
      });
    });

    it('returns self', function () {
      var sut = Sut(function () {}),
        ret = sut.requestData('http://foo', 'GET', '', function () {});

      expect(ret).to.equal(sut);
    });
  });
});

function createStubXhr() {
  var StubXhr = function () {
    StubXhr.inst = this;
  };

  StubXhr.prototype = {
    onreadystatechange: null,
    responseText: '',
    readyState: 4, // don,
    status: 200, // O,

    open: function () {},
    send: function (data) {
      this.onreadystatechange();
    },
    setRequestHeader: function () {},
  };

  return StubXhr;
}
