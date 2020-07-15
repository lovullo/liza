/**
 * Style errors in sidebar
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
  ErrorStyler = require('./ErrorStyler');

/**
 * Displays errors in the sidebar
 *
 * TODO: This is an adapter around the old system; it could use some
 * refactoring.
 */
module.exports = Class('SidebarErrorStyler').extend(ErrorStyler, {
  /**
   * Error box in which to display errors
   * @type {FormErrorBox}
   */
  'private _errbox': null,

  /**
   * Ui instance
   * @type {Ui}
   */
  'private _ui': null,

  'override __construct': function (msgs, error_box, ui) {
    this._errbox = error_box;
    this._ui = ui;
    this.__super(msgs);
  },

  'override protected onFieldError': function (field, msg) {
    this._errbox.show(field.getName(), field.getIndex(), msg);
  },

  'override protected onFieldFixed': function (field) {
    this._errbox.removeError(field.getName(), field.getIndex());
  },
});
