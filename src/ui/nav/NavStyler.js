/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", prefer-arrow-callback: "off", no-undef: "off", eqeqeq: "off" */
/**
 * NavStyler class
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
 * Responsible for styling the navigation bar
 */
module.exports = Class('NavStyler', {
  $navElement: null,

  nav: null,

  /**
   * Whether the current quote has been locked
   * @type {boolean}
   */
  _quoteLocked: false,

  /**
   * Original step classes
   */
  'private _origClasses': [],

  /**
   * Initializes NavStyler
   *
   * @param jQuery $nav_element list element representing the navigation bar
   * @param Nav    nav          nav object that styling is based on
   *
   * @return {undefined}
   */
  __construct: function ($nav_element, nav) {
    this.$navElement = $nav_element;
    this.nav = nav;

    // highlight the step when it changes
    var styler = this;
    this.nav.on('stepChange', function (step_id) {
      styler.highlightStep(step_id);
    });

    this._initOrigClasses();
  },

  'private _initOrigClasses': function () {
    var _self = this;

    this.$navElement.find('li').each(function (i) {
      _self._origClasses[i + 1] = $(this).attr('class');
    });
  },

  /**
   * Highlights the current step in the navigation bar
   *
   * This method will loop through each of the step elements and explicitly
   * set their style. The system makes no attempt to figure out which steps
   * should be changed as there is very little overhead with setting the style
   * of each of the steps. The additional logic would over-complicate things.
   *
   * @param {number} step_id id of the step to highlight
   *
   * @return NavStyler self to allow for method chaining
   */
  highlightStep: function (step_id) {
    // loop through each of the steps in the navigation bar and highlight
    // them in the appropriate manner
    var nav = this;
    this.$navElement.find('li').each(function (i) {
      // indexes are 0-based, yet our step ids are 1-based
      var cur_step = i + 1;

      // explicitly set the class to what we want (no add, remove, etc
      // because that'll get too complicated to keep track of)
      $(this).attr('class', nav._getStepClass(cur_step, step_id));
    });

    return this;
  },

  /**
   * Sets whether the quote has been locked
   *
   * @param {boolean} value whether quote is locked
   *
   * @return {boolean|NavStyler} value as getter, self as setter
   */
  quoteLocked: function (value) {
    if (value === undefined) {
      return this._quoteLocked;
    }

    this._quoteLocked = !!value;
    return this;
  },

  /**
   * Determines what class to apply to each of the step elements
   *
   * @param {number} step_id          id of step to get the class for
   * @param {number} relative_step_id id of the currently selected step
   *
   * @return String class to apply to step element
   */
  _getStepClass: function (step_id, relative_step_id) {
    var last = this.nav.getTopVisitedStepId(),
      step_class = '';

    // current step
    if (step_id == relative_step_id) {
      // return a different style if there's visited steps after the
      // current one
      step_class = step_id == last ? 'stepCurrent' : 'stepCurrentPreVisited';
    }
    // step before the current step
    else if (step_id == relative_step_id - 1) {
      step_class = 'stepVisitedPreCurrent';
    }
    // previously visited steps
    else if (step_id < relative_step_id) {
      step_class = 'stepVisitedPreVisited';
    }
    // visited step after the current step
    else if (step_id > relative_step_id && step_id < last) {
      step_class = 'stepVisitedPreVisited';
    } else if (step_id == last) {
      step_class = 'stepVisited';
    } else {
      // when it doubt, clear it out
      step_class = '';
    }

    // if the quote is locked and this is not the last step, mark it as
    // locked
    if (
      (this._quoteLocked && step_id !== last) ||
      step_id < this.nav.getMinStepId()
    ) {
      step_class += ' locked';
    }

    if (!this.nav.stepIsVisible(step_id)) {
      step_class += ' hidden';
    }

    return step_class + ' ' + this._origClasses[step_id];
  },
});
