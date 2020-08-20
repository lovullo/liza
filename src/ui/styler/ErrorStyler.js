/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-unused-vars: "off" */
/**
 * Error condition field styler
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
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
  Styler = require('./Styler');

/**
 * Handle error generation and defer styling to supertype
 */
module.exports = Class('ErrorStyler')
  .implement(Styler)
  .extend({
    /**
     * Hash of error messages by field name
     * @type {Object}
     */
    'private _msgs': {},

    /**
     * Initialize error styler with a hash of error messages by field name
     *
     * @param {Object} msgs hash of error messages by field name
     */
    'virtual __construct': function (msgs) {
      this._msgs = msgs;
    },

    'public getHooks': function (uistyler) {
      var _self = this;

      return {
        fieldError: function (context, failures, msgs) {
          msgs = msgs || {};

          for (var name in failures) {
            var msgset = msgs[name] || [];

            for (var index in failures[name]) {
              // if no error message was provided, fall back to one of
              // the defaults
              var msg =
                msgset[index] || _self._msgs[name] || 'Field is invalid';

              console.log({failures});

              _self.onFieldError(context.getFieldByName(name, index), msg);
            }
          }
        },

        fieldFixed: function (context, fixed) {
          for (var name in fixed) {
            for (var index in fixed[name]) {
              _self.onFieldFixed(context.getFieldByName(name, index));
            }
          }
        },
      };
    },

    'virtual protected onFieldError': function (field, msg) {
      // do nothing by default
    },

    'virtual protected onFieldFixed': function (field) {
      // do nothing by default
    },
  });
