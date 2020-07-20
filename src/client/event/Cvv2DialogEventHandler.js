/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Cvv2DialogEventHandler
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
 *
 * TODO: This can be generalized.
 */

var Class = require('easejs').Class,
  EventHandler = require('./EventHandler');

/**
 * Shows Cvv2 Dialog
 */
module.exports = Class('Cvv2DialogEventHandler')
  .implement(EventHandler)
  .extend({
    /**
     * jQuery instance
     *
     * @type {jQuery}
     */
    'private _jquery': null,

    /**
     * Initializes with client that will delegate the event
     *
     * @param {jQuery} jquery jquery instance
     */
    __construct: function (jquery) {
      this._jquery = jquery;
    },

    /**
     * Handles kick-back
     *
     * @param {string} type event id; ignored
     *
     * @param {function(*,Object)} continuation to invoke on completion
     *
     * @return {StatusEventHandler} self
     */
    'public handle': function (type, c, data) {
      var $dialog = this._jquery('#' + data.ref).dialog({
        title: 'CVV/CSV Verification Information',
        width: '500px',
        resizable: false,
        buttons: {
          Close: function () {
            $dialog.dialog('close');
          },
        },
      });
    },
  });
