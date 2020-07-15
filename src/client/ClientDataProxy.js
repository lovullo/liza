/**
 * Contains ClientDataProxy class
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
 *
 * @todo This has hard-coded references to the ``quote server'' and LoVullo
 */

var Class = require('easejs').Class,
  JqueryHttpDataProxy = require('./proxy/JqueryHttpDataProxy');

/**
 * Handles additional processing before passing HTTP request off to the
 * requester
 */
module.exports = Class('ClientDataProxy').extend(JqueryHttpDataProxy, {
  /**
   * Log error (if any) and process data before returning the parent's GET
   * request
   *
   * @param {string}                url      request URL
   * @param {function( Object, * }) callback request callback (success or
   *                                         failure)
   *
   * @return {ClientDataProxy} self
   */
  'protected override getData': function (url, callback) {
    var _self = this;

    this.__super(url, function (data, err) {
      if (err) {
        console.error('XHR GET Error: (%s) %s', url, err);
      }

      callback(_self._processData(data), err);
    });

    return this;
  },

  /**
   * Log error (if any) and process data before returning the parent's POST
   * request
   *
   * @param {string}                url      request URL
   * @param {Object}                data     data to post to server
   * @param {function( Object, * }) callback request callback (success or
   *                                         failure)
   *
   * @return {ClientDataProxy} self
   */
  'protected override postData': function (url, data, callback) {
    var _self = this;

    this.__super(url, data, function (data, err) {
      if (err) {
        console.error('XHR POST Error: (%s) %s', url, err);
      }

      callback(_self._processData(data), err);
    });
  },

  /**
   * Basic data post-processing
   *
   * If the response is empty/doesn't make sense, this will generate a
   * generic error.
   *
   * @param {Object} data response data
   *
   * @return processed data
   */
  'private _processData': function (data) {
    // if the data is null, then we didn't actually get a response from the
    // server - rather, the response was empty (that's bad!)
    data = data || {
      hasError: true,
      content:
        'There was a problem communicating with the quote ' +
        'server. If you continue to receive this message, please ' +
        'contact our support team for assistance.',
    };

    return data;
  },
});
