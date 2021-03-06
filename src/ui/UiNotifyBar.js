/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-undef: "off" */
/**
 * Notification bar class
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

var Class = require('easejs').Class;

/**
 * A basic notification bar
 */
module.exports = Class('UiNotifyBar', {
  /**
   * jQuery instance
   * @type {jQuery}
   */
  'private _jQuery': null,

  /**
   * Notification bar DOM element
   * @type {jQuery}
   */
  'private _$bar': null,

  /**
   * Parent object (to prepend bar to)
   * @type {jQuery}
   */
  'private _$parent': null,

  /**
   * Nav bar object
   * @type {jQuery}
   */
  'private _$nav_bar': null,

  /**
   * Creates a new notification bar and prepends to parent
   *
   * @param {jQuery} $parent  destination object
   * @param {jQuery} $nav_bar nav bar object
   */
  'public __construct': function ($parent, $nav_bar) {
    this._$parent = $parent;
    this._$nav_bar = $nav_bar;

    this._createBar();
  },

  /**
   * Create the navigation bar DOM element and prepend it to the parent
   *
   * @return {undefined}
   */
  'private _createBar': function () {
    this._$bar = $('<div>').attr('id', 'notify-bar');
    this._$nav_bar.after(this._$bar);
  },

  /**
   * Show the notification bar
   *
   * This works by setting a CSS class on the parent.
   *
   * @return {undefined}
   */
  'public show': function () {
    this._$parent.addClass('notify');
    return this;
  },

  /**
   * Hide the notification bar
   *
   * This works by setting a CSS class on the parent.
   *
   * @return {undefined}
   */
  'public hide': function () {
    this._$parent.removeClass('notify');
    return this;
  },

  'public setContent': function (content) {
    this._$bar.html(content);
    return this;
  },
});
