/**
 * Contains ClientDialog class
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
  EventEmitter = require('../../events').EventEmitter,
  Client = require('../Client'),
  ClientDebugTab = require('./ClientDebugTab');

/**
 * Provides runtime debugging options
 *
 * Everything in here can be done from the console. This just makes life easier.
 */
module.exports = Class('ClientDebugDialog').extend(EventEmitter, {
  /**
   * Program client
   * @type {ProgramClient}
   */
  'private _client': null,

  /**
   * Staging bucket associated with the given client
   * @type {StagingBucket}
   */
  'private _staging': null,

  /**
   * Dialog to be displayed
   * @type {jQuery}
   */
  'private _$dialog': null,

  /**
   * Whether the dialog is visible
   * @type {boolean}
   */
  'private _dialogVisible': false,

  /**
   * List of tabs to be displayed
   * @type {Object.<ClientDebugTab>}
   */
  'private _tabs': {},

  /**
   * Initialize client debugger with a client instance
   *
   * @param {Client}        program_client client instance to debug
   * @param {StagingBucket} staging        bucket
   */
  __construct: function (program_client, staging, storage) {
    if (!Class.isA(Client, program_client)) {
      throw TypeError('Expected Client, given ' + program_client);
    }

    this._client = program_client;
    this._staging = staging;
  },

  /**
   * Add a tab to the dialog
   *
   * @param {ClientDebugTab} tab tab to add
   *
   * @return {ClientDebugDialog} self
   */
  'public addTab': function (tab) {
    if (!Class.isA(ClientDebugTab, tab)) {
      throw TypeError('Expected ClientDebugTab, given ' + tab);
    }

    this._tabs['dbg-' + tab.getTitle().replace(/ /, '-')] = tab;

    return this;
  },

  /**
   * Display developer dialog
   *
   * If a dialog had been previously displayed (in this instance), it will be
   * re-opened.
   *
   * @param {boolean=} fg if set to false, initialize the dialog in the
   *                      background, but do not display
   *
   * @return {ClientDebugTab} self
   */
  'public show': function (fg) {
    this._$dialog = this._$dialog || this._createDialog();

    if (fg !== false) {
      this._$dialog.dialog('open');
    }

    return this;
  },

  /**
   * Hide developer dialog
   *
   * @return {ClientDebugTab} self
   */
  'public hide': function () {
    this._$dialog && this._$dialog.dialog('close');
    return this;
  },

  /**
   * Toggle developer dialog
   *
   * @return {ClientDebugTab} self
   */
  'public toggle': function () {
    return this._dialogVisible ? this.hide() : this.show();
  },

  /**
   * Sets the autoload toggle value (display only)
   *
   * @param {boolean} val whether or not autoload is enabled
   *
   * @return {ClientDebugDialog} self
   */
  'public setAutoloadStatus': function (val) {
    this._$dialog.find('#devdialog-autoload').attr('checked', !!val);
    return this;
  },

  'public setErrorDebugStatus': function (val) {
    this._$dialog.find('#devdialog-errdebug').attr('checked', !!val);
    return this;
  },

  /**
   * Create the dialog
   *
   * @return {jQuery} dialog
   */
  'private _createDialog': function () {
    var _self = this,
      $tabs;

    this._showSidebarWarning();

    return $('<div>')
      .append(
        $('<p>').html(
          '<strong>To view this dialog:</strong> ' +
            'one can use the key combination ' +
            '<samp>Ctrl+Shift+D</samp>, or <code>getProgramDebug()' +
            '.toggle()</code> from the console. The latter may ' +
            'also be used even if the user is not logged in internally.'
        )
      )
      .append(this._createAutoloadToggle())
      .append(($tabs = this._createTabs()))
      .dialog({
        title: 'Developer Dialog',
        dialogClass: 'liza-dev-dialog',
        width: 800,
        height: 600,
        modal: false,
        autoOpen: false,

        open: function () {
          $tabs.tabs();
          _self._dialogVisible = true;
        },

        close: function () {
          _self._dialogVisible = false;
        },
      });
  },

  /**
   * Create autoload toggle elements
   *
   * When toggled, the autoloadToggle event will be triggered with its value.
   *
   * @return {undefined}
   */
  'private _createAutoloadToggle': function () {
    var _self = this;

    return $('<p>')
      .append(
        $('<div>')
          .append(
            $('<input>')
              .attr('type', 'checkbox')
              .attr('id', 'devdialog-autoload')
              .change(function () {
                // trigger toggle event
                _self.emit('autoloadToggle', $(this).is(':checked'));
              })
          )
          .append(
            $('<label>')
              .attr('for', 'devdialog-autoload')
              .text('Load automatically in background on page load')
          )
      )
      .append(
        $('<div>')
          .append(
            $('<input>')
              .attr('type', 'checkbox')
              .attr('id', 'devdialog-errdebug')
              .change(function () {
                // trigger toggle event
                _self.emit('errDebugToggle', $(this).is(':checked'));
              })
          )
          .append(
            $('<label>')
              .attr('for', 'devdialog-errdebug')
              .text('Execute debugger on client-handled errors')
          )
      );
  },

  // XXX: This doesn't belong in this class!
  'private _showSidebarWarning': function () {
    $('#sidebar-help-text').after(
      $('<div>')
        .attr('id', 'dev-dialog-perf-warning')
        .text(
          'Developer dialog is monitoring events on this page. ' +
            'Performance may be negatively impacted.'
        )
    );
  },

  /**
   * Generate tabs and their content
   *
   * The developer dialog contains a tab for each major section.
   *
   * The div that is returned can be used by jQuery UI for tab styling. It is
   * important that you do not attempt to style the tabs until after it has
   * been appended to the DOM, or jQuery UI will fail to properly process it.
   *
   * @return {jQuery} tab div
   */
  'private _createTabs': function () {
    var $tabs = $('<div>').attr('id', 'dbg-tabs').append(this._getTabUl());
    this._appendTabContent($tabs);

    return $tabs;
  },

  /**
   * Generate tab ul element
   *
   * @return {jQuery} tab ul element
   */
  'private _getTabUl': function () {
    var $ul = $('<ul>');

    for (var i in this._tabs) {
      $ul.append(
        $('<li>').append(
          $('<a>')
            .attr('href', '#' + i)
            .text(this._tabs[i].getTitle())
        )
      );
    }

    return $ul;
  },

  /**
   * Appends the content of each of the tabs to the provided tab div
   *
   * @param {jQuery} $tabs tab div to append to
   *
   * @return {undefined}
   */
  'private _appendTabContent': function ($tabs) {
    for (var i in this._tabs) {
      $tabs.append(
        $('<div>')
          .attr('id', i)
          .append(this._tabs[i].getContent(this._client, this._staging))
      );
    }
  },
});
