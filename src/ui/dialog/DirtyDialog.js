/**
 * Contains error dialog class
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
module.exports = Class('DirtyDialog').extend(DialogDecorator, {
  /**
   * Save button callback
   * @type {function()}
   */
  'private _saveCallback': function () {},

  /**
   * Discard button callback
   * @type {function()}
   */
  'private _discardCallback': function () {},

  /**
   * Initializes dialog defaults
   *
   * @return {undefined}
   */
  'protected init': function () {
    var _self = this;

    // set defaults
    this.getDialog()
      .setTypeId('liza-dirty-dialog')
      .setHtml(
        '<p>Changes have been made to this step. Would you like ' +
          'to:</p>' +
          '<ul>' +
          '<li><strong>Save Changes</strong> - ' +
          'Save the changes that you made and continue' +
          '</li>' +
          '<li><strong>Discard Changes</strong> - ' +
          'Undo the changes since the last time you ' +
          'visited this step and continue' +
          '</li>' +
          '<li><strong>Cancel</strong> - ' +
          'Stay on the current step and continue working' +
          '</li>' +
          '</ul>'
      )
      .setResizable(false)
      .setModal()
      .setTitle('You have made changes to this step')
      .setButtons({
        'Save Changes': function () {
          this.close();
          _self._saveCallback();
        },

        'Discard Changes': function () {
          this.close();
          _self._discardCallback();
        },

        Cancel: function () {
          this.close();
        },
      });
  },

  /**
   * Callback when save button is clicked
   *
   * @param {function()} callback save button callback
   *
   * @return {DirtyDialog} self
   */
  'public onSave': function (callback) {
    this._saveCallback = callback || function () {};
    return this;
  },

  /**
   * Callback when discard button is clicked
   *
   * @param {function()} callback discard button callback
   *
   * @return {DirtyDialog} self
   */
  'public onDiscard': function (callback) {
    this._discardCallback = callback || function () {};
    return this;
  },
});
