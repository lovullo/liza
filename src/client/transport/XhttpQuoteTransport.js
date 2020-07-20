/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", prefer-arrow-callback: "off" */
/**
 * Contains JqueryXhttpQuoteTransport class
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
  QuoteTransport = require('./QuoteTransport');

/**
 * Transfers quote data via an XHTTP request using jQuery
 */
module.exports = Class('XhttpQuoteTransport')
  .implement(QuoteTransport)
  .extend({
    /**
     * HttpProxy used to send data
     * @type {HttpProxy}
     */
    'private _proxy': null,

    /**
     * URL to post quote data to
     * @type {string}
     */
    'private _url': '',

    /**
     * Indicates a concluding save
     * @type {boolean}
     */
    'private _concluding_save': false,

    /**
     * Constructs a new quote transport with the destination URL and proxy
     *
     * @param {string}        url             destination URL
     * @param {HttpDataProxy} proxy           proxy to use for transfer
     * @param {boolean}       concluding_save concluding save
     *
     * @return {undefined}
     */
    'public __construct': function (url, proxy, concluding_save) {
      this._url = '' + url;
      this._proxy = proxy;
      this._concluding_save = concluding_save;
    },

    /**
     * Transfers quote data to the remote server
     *
     * The callback function is called even if an error occurs. Be sure to check
     * the error argument for problems before assuming that everything went
     * well.
     *
     * @param {ClientQuote}   quote    quote to transfer
     * @param {function( * )} callback function to call when complete
     *
     * @return void
     */
    'public send': function (quote, callback) {
      var _self = this;

      quote.visitData(function (bucket) {
        // get the data from the bucket
        var data = _self.getBucketDataJson(bucket);

        // post the data
        _self._proxy.post(
          _self._url,
          {data: data, concluding_save: _self._concluding_save},
          function (data, error) {
            if (typeof callback === 'function') {
              callback.call(this, error || null, data);
            }
          }
        );
      });
    },

    /**
     * Retrieve bucket data in JSON format
     *
     * The serialized data will have the arrays truncated at the position of
     * the first `null`; since all `undefined` values are serialized as
     * `"null"`, there is otherwise no way to disambiguate a truncation
     * point.
     *
     * Allows subtypes to override what data is retrieved from the bucket
     *
     * @param {Bucket} bucket bucket from which to retrieve data
     *
     * @return {XhttpQuoteTransport} self
     */
    'virtual protected getBucketDataJson': function (bucket) {
      // get a "filled" diff containing the merged values of only the fields
      // that have changed
      const raw_data = bucket.getFilledDiff();

      // truncated data to serialize
      const data = {};

      Object.keys(raw_data).forEach(field => {
        const val = raw_data[field];

        if (Array.isArray(val) && val.length === 0) {
          return;
        }

        data[field] = this._truncateDiff(raw_data[field]);
      });

      return JSON.stringify(data);
    },

    /**
     * Truncate just after first null
     *
     * If there are no nulls, then the diff is returned
     * unmodified.  Otherwise, the array is truncated at the index of the
     * first `null` (so that a trailing `null` still exists).
     *
     * WARNING: This modifies DIFF; it does not return a copy!
     *
     * @param {Array} diff bucket diff
     *
     * @return {Array} possibly truncated diff
     */
    'private _truncateDiff'(diff) {
      const null_i = diff.findIndex(x => x === null);

      // no nulls, retain as-is
      if (null_i === -1) {
        return diff;
      }

      // truncate following the first null (indicating that we terminate at
      // this position)
      diff.length = null_i + 1;

      return diff;
    },
  });
