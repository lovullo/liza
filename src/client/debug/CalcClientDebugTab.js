/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-unused-vars: "off", no-undef: "off", prefer-arrow-callback: "off" */
/**
 * Contains CalcClientDebugTab class
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
  ClientDebugTab = require('./ClientDebugTab'),
  calc = require('../../calc/Calc');

/**
 * Monitors client-side assertions
 */
module.exports = Class('CalcClientDebugTab')
  .implement(ClientDebugTab)
  .extend({
    'private _$content': null,

    /**
     * Retrieve tab title
     *
     * @return {string} tab title
     */
    'public getTitle': function () {
      return 'Calculated Values';
    },

    /**
     * Retrieve tab content
     *
     * @param {Client}        client active client being debugged
     * @param {StagingBucket} bucket bucket to reference for data
     *
     * @return {jQuery|string} tab content
     */
    'public getContent': function (client, bucket) {
      this._$content = $('<div>').append(
        $('<p>').text(
          'Quick-n-dirty calculated value test tool. Select the ' +
            'method to test below, followed by the data and value ' +
            'arguments. See the Calc module for more information.'
        )
      );

      this._addRow();
      this._addButtons();

      return this._$content;
    },

    /**
     * Add calculated value row which will perform the requested calculation
     * with the provided parameter values
     *
     * @return {undefined}
     */
    'private _addRow': function () {
      var _self = this,
        $sel = null,
        $data = null,
        $value = null,
        $result = null,
        changeCallback = function () {
          _self._doCalc($sel.val(), $data.val(), $value.val(), $result);
        };
      this._$content.append(
        $('<div>')
          .addClass('row')
          .append(($sel = $('<select>').change(changeCallback)))
          .append(
            ($data = $('<input type="text">').val('[]').change(changeCallback))
          )
          .append(
            ($value = $('<input type="text">').val('[]').change(changeCallback))
          )
          .append(($result = $('<span>')))
      );

      for (method in calc) {
        $sel.append($('<option>').val(method).text(method));
      }

      changeCallback();
    },

    /**
     * Perform calculation and update given result element
     *
     * @param {string} sel     selected method
     * @param {string} data    given data argument
     * @param {string} value   given value argument
     * @param {jQuery} $result result element to update
     *
     * @return {undefined}
     */
    'private _doCalc': function (sel, data, value, $result) {
      var result = null;

      // don't do anything if no method was selected
      if (!sel) {
        return;
      }

      try {
        result = calc[sel](JSON.parse(data || []), JSON.parse(value || []));
      } catch (e) {
        result = 'ERROR (see console)';
        console.error(e);
      }

      $result.text(JSON.stringify(result));
    },

    /**
     * Append button that allows for the creation of additional calc rows and a
     * clear button
     *
     * @return {undefined}
     */
    'private _addButtons': function () {
      var _self = this;

      this._$content.append(
        $('<div>')
          .append(
            $('<button>')
              .text('+')
              .click(function () {
                _self._addRow();

                // move the button down to the bottom (quick and easy means
                // of doing so)
                $(this).parents('div:first').detach().appendTo(_self._$content);
              })
          )
          .append(
            $('<button>')
              .text('Clear')
              .click(function () {
                _self._$content.find('div.row:not(:first)').remove();
              })
          )
      );
    },
  });
