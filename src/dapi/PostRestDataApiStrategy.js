/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", prefer-arrow-callback: "off" */
/**
 * Concrete PostRestDataApiStrategy class
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

var Class = require('easejs').Class,
  RestDataApiStrategy = require('./RestDataApiStrategy'),
  // XXX: decouple (this couples us to the client)!
  HttpDataProxy = require('../client/proxy/HttpDataProxy');

/**
 * Requests data from a RESTful service, POSTing arguments
 */
module.exports = Class('PostRestDataApiStrategy')
  .implement(RestDataApiStrategy)
  .extend({
    /**
     * Data proxy used to communicate with the service
     * @type {HttpDataProxy}
     */
    'private _proxy': null,

    /**
     * Initialize strategy
     *
     * The strategy is independent of any URL; that is, we should not pass the
     * URL here, as the strategy can be re-used for *any* RESTful service.
     *
     * @param {HttpDataProxy} data_proxy proxy to handle all requests
     */
    __construct: function (data_proxy) {
      if (!Class.isA(HttpDataProxy, data_proxy)) {
        throw Error('Expected HttpDataProxy; given ' + data_proxy);
      }

      this._proxy = data_proxy;
    },

    /**
     * Request data from the service
     *
     * @param {string}           url      service URL
     * @param {Object}           data     request params
     * @param {function(Object)} callback server response callback
     *
     * @return {RestDataApi} self
     */
    'public requestData': function (url, data, callback) {
      this._proxy.post(url, data, function (retdata) {
        callback(retdata);
      });

      return this;
    },
  });
