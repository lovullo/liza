/**
 * Contains email dialog class
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
 * Provides logical defaults for the email dialog
 */
module.exports = Class('EmailDialog').extend(DialogDecorator, {
  /**
   * Send Email button callback
   * @type {function()}
   */
  'private _send_callback': function () {},

  /**
   * Email Subject
   * @type {string}
   */
  'private _subject': '',

  /**
   * Email To
   * @type {string}
   */
  'private _email_to': '',

  /**
   * Email From
   * @type {string}
   */
  'private _email_from': '',

  /**
   * Email Message
   * @type {string}
   */
  'private _email_message': '',

  /**
   * Form Data that is used when sending email
   * @type {string}
   */
  'private _form_data': '',

  /**
   * Initializes dialog defaults
   *
   * @return void
   */
  'protected init': function () {
    var self = this;

    // crate new dialog containing email form
    this.getDialog()
      .setTypeId('liza-email-dialog')
      .setResizable(false)
      .setModal()
      .setTitle('Email CSR')
      .setButtons({
        'Send Email': function () {
          var form_data = self._form.serialize();
          self._send_callback(form_data);
        },
        Close: function () {
          this.close();
        },
      });
  },

  /**
   * Displays the dialog
   *
   * @return {EmailDialog} self
   */
  'override public open': function () {
    var dialog = this.getDialog(),
      self = this;

    this._form = $('<form>')
      .addClass('email_frm')
      .attr('id', 'email_frm')
      .html(
        '<p>CSR Email:<br />' +
          '<input type="text" value="' +
          self._email_to +
          '" name="dialog_to_email" id="dialog_to_email" size="50" /></p>' +
          '<p>CC:<br />' +
          '<input type="text" value="" name="dialog_cc_email" id="dialog_cc_email" size="50" /></p>' +
          '<input type="hidden" value="' +
          self._email_from +
          '" name="dialog_from_email" id="dialog_from_email" size="50" /></p>' +
          '<p>Subject:<br />' +
          '<input type="text" value="' +
          self._subject +
          '" name="dialog_subject" id="dialog_subject" size="50" /></p>' +
          '<p>Message:<br />' +
          '<textarea name="dialog_email_msg" id="dialog_email_msg" >' +
          self._email_message +
          '</textarea>' +
          '</p>'
      );

    dialog.setHtml(this._form);
    this.__super();
  },

  /**
   * Callback when send email button is clicked
   *
   * @param {function()} callback send button callback
   *
   * @return {EmailDialog} self
   */
  'public onSend': function (callback) {
    this._send_callback = callback || function () {};
    return this;
  },

  /**
   * Set email subject
   *
   * @return {EmailDialog} self
   */
  'public setEmailSubject': function (subject) {
    this._subject = '' + subject;
    return this;
  },

  /**
   * Set email message
   *
   * @return {EmailDialog} self
   */
  'public setEmailMessage': function (message) {
    this._email_message = '' + message;
    return this;
  },

  /**
   * Set email to
   *
   * @return {EmailDialog} self
   */
  'public setEmailTo': function (email) {
    this._email_to = '' + email;
    return this;
  },

  /**
   * Set email from address
   *
   * @return {EmailDialog} self
   */
  'public setEmailFrom': function (email) {
    this._email_from = '' + email;
    return this;
  },
});
