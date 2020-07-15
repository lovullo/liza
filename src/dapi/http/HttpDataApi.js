/**
 * Data transmission over HTTP(S)
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

const {Class} = require('easejs');
const DataApi = require('../DataApi');
const HttpImpl = require('./HttpImpl');

// RFC 2616 methods
const rfcmethods = {
  DELETE: true,
  GET: true,
  HEAD: true,
  OPTIONS: true,
  POST: true,
  PUT: true,
  TRACE: true,
};

/**
 * HTTP request abstraction. Does minor validation, but delegates to a specific
 * HTTP implementation for the actual request.
 */
module.exports = Class('HttpDataApi')
  .implement(DataApi)
  .extend({
    /**
     * Request URL
     * @type {string}
     */
    'private _url': '',

    /**
     * HTTP method
     * @type {string}
     */
    'private _method': '',

    /**
     * HTTP implementation to perfom request
     * @type {HttpImpl}
     */
    'private _impl': null,

    /**
     * MIME media type
     * @type {string}
     */
    'private _enctype': '',

    /**
     * Initialize Data API with destination and HTTP implementation
     *
     * The supplied HTTP implementation will be used to perform the HTTP
     * requests, which permits the user to use whatever implementation works
     * well with their existing system.
     *
     * Default `enctype` is `application/x-www-form-urlencoded`.
     *
     * TODO: Accept URI encoder.
     *
     * @param {string}    url     destination URL
     * @param {string}    method  RFC-2616-compliant HTTP method
     * @param {HttpImpl}  impl    HTTP implementation
     * @param {string=}   enctype MIME media type
     *
     * @throws {TypeError} when non-HttpImpl is provided
     */
    __construct: function (url, method, impl, enctype) {
      if (!Class.isA(HttpImpl, impl)) {
        throw TypeError('Expected HttpImpl');
      }

      this._url = '' + url;
      this._method = this._validateMethod(method);
      this._impl = impl;

      this._enctype = enctype
        ? '' + enctype
        : 'application/x-www-form-urlencoded';
    },

    /**
     * Perform an asynchronous request and invoke the callback with the reply
     *
     * DATA must be either a string or an object; the latter is treated as a
     * key-value parameter list, which will have each key and value
     * individually URI-encoded and converted into a string, delimited by
     * ampersands.  `null` may be used to indicate that no data should be
     * sent.
     *
     * In the event of an error, the first parameter is the error; otherwise, it
     * is null. The return data shall not be used in the event of an error.
     *
     * The return value shall be a raw string; conversion to other formats must
     * be handled by a wrapper.
     *
     * @param {?Object<string,string>|string} data request params or post data
     *
     * @param {function(?Error,*):string} callback continuation upon reply
     *
     * @return {DataApi} self
     *
     * @throws {TypeError} on validation failure
     */
    'virtual public request': function (data, callback, id) {
      // null is a good indicator of "I have no intent to send any data";
      // empty strings and objects are not, since those are valid data
      if (data === null) {
        data = '';
      }

      this._validateDataType(data);

      this.requestData(this._url, this._method, data, callback);

      return this;
    },

    /**
     * Request data from underlying HttpImpl
     *
     * Subtypes may override this method to alter any aspect of the request
     * before sending.
     *
     * @param {string}                    url      destination URL
     * @param {string}                    method   RFC-2616-compliant HTTP method
     * @param {Object|string}             data     request params
     * @param {function(?Error, ?string)} callback server response callback
     *
     * @return {HttpDataApi} self
     */
    'virtual protected requestData'(url, method, data, callback) {
      return this._impl.requestData(
        url,
        method,
        this.encodeData(data),
        callback
      );
    },

    /**
     * Ensures that the provided method conforms to RFC 2616
     *
     * @param {string} method HTTP method
     * @return {string} provided method
     *
     * @throws {Error} on non-conforming method
     */
    'private _validateMethod': function (method) {
      if (!rfcmethods[method]) {
        throw Error('Invalid RFC 2616 method: ' + method);
      }

      return method;
    },

    /**
     * Validates that the provided data type is accepted by the Data API
     *
     * @param {*} data data to validate
     * @return {undefined}
     *
     * @throws {TypeError} on validation failure
     */
    'private _validateDataType': function (data) {
      const type = typeof data;

      if (!(type === 'string' || type === 'object')) {
        throw TypeError(
          'Data must be a string of raw data or object containing ' +
            'key-value params'
        );
      }
    },

    /**
     * Generate params for URI from key-value `data`
     *
     * Conversion depends on the MIME type (enctype) with which this instance
     * was initialized.  For example, `application/x-www-form-urlencoded`
     * will result in a urlencoded string, whereas `application/json` will
     * simply be serialized.
     *
     * If `data` is not an object, it will be returned as a string datum.
     *
     * @param {Object<string,string>|string} data key-value request params
     *
     * @return {string} generated URI, or empty if no keys
     */
    'protected encodeData': function (data) {
      if (typeof data !== 'object') {
        return '' + data;
      }

      if (this._method !== 'POST') {
        return this._urlEncode(data);
      }

      switch (this._enctype) {
        case 'application/x-www-form-urlencoded':
          return this._urlEncode(data);

        case 'application/json':
          return JSON.stringify(data);

        default:
          throw Error('Unknown enctype for POST: ' + this._enctype);
      }
    },

    /**
     * urlencode each key of provided object
     *
     * @param {Object} obj key/value
     *
     * @return {string} urlencoded string, joined with '&'
     */
    'private _urlEncode'(obj) {
      return Object.keys(obj)
        .map(
          key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key])
        )
        .join('&');
    },
  });
