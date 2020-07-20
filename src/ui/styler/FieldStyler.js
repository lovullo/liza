/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Style fields using CSS
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

var AbstractClass = require('easejs').AbstractClass;

/**
 * Style DOM fields
 *
 * @todo perhaps this should be called DomFieldStyler
 */
module.exports = AbstractClass('FieldStyler', {
  /**
   * Retrieve unique identifier
   *
   * @return {string} unique identifier
   */
  'abstract public getId': [],

  /**
   * Determines whether the field has been styled
   *
   * Having this predicate on the styler rather than the field ensures
   * that, even if the two somehow get out of sync (or styles are applied
   * elsewhere), application/revocation will function sanely.
   *
   * @param {DomField}            field   field to style
   * @param {HTMLElement}         element DOM element to style
   *
   * @return {boolean} whether FIELD has been styled by this styler
   */
  'abstract public isApplied': ['field', 'element'],

  /**
   * Apply style to field
   *
   * @param {DomField}            field   field to style
   * @param {HTMLElement}         element DOM element to style
   * @param {Array.<HTMLElement>} row     DOM elements of containing row
   *
   * @return {FieldStyler} self
   */
  'abstract public applyStyle': ['field', 'element', 'row'],

  /**
   * Remove style from field
   *
   * @param {DomField}            field   field to unstyle
   * @param {HTMLElement}         element DOM element to unstyle
   * @param {Array.<HTMLElement>} row     DOM elements of containing row
   *
   * @return {FieldStyler} self
   */
  'abstract public revokeStyle': ['field', 'element', 'row'],

  /**
   * Add CSS class CLS to element ELEMENT
   *
   * This method is needed until support is dropped for browsers that do
   * not support classList.
   *
   * @param {HTMLElement} element DOM element to style
   * @param {string}      cls     class name
   *
   * @return {FieldStyler} self
   */
  'protected addClass': function (element, cls) {
    if (!element) {
      return this;
    }

    // if we are given an array, then recurse
    if (Array.isArray(element)) {
      for (var i in element) {
        this.addClass(element[i], cls);
      }

      return;
    } else if (typeof element.className === 'string') {
      element.className += ' ' + cls;
    }

    return this;
  },

  /**
   * Add CSS class CLS to element ELEMENT
   *
   * This method is needed until support is dropped for browsers that do
   * not support classList.
   *
   * @param {HTMLElement} element DOM element to style
   * @param {string}      cls     class name
   *
   * @return {FieldStyler} self
   */
  'protected removeClass': function (element, cls) {
    if (!element) {
      return this;
    }

    // if we are given an array, then recurse
    if (Array.isArray(element)) {
      for (var i in element) {
        this.removeClass(element[i], cls);
      }

      return;
    } else if (typeof element.className === 'string') {
      // note that the implementation of #addClass adds a space,
      // but we also need to cater to classes that might have been
      // added outside of this system
      element.className = element.className.replace(
        new RegExp('( +|\\b)' + cls + '\\b', 'g'),
        ''
      );
    }

    return this;
  },
});
