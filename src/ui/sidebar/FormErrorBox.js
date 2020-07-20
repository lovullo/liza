/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-undef: "off", no-unused-vars: "off", prefer-arrow-callback: "off", block-scoped-var: "off", no-redeclare: "off" */
/**
 * FormErrorBox class
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
 * Generates error box listing errors associated with form elements (e.g.
 * validation errors)
 */
module.exports = Class('FormErrorBox', {
  /**
   * Parent element to the error box
   * @type {jQuery}
   */
  $container: null,

  /**
   * Holds the current errors in an easily searchable associative array
   * @type {Object}
   */
  current: {},

  /**
   * Error box element
   * @type {jQuery}
   */
  $box: null,

  /**
   * Whether the box is currently visible
   * @type {boolean}
   */
  visible: false,

  /**
   * Initializes sidebar
   *
   * @param  {jQuery}  $container  element to contain error box content
   *
   * @return {undefined}
   */
  __construct: function ($container) {
    this.$container = $container;

    this.$box = $('<div />').append($('<ul />')).addClass('error-box');

    // prepare the box
    this._clear();
  },

  /**
   * Clears out the error box, preparing it for errors
   *
   * @return undefined
   */
  _clear: function () {
    this.$box.find('ul > *').remove();
    this.current = {};
  },

  show: function (name, index, message) {
    message = '' + message;

    // if we're in the middle of hiding, stop it to ensure everything will
    // be re-displayed properly (do this here to ensure we don't clear the
    // box after we append an element)
    if (this.visible && this.$box.is(':animated')) {
      this.$box.stop(true, true).detach();

      this.visible = false;
    }

    var error_box = this;
    var $ul = this.$box.find('ul');

    // initialize the entry if it doesn't exist
    if (this.current[name] === undefined) {
      this.current[name] = [];
    }

    var $li = $('<li />')
      .text(message)
      .data('ref', name)
      .data('ref_index', index)
      .click(function () {
        /*
                if ( click_callback instanceof Function )
                {
                    click_callback.call( this,
                        $( this ).data( 'ref' ),
                        $( this ).data( 'ref_index' )
                    );
                }
                */
      });

    // do we already have an element that we'll be overwriting?
    var $previous = this.current[name][index];
    if ($previous) {
      // replace it
      $previous.replaceWith($li);
    } else {
      // doesn't yet exist, so append it
      $ul.append($li);

      // if we're already visible, animate it
      if (this.visible) {
        $li.hide().slideDown(500);
      }
    }

    // add to the lookup table (or overwrite if it already exists)
    this.current[name][index] = $li;

    // only do the display animation if we're not already visible
    if (this.visible === false && !this.$box.is(':animated')) {
      this.$box.prependTo(this.$container);
      this.$box.hide().slideDown(500);
    }

    this.visible = true;

    return this;
  },

  removeError: function (name, index) {
    index = +index || 0;

    var current = this.current[name];
    if (current === undefined) {
      // doesn't exist
      return this;
    }

    var $element = current[index];
    if ($element === undefined) {
      // the requested index doesn't exist
      return this;
    }

    $element.stop(true, true).slideUp(500, function () {
      $element.remove();
    });

    // delete the entry from our table
    delete this.current[name][index];

    // TODO: use Object.keys() in ES5
    for (var _ in this.current[name]) {
      return this;
    }

    // there are no more entries for this field
    delete this.current[name];

    // TODO: use Object.keys() in ES5
    for (var _ in this.current) {
      return this;
    }

    this.hide();

    return this;
  },

  hide: function () {
    // it'll look bizarre if we're already hidden and we display just to
    // hide again
    if (this.visible === false) {
      return this;
    }

    var box = this;
    this.$box.stop(true, true).slideUp(500, function () {
      box.$box.detach();

      // clear out the error box
      box._clear();

      box.visible = false;
    });

    return this;
  },
});
