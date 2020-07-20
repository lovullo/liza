/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-unused-vars: "off", no-undef: "off", prefer-arrow-callback: "off" */
/**
 * Contains AssertionClientDebugTab class
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

var Class = require('easejs').Class,
  ClientDebugTab = require('./ClientDebugTab');
/**
 * Monitors client-side assertions
 */
module.exports = Class('AssertionClientDebugTab')
  .implement(ClientDebugTab)
  .extend({
    /**
     * Client being monitored
     * @type {Client}
     */
    'private _client': null,

    /**
     * Current log index
     * @type {number}
     */
    'private _logIndex': 0,

    /**
     * Table holding assertion log entries
     * @type {jQuery}
     */
    'private _$table': null,

    /**
     * Reference to paint timeout timer
     * @type {?number}
     */
    'private _paintTimeout': null,

    /**
     * Event stack
     * @type {Array.<Arguments|Array>}
     */
    'private _stack': [],

    /**
     * Retrieve tab title
     *
     * @return {string} tab title
     */
    'public getTitle': function () {
      return 'Assertions';
    },

    /**
     * Retrieve tab content
     *
     * @param {Client}        client active client being debugged
     * @param {StagingBucket} bucket bucket to reference for data
     *
     * @return {jQuery} tab content
     */
    'public getContent': function (client, bucket) {
      // cut down on argument list
      this._client = client;

      return this._createAssertionsContent();
    },

    /**
     * Create tab content
     *
     * @return {jQuery} tab content
     */
    'private _createAssertionsContent': function () {
      var _self = this;

      this._hookAssertEvent();
      this._hookTriggerEvent();

      return $('<div> ')
        .append(
          $('<p>')
            .text(
              'Below is a list of all assertions performed (in real ' + 'time).'
            )
            .append(
              $('<button>')
                .text('Clear')
                .click(function () {
                  return _self._clearTable();
                })
            )
        )
        .append(this._getAssertionsLegend())
        .append(this._getAssertionsTable());
    },

    /**
     * Monitor assertions
     *
     * Each time an assertion occurs, it will be added to a stack (since the
     * events will occur in reverse order). Once the assertion depth reaches
     * zero, it will clear the stack and output each of the assertions/events.
     *
     * @return {undefined}
     */
    'private _hookAssertEvent': function () {
      var _self = this;

      this._client.program.on('assert', function () {
        // the hook needs to be refactored; too many arguments
        var depth = arguments[7];

        // add to the stack so that we can output the assertion and its
        // subassertions once we reach the root node (this trigger is
        // called in reverse order, since we don't know the end result
        // of a parent assertion until we know the results of its
        // children)
        _self._stack.push(arguments);
        if (depth > 0) {
          return;
        }

        // our depth is 0; output the log data
        _self._processStack();
      });
    },

    /**
     * Monitor triggers
     *
     * @return {undefined}
     */
    'private _hookTriggerEvent': function () {
      var _self = this;

      this._client.on('trigger', function (event_name, data) {
        _self._stack.push(['trigger', event_name, data]);
      });
    },

    /**
     * Process stack, appending data to log table
     *
     * @return {undefined}
     */
    'private _processStack': function () {
      var _self = this,
        item;

      while ((item = this._stack.pop())) {
        if (item[0] === 'trigger') {
          _self._appendTrigger.apply(_self, item);
        } else {
          _self._appendAssertion.apply(_self, item);
        }
      }
    },

    /**
     * Clear all results from the assertions log table
     *
     * @return {boolean} true (to prevent navigation)
     */
    'private _clearTable': function () {
      // remove all records and reset counter
      this._getAssertionsTable().find('tbody tr').remove();
      this._logIndex = 0;

      return true;
    },

    /**
     * Generate table to contain assertion log
     *
     * @return {jQuery} generated log table
     */
    'private _getAssertionsTable': function () {
      return (this._$table =
        this._$table ||
        (function () {
          return $('<table>')
            .attr('id', 'assertions-table')
            .append(
              $('<thead>').append(
                $('<tr>')
                  .append($('<th>').text('#'))
                  .append($('<th>').text('question_id'))
                  .append($('<th>').text('method'))
                  .append($('<th>').text('expected'))
                  .append($('<th>').text('given'))
                  .append($('<th>').text('thisresult'))
                  .append($('<th>').text('result'))
              )
            )
            .append($('<tbody>'));
        })());
    },

    /**
     * Append an assertion to the log
     *
     * XXX: This needs refactoring (rather, the hook does)
     *
     * @param {string}  assertion  assertion method
     * @param {string}  qid        question id
     * @param {Array}   expected   expected data
     * @param {Array}   given      data given to the assertion
     * @param {boolean} thisresult result before sub-assertions
     * @param {boolean} result     result after sub-assertions
     * @param {boolean} record     whether failures will be recorded as such
     * @param {number}  depth      sub-assertion depth
     *
     * @return {undefined}
     */
    'private _appendAssertion': function (
      assertion,
      qid,
      expected,
      given,
      thisresult,
      result,
      record,
      depth
    ) {
      this._getAssertionsTable()
        .find('tbody')
        .append(
          $('<tr>')
            .addClass(result ? 'success' : 'failure')
            .addClass(thisresult ? 'thissuccess' : 'thisfailure')
            .addClass(record ? 'recorded' : '')
            .addClass('adepth' + depth)
            .append(
              $('<td>')
                .text(this._logIndex++)
                .addClass('index')
            )
            .append(
              $('<td>').append(
                $('<span>')
                  .attr('title', 'Depth: ' + depth)
                  .html(Array((depth + 1) * 4).join('&nbsp;') + qid)
              )
            )
            .append($('<td>').text(assertion.getName()))
            .append($('<td>').text(JSON.stringify(expected)))
            .append($('<td>').text(JSON.stringify(given)))
            .append($('<td>').text('' + thisresult))
            .append($('<td>').text('' + result + (record ? '' : '*')))
        );

      // let the system know that the paint line should be drawn
      this._paintLine();
    },

    'private _appendTrigger': function (_, event_name, data) {
      this._getAssertionsTable()
        .find('tbody')
        .append(
          $('<tr>')
            .addClass('trigger')
            .append($('<td>').text(' '))
            .append($('<td>').text(event_name))
            .append($('<td>').attr('colspan', 6).text(JSON.stringify(data)))
        );

      this._paintLine();
    },

    /**
     * Generate assertions legend
     *
     * @return {jQuery} div containing legend
     */
    'private _getAssertionsLegend': function () {
      return $('<div>')
        .attr('id', 'assert-legend')
        .append($('<div>').addClass('assert-legend-item').addClass('root'))
        .append('<span>Root Assertion</span>')
        .append($('<div>').addClass('assert-legend-item').text('*'))
        .append('<span>Unrecorded</span>')
        .append($('<div>').addClass('assert-legend-item').addClass('trigger'))
        .append('<span>Trigger</span>')
        .append($('<div>').addClass('assert-legend-item').addClass('paint'))
        .append('<span>Paint</span>')
        .append('<br />')
        .append($('<div>').addClass('assert-legend-item').addClass('failure'))
        .append('<span>Failure</span>')
        .append(
          $('<div>').addClass('assert-legend-item').addClass('unrecorded')
        )
        .append(
          '<span>Failure, but suceeded by subassertion or ' +
            'unrecorded</span>'
        );
    },

    /**
     * Draw paint line
     *
     * The paint line represents when a paint operation was able to occur. This
     * allows us to see how many bucket values were updated between paints,
     * which (depending on what hooks the bucket) could have negative
     * consequences on performance.
     *
     * This is simple to detect - simply use a setTimeout() and it will execute
     * after the stack has cleared and the page has been painted.
     *
     * @return {undefined}
     */
    'private _paintLine': function () {
      var _self = this;

      this._paintTimeout && clearTimeout(this._paintTimeout);
      this._paintTimeout = setTimeout(function () {
        _self._getAssertionsTable().find('tr:last').addClass('last-pre-paint');
      }, 25);
    },
  });
