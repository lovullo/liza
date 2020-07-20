/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * DialogDecorator class
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

var AbstractClass = require('easejs').AbstractClass,
  Dialog = require('./Dialog');

/**
 * Decorates dialogs
 *
 * The decorator pattern is used rather than inheritance because decorators can
 * use any type of Dialog, whereas inheritance would limit it to a specific
 * dialog type.
 *
 * TODO: Remove manual proxying once ease.js provides automated mechanism
 */
module.exports = AbstractClass.implement(Dialog).extend({
  /**
   * Dialog to decorate
   * @type {Dialog}
   */
  'private _dialog': null,

  /**
   * Initializes decorator
   *
   * @param {Dialog} dialog dialog to decorate
   *
   * @return {undefined}
   */
  __construct: function (dialog) {
    this._dialog = dialog;

    // allow subtype to initialize with the remainder of the ctor arguments
    // (if any)
    var args = Array.prototype.slice.call(arguments, 1);
    this.init.apply(this, args);
  },

  /**
   * Gives decorator subtype a change to initialize without overriding the
   * constructor, and forces the class to be abstract
   *
   * @return  {undefined}
   */
  'abstract protected init': [],

  /**
   * Returns dialog being decorated
   *
   * Ensures _dialog is properly encapsulated and cannot be reassigned through
   * direct access to the property
   *
   * @return {Dialog} dialog being decorated
   */
  'protected getDialog': function () {
    return this._dialog;
  },

  /**
   * Uniquely identify dialog type
   *
   * The `type_id` is exposed as a CSS class for styling.
   *
   * @param {string} type_id unique type identifier
   *
   * @return {DialogDecorator} self
   */
  'public proxy setTypeId': '_dialog',

  /**
   * Sets the dialog title
   *
   * @param {string} title dialog title
   *
   * @return {DialogDecorator} self
   */
  'public setTitle': function (title) {
    this._dialog.setTitle(title);
    return this;
  },

  /**
   * Sets/unsets the dialog as modal
   *
   * @param {boolean} modal whether to make dialog modal
   *
   * @return {DialogDecorator} self
   */
  'public setModal': function (modal) {
    this._dialog.setModal(modal);
    return this;
  },

  /**
   * Sets whether the dialog can be resized
   *
   * @param {boolean} resizable whether the dialog can be resized
   *
   * @return {DialogDecorator} self
   */
  'public setResizable': function (resizable) {
    this._dialog.setResizable(resizable);
    return this;
  },

  /**
   * Sets whether the dialog can be dragged
   *
   * @param {boolean} draggable whether the dialog can be dragged
   *
   * @return {DialogDecorator} self
   */
  'public setDraggable': function (draggable) {
    this._dialog.setDraggable(draggable);
    return this;
  },

  /**
   * Shows/hides the 'X' button, allowing the dialog to be manually closed
   * without use of a button
   *
   * @param {boolean} hide whether to hide the X
   *
   * @return {DialogDecorator} self
   */
  'public hideX': function (hide) {
    this._dialog.hideX(hide);
    return this;
  },

  /**
   * Sets the width and height of the dialog
   *
   * @param {{ x: (number|string)=, y: (number|string)= }} size dialog size
   *
   * @return {DialogDecorator} self
   */
  'public setSize': function (size) {
    this._dialog.setSize(size);
    return this;
  },

  /**
   * Adds a CSS class to the dialog
   *
   * @param {string} class_name name of the class
   *
   * @return {DialogDecorator} self
   */
  'public addClass': function (class_name) {
    this._dialog.addClass(class_name);
    return this;
  },

  /**
   * Sets the buttons to be displayed on the dialog
   *
   * @param {Object.<string, function()>} buttons
   *
   * @return {DialogDecorator} self
   */
  'public setButtons': function (buttons) {
    this._dialog.setButtons(buttons);
    return this;
  },

  /**
   * Appends a button to the dialog
   *
   * @param {string}     label    button label
   * @param {function()} callback callback to invoke when button is clicked
   *
   * @return {DialogDecorator} self
   */
  'public appendButton': function (label, callback) {
    this._dialog.appendButton(label, callback);
    return this;
  },

  /**
   * Sets the dialog content as HTML
   *
   * @param {*} html HTML content
   *
   * @return {DialogDecorator} self
   */
  'public setHtml': function (html) {
    this._dialog.setHtml(html);
    return this;
  },

  /**
   * Appends HTML to the dialog content
   *
   * @param {*} html HTML content
   *
   * @return {DialogDecorator} self
   */
  'public appendHtml': function (html) {
    this._dialog.appendHtml(html);
    return this;
  },

  /**
   * Sets the dialog content as plain text
   *
   * @param {string} text plain text
   *
   * @return {DialogDecorator} self
   */
  'public setText': function (text) {
    this._dialog.setText(text);
    return this;
  },

  /**
   * Callback to call when dialog is opened
   *
   * @return {DialogDecorator} self
   */
  'public onOpen': function (callback) {
    this._dialog.onOpen(callback);
    return this;
  },

  /**
   * Callback to call when dialog is closed
   *
   * @return {DialogDecorator} self
   */
  'public onClose': function (callback) {
    this._dialog.onClose(callback);
    return this;
  },

  /**
   * Displays the dialog
   *
   * @return {DialogDecorator} self
   */
  'virtual public open': function () {
    this._dialog.open();
    return this;
  },

  /**
   * Hides the dialog
   *
   * @return {DialogDecorator} self
   */
  'public close': function () {
    this._dialog.close();
    return this;
  },

  /**
   * Poor-man's escape
   *
   * Only escapes tags and entities.
   *
   * @param {string} html HTML to escape
   * @return {string} escaped HTML
   */
  'protected escapeHtml': function (html) {
    return html.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;');
  },
});
