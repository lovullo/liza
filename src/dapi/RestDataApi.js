/**
 * Contains concrete RestDataApi class
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
  DataApi = require('liza/dapi/DataApi'),
  RestDataApiStrategy = require('./RestDataApiStrategy');

/**
 * Retrieve data over a RESTful API
 */
module.exports = Class('RestDataApi')
  .implement(DataApi)
  .extend({
    /**
     * URL of RESTful service
     * @type {string}
     */
    'private _url': '',

    /**
     * Strategy used to request data from the service
     * @type {RestDataApiStrategy}
     */
    'private _strategy': null,

    /**
     * Initialize data API
     *
     * @param {string}              url      service URL
     * @param {RestDataApiStrategy} strategy request strategy
     */
    __construct: function (url, strategy) {
      if (!Class.isA(RestDataApiStrategy, strategy)) {
        throw Error('Expected RestDataApiStrategy; given ' + strategy);
      }

      this._url = '' + url;
      this._strategy = strategy;
    },

    /**
     * Request data from the service
     *
     * @param {Object}           data     request params
     * @param {function(Object)} callback server response callback
     *
     * @return {RestDataApi} self
     */
    'public request': function (data, callback, id) {
      var _self = this.__inst;

      this._strategy.requestData(this._url, data, function (data) {
        // return the data, but bind 'this' to ourself
        callback.call(_self, data);
      });

      return this;
    },
  });
