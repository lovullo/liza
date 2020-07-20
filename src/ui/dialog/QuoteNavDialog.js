/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-unused-vars: "off" */
/**
 * Contains quote navigation dialog decorator
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
  DialogDecorator = require('./DialogDecorator');

/**
 * Provides logical defaults for the dirty dialog
 */
module.exports = Class('QuoteNavDialog').extend(DialogDecorator, {
  /**
   * Function to call when search button is clicked
   * @param {function()}
   */
  'private _searchCallback': null,

  /**
   * Function to call when enter button is clicked
   * @param {function()}
   */
  'private _enterCallback': null,

  /**
   * Function to call when new quote button is clicked
   * @param {function()}
   */
  'private _newCallback': null,

  /**
   * Function to call when cancel button is clicked
   * @param {function()}
   */
  'private _cancelCallback': null,

  /**
   * Initializes dialog defaults
   *
   * @return {undefined}
   */
  'protected init': function () {
    var _self = this;

    // set defaults
    this.getDialog()
      .setTypeId('liza-doc-nav-dialog')
      .setResizable(false)
      .setModal();
  },

  /**
   * Callback when search button is clicked
   *
   * @param {function()} callback search button callback
   *
   * @return {DirtyDialog} self
   */
  'public onSearch': function (callback) {
    this._searchCallback = callback || null;
    return this;
  },

  /**
   * Callback when enter button is clicked
   *
   * @param {function()} callback enter button callback
   *
   * @return {DirtyDialog} self
   */
  'public onEnter': function (callback) {
    this._enterCallback = callback || null;
    return this;
  },

  /**
   * Callback when cancel button is clicked
   *
   * @param {function()} callback cancel button callback
   *
   * @return {DirtyDialog} self
   */
  'public onCancel': function (callback) {
    this._cancelCallback = callback || null;
    return this;
  },

  /**
   * Displays the dialog
   *
   * @return {QuoteNavDialog} self
   */
  'override public open': function () {
    var closeAnd = function (callback) {
      // if no callback was provided, return undefined so that the button
      // won't be displayed
      if (!callback) {
        return undefined;
      }

      return function () {
        this.close();
        callback();
      };
    };

    var dialog = this.getDialog();

    dialog.appendHtml(
      '<ul>' +
        '<li><strong>Search for Existing Quote</strong> - ' +
        'Search for a previous quote. If you are ' +
        'attempting to view an existing quote, ' +
        'this will help you locate it.' +
        '</li>' +
        '<li><strong>Enter Quote #</strong> - If you know the ' +
        'quote number for the quote you are looking for, ' +
        'this allows you to quickly enter it.' +
        '</li>' +
        '</ul>'
    );

    if (this._searchCallback) {
      dialog.appendButton(
        'Search for Existing Quote',
        closeAnd(this._searchCallback)
      );
    }

    if (this._enterCallback) {
      dialog.appendButton('Enter Quote #', closeAnd(this._enterCallback));
    }

    if (this._cancelCallback) {
      dialog.appendButton('Cancel', closeAnd(this._cancelCallback));
    }

    // let the dialog do its thing
    this.__super();
  },
});
