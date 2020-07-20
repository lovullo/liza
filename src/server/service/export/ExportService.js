/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-unused-vars: "off", prefer-arrow-callback: "off" */
/**
 * Export to external system
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
 * @todo relies on `c1` key; generalize (do not tie to ConceptOne
 *       terminology)
 */

var Class = require('easejs').Class,
  Service = require('../Service'),
  Program = require('../../../program/Program').Program,
  Quote = require('../../../quote/Quote'),
  UserRequest = require('../../request/UserRequest'),
  UserResponse = require('../../request/UserResponse');

/**
 * Triggers external system import
 */
module.exports = Class('ExportService')
  .implement(Service)
  .extend({
    /**
     * @type {Object} object with `request` method for HTTP requests
     */
    'private _http': null,

    /**
     * Initialize service
     *
     * @param {Object} http object with `request` method for HTTP requests
     */
    __construct: function (http) {
      this._http = http;
    },

    /**
     * Trigger external system import
     *
     * This exports by requesting an import from an external
     * system.  EXPORT_CLIENT can be any client (e.g. ClientRequest) that
     * has `response` and `error` events, with `response` yielding a single
     * argument with a #setEncoding method and `data` and `end` events.
     *
     * @param {UserRequest}  request  user request to satisfy
     * @param {UserResponse} response pending response
     * @param {Quote}        quote    quote to export
     * @param {string}       cmd      applicable of command request
     * @param {Function}     callback continuation after saving is complete
     *
     * @return {ExportService} self
     */
    'virtual public request': function (
      request,
      response,
      quote,
      cmd,
      callback
    ) {
      cmd = '' + (cmd || '');

      if (!Class.isA(UserRequest, request)) {
        throw TypeError('UserRequest expected; given ' + request);
      }

      if (!Class.isA(UserResponse, response)) {
        throw TypeError('UserResponse expected; given ' + response);
      }

      if (!Class.isA(Quote, quote)) {
        throw TypeError('Quote expected; given ' + quote);
      }

      if (cmd) {
        throw Error('Unknown command: ' + cmd);
      }

      var program = quote.getProgram();

      this._handleExportRequest(request, response, program, quote, callback);

      return this;
    },

    'private _handleExportRequest': function (
      request,
      response,
      program,
      quote,
      callback
    ) {
      var path;
      var export_client = this._http.request(
        request,
        (path = this._genClientPath(program, quote, request.getGetData()))
      );

      this._doExport(export_client, function (e, reply) {
        // TODO: incomplete
        if (e !== null) {
          response.internalError(e.message);
          return;
        }

        response.ok(reply);
        callback && callback();
      });
    },

    /**
     * Generate quote request URI
     *
     * @param {Program} program program associated with quote
     * @param {Quote}   quote   quote to export
     *
     * @return {string} generated URI
     */
    'private _genClientPath': function (program, quote, params) {
      var program_id = quote.getProgramId(),
        quote_id = quote.getId(),
        prefix = (program.export_path || {}).c1;

      if (!prefix) {
        throw Error('Program missing export_path.c1');
      }

      return (
        prefix +
        '?pid=' +
        program_id +
        '&qid=' +
        quote_id +
        this._joinParams(params)
      );
    },

    /**
     * XXX: This does no encoding!  Instead, we should use Liza's
     * HttpDataApi, which will handle all that stuff for us.
     *
     * @param {Object.<string,string>} params key-value
     */
    'private _joinParams': function (params) {
      var uri = '';

      for (var key in params) {
        uri += uri ? '&' : '';
        uri += key + '=' + params[key];
      }

      return uri ? '&' + uri : '';
    },

    /**
     * Request external import and await reply
     *
     * @param {ClientRequest} export_client pre-initialized HTTP client
     *
     * @param {function(?Error,?string)} callback
     *
     * @return {ExportService} self
     */
    'private _doExport': function (export_client, callback) {
      export_client.on('response', function (response) {
        var data = '';

        response.setEncoding('utf8');

        response
          .on('data', function (chunk) {
            data += chunk;
          })
          .on('end', function () {
            callback(null, data);
          });
      });

      export_client.on('error', function (e) {
        export_client.abort();
        callback(e, null);
      });

      export_client.end();

      return this;
    },
  });
