/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-undef: "off", prefer-arrow-callback: "off" */
/**
 * Manages display of Ui dialogs
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
  JqueryDialog = require('./JqueryDialog'),
  ErrorDialog = require('./ErrorDialog'),
  NotificationDialog = require('./NotificationDialog'),
  EmailDialog = require('./EmailDialog'),
  DirtyDialog = require('./DirtyDialog'),
  QuoteNavDialog = require('./QuoteNavDialog');

/**
 * Displays dialogs
 *
 * This facade is designed to make the display of dialogs as simple as invoking
 * a method, without having to worry about how it works. It also separates the
 * dialog display logic from the rest of the UI.
 */
module.exports = Class('UiDialog', {
  /**
   * Function used to create the base dialog
   * @type {function():Dialog}
   */
  'private _createDialog': null,

  /**
   * Object with jQuery interface
   * @param {jQuery}
   */
  'private _jquery': null,

  /**
   * Initializes UiDialog class with the provided dialog factory, used to
   * create new base dialogs
   *
   * @param {function():Dialog} dialogFactory factory function used to create
   *                                          new base dialogs
   *
   * @return {undefined}
   */
  __construct: function (jquery, dialogFactory) {
    this._jquery = jquery;
    this._createDialog = dialogFactory;
  },

  /**
   * Displays an error dialog
   *
   * @param {string}     text     message to display
   * @param {string}     caption  button caption
   * @param {function()} callback function to call when button is clicked
   *
   * @return {UiDialog} self
   */
  showErrorDialog: function (text, caption, callback) {
    callback = callback || function () {};

    ErrorDialog(this._createDialog())
      .setHtml(text)
      .onClose(callback)
      .appendButton(caption)
      .open();

    return this;
  },

  /**
   * Shows the navigation error dialog
   *
   * Supported options:
   *   {string}  title
   *   {string}  text
   *   {number}  width
   *   {boolean} noX
   *
   *   {function()} search
   *   {function()} enter
   *   {function()} newQuote
   *   {function()} cancel
   *
   * @param {Object} options
   *
   * @return {UiDialog} self
   */
  showNavErrorDialog: function (options) {
    options = options || {};

    var text =
      options.text ||
      'The address you requested is invalid. Would you like to:';

    QuoteNavDialog(this._createDialog())
      .setHtml('<p>' + text + '</p>')
      .hideX(options.noX ? true : false)
      .setTitle(options.title || 'A navigation error has occurred')

      .onSearch(options.search)
      .onEnter(options.enter)
      .onCancel(options.cancel)

      .open();

    return this;
  },

  /**
   * Displays the "dirty" dialog prompting the user for their action
   *
   * This dialog asks the user if they would like to save, discard or cancel.
   * Callback functions should be given to this method to determine what
   * actions should be taken after the dialog is closed for save and discard.
   *
   * @param Function saveCallback    function to call when save is clicked
   * @param Function discardCallback function to call when discard is clicked
   *
   * @return void
   */
  showDirtyDialog: function (saveCallback, discardCallback) {
    DirtyDialog(JqueryDialog(jQuery))
      .onSave(saveCallback)
      .onDiscard(discardCallback)
      .open();
  },

  /**
   * Shows the rating in progress dialog
   *
   * @return Ui self to allow for method chaining
   */
  showRatingInProgressDialog: function () {
    return NotificationDialog(this._createDialog())
      .setHtml('<p>Rating Quote; Please Wait...</p>')
      .addClass('loading')
      .open();
  },

  /**
   * Email CSR Dialog with csr and quote defaults
   *
   * @param Function callback   send callback when Send Email button is clicked
   * @param string   subject    email subject
   * @param string   email_to   email addresses to send to
   * @param string   email_from email from
   * @param string   email_msg  email message
   *
   * @return Ui self to allow for method chaining
   */
  showCsrEmailDialog: function (
    callback,
    subject,
    email_to,
    email_from,
    email_msg
  ) {
    return EmailDialog(this._createDialog(), this._jquery)
      .onSend(callback)
      .setEmailSubject(subject)
      .setEmailMessage(email_msg)
      .setEmailTo(email_to)
      .setEmailFrom(email_from)
      .open();
  },

  /**
   * Shows the dialog prompting for a quote number
   *
   * If no cancel callback is provided, the cancel button will be hidden.
   *
   * @param Function ok     callback when OK button is clicked
   * @param Function cancel callback when cancel button is clicked
   *
   * @return Ui self to allow for method chaining
   */
  showQuoteNumberPrompt: function (ok, cancel) {
    var $quote_input = this._jquery('<div>WEB</div>').append(
      this._jquery('<input type="text" />')
        .attr('id', 'qidinput')
        .addClass('quoteId')
        .addClass('required')
        .val('')
    );

    var buttons = {
      OK: function () {
        // it's been restyled by Dojo
        var $input = $quote_input.find('input:first');

        this.close();
        ok(+$input.val());
      },
    };

    // only show the cancel button if a callback was provided
    if (cancel instanceof Function) {
      buttons.Cancel = function () {
        this.close();
        cancel();
      };
    }

    this._createDialog()
      .setTitle('Enter quote number')
      .setTypeId('liza-doc-id-prompt')
      .setHtml(
        $('<div>')
          .html(
            '<p>Please enter the quote number of the quote you would ' +
              'like to view in the box below:</p>'
          )
          .append($quote_input)
      )
      .setResizable(false)
      .setModal()
      .hideX()

      .onOpen(function () {
        $quote_input.find('input:first').focus();
      })

      .setButtons(buttons)
      .open();

    return this;
  },
});
