/**
 * Remote rater over HTTP
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
 *
 * @todo it's used with a PHP endpoint, but doesn't have to be called
 *       "HttpRater"
 */

var Class = require('easejs').Class;
var querystring = require('querystring');

/**
 * Rates using one of the PHP raters
 */
module.exports = Class('HttpRater').extend({
  /**
   * Used to communicate with PHP web server
   * @type {http}
   */
  'private _client': null,

  /**
   * Currently logged in session (performing rating)
   * @type {UserSession}
   */
  'private _session': null,

  /**
   * Alias of rater to use if only a single rate is desired
   * @type {string}
   */
  'private _only': '',

  /**
   * Number of seconds before rating will abort with a timeout error
   *
   * This is intended to provide more useful information, rather than waiting
   * for a socket timeout.
   *
   * @var number
   */
  'private _timeout': 100,

  /**
   * Initialize rater with the id of the program
   *
   * @param {http}        http_client  Node.js http client
   * @param {UserSession} session      current session (performing rating)
   * @param {string}      host         hostname, if different from host addr
   * @param {string}      remote_path  endpoint path on server
   * @param {string}      domain       hostname to pass in the request header.
   */
  __construct: function (http_client, session, host, remote_path, domain) {
    this._client = http_client;
    this._session = session;
    this._host = host ? '' + host : this._client.host;
    this._path = '' + remote_path;
    this._domain = domain ? '' + domain : this._host;
  },

  /**
   * Indicate that only the given alias should be used when rating
   *
   * @param {string} alias alias to rate with
   *
   * @return {HttpRater} self
   */
  'public only': function (alias) {
    if (!alias) {
      return this;
    }

    this._only = '' + alias;
    return this;
  },

  /**
   * Rate the provided quote
   *
   * The agent id is appended to the arguments for each request. This is
   * necessary, since we are making the request internally, not the broker. As
   * such, the session data will not be populated within PHP as it would
   * normally. We may wish for a better solution in the future (e.g. passing
   * the actual session id so we can simply load all of the data from within
   * PHP).
   *
   * Please note: args will be modified to append agent_id. It is not removed,
   * so be careful when passing objects to this method.
   *
   * @param {Quote}              quote quote to rate
   * @param {function(err,data)} callback to call when complete
   *
   * @return {HttpRater} self
   */
  'public rate': function (quote, args, callback) {
    var _self = this,
      // data to include in GET request (errdetail will allow us to see
      // the actual error message)
      data = querystring.stringify({
        quoteId: quote.getId(),
        errdetail: 1,
      }),
      path = this._path + '?' + data;
    // append agent_id of current session and agent id associated with the
    // quote
    args.agent_id = this._session.agentId();
    args.quote_agent_id = quote.getAgentId();

    // we may wish to only retrieve the rates for a single alias
    if (this._only) {
      args.only = this._only;
      args.noautodefer = true;
    }

    // return an error if we do not receive a response within a
    // certain period of time
    var http_resp = null,
      req = null,
      timeout = setTimeout(function () {
        // if we have a response, close the connection
        http_resp && http_resp.end();
        req && req.end();

        callback(Error('Rating timeout'), null);
      }, _self._timeout * 1000);

    opts = {
      method: 'POST',
      path: path,
      host: this._host,
      headers: {host: this._domain},
      setHost: false,
    };
    req = this._client
      .request(opts)
      .on('response', function (response) {
        var data = '';

        http_resp = response;

        response
          .on('data', function (chunk) {
            data += chunk.toString('utf8');
          })
          .on('end', function () {
            clearTimeout(timeout);
            _self._parseResponse(data, callback);
          })
          .on('error', function (err) {
            clearTimeout(timeout);
            callback(err, null);
          });
      })
      .once('error', function (err) {
        clearTimeout(timeout);
        callback(err, null);
      })
      .end(JSON.stringify(args));
  },

  /**
   * Parses response from webserver
   *
   * The callback function will be called with any error (or null) as the
   * first argument and the response data (or null if error) as the second.
   * This is a common convention for callbacks since thorwing exceptions does
   * not work well with asynchronous calls (since async only executed after
   * stack has been cleared).
   *
   * @param {string}              data_str response string from webserver
   * @param {function(err, data)} callback function to call with response
   *
   * @return {undefined}
   */
  'private _parseResponse': function (data_str, callback) {
    var error = null,
      retdata = null;

    try {
      data = JSON.parse(data_str);

      // if the server responded with an error, return it
      if (data.hasError !== false) {
        error = Error(
          'Server responded with error: ' + (data.content || '(empty)')
        );
      } else {
        // return the content of the response rather than the entire
        // response (we treat the rest a bit like one would treat a
        // header)
        retdata = data.content;
      }
    } catch (e) {
      error = TypeError('Invalid JSON provided: ' + data_str);
    }

    callback(error, retdata);
  },

  /**
   * Sets number of seconds before rating attempt will time out and trigger a
   * rating error
   *
   * @param {number} seconds timeout in seconds
   *
   * @return {HttpRater} self
   */
  'public setTimeout': function (seconds) {
    this._timeout = +seconds;
    return this;
  },
});
