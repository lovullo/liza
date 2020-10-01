/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-undef: "off", prefer-arrow-callback: "off", eqeqeq: "off" */
/**
 * Contains program Nav class
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
  EventEmitter = require('../../events').EventEmitter;

/**
 * Handles navigation logic
 *
 * The step_builder function should accept two arguments: the step id and a
 * callback to be executed once the step has reached its ready state.
 */
module.exports = Class('Nav').extend(EventEmitter, {
  /**
   * When user attempts to navigate away from the page
   * @type {string}
   */
  'const EVENT_UNLOAD': 'unload',

  /**
   * Attempt to navigate to another step (allows preventing navigation)
   * @type {string}
   */
  'const EVENT_STEP_PRE_CHANGE': 'preStepChange',

  /**
   * Navigation to another step has completed
   * @type {string}
   */
  'const EVENT_STEP_CHANGE': 'stepChange',

  /**
   * Quote id has been changed
   * @type {string}
   */
  'const EVENT_QUOTE_ID_CHANGE': 'quoteIdChange',

  /**
   * Quote id to use in navigation
   *
   * -1 by default to ensure that the default quote id of 0 will trigger an id
   * change
   *
   * @type {number}
   */
  'private _quoteId': -1,

  /**
   * Stores the last step id to determine if the step has changed
   * @type {number}
   */
  'private _lastStepId': 0,

  /**
   * Id of the max visited step
   * @type {number}
   */
  'private _topVisitedStepId': 0,

  /**
   * Number of steps
   * @type {number}
   */
  'private _stepCount': 0,

  /**
   * Contains information regarding the steps
   * @type {Object.<Array.<{title,type}>>}
   */
  'private _stepData': {},

  /**
   * The first step id as far as navigation is concerned
   * @type {number}
   */
  'private _firstStepId': 1,

  /**
   * Minimum step id permitted to visit, unless 0
   * @type {number}
   */
  'private _minStepId': 0,

  /**
   * The program
   */
  'private _program': {},

  /**
   * The most recently provided classification data
   * @type {Object}
   */
  'private _classes': {},

  /**
   * Initializes navigation
   *
   * This will initialize the navigation bar hooks to permit navigation and
   * hook to the address, allowing back/forward buttons to work properly,
   * bookmarks, and properly navigate if the hash in the URL is modified.
   *
   * The URL hash will then be altered to reflect the default, if one was not
   * already provided.
   *
   * @return Nav self to allow for method chaining
   */
  'public __construct': function (program) {
    this._initUnloadHook();

    this._program = program;
    this._stepData = program.steps;

    this.setStepCount(this._stepData.length - 1);

    return this;
  },

  'public setFirstStepId': function (id) {
    this._firstStepId = +id;
  },

  /**
   * Binds to the 'beforeunload' event
   *
   * This allows a message to be displayed to the user when they attempt to
   * navigate away from the page.
   *
   * @return void
   */
  _initUnloadHook: function () {
    var _self = this,
      _event = this.__self.$('EVENT_UNLOAD');

    $(window).bind('beforeunload.program', function (e) {
      var event = {returnValue: undefined};
      _self.emit(_event, event);

      // IE and Firefox
      if (e) {
        e.returnValue = event.returnValue;
      }

      // Safari
      return event.returnValue;
    });
  },

  /**
   * Sets the number of available steps
   *
   * @param {number} count step count
   *
   * @return {Nav} self
   */
  setStepCount: function (count) {
    this._stepCount = +count;
    return this;
  },

  /**
   * Navigates to a step via the step id
   *
   * Step navigation is handled by the address hook. Therefore, we simply
   * modify the hash tag.
   *
   * @param {number}  step_id id of step to navigate to
   * @param {boolean} force   do not check if next step is valid
   *
   * @return Nav self to allow for method chaining
   */
  navigateToStep: function (step_id, force, cur_check) {
    step_id = +step_id;
    force = !!force;
    cur_check = cur_check === undefined ? true : !!cur_check;

    var nav = this;
    var event = {
      stepId: step_id,
      currentStepId: this._lastStepId,

      abort: false,
      resume: function (revalidate, callback) {
        // don't let 'em jump ahead
        if (force !== true && nav.isValidNextStep(step_id) !== true) {
          return;
        }

        revalidate = !!revalidate;

        // if a callback was provided, then provide a new resume
        // continuation that will queue up each callback, ensuring they
        // are all called once we successfully finish
        var orig_resume = event.resume;
        event.resume = callback
          ? function (revalidate, callback_new) {
              orig_resume(revalidate, function () {
                callback_new && callback_new();
                callback();
              });
            }
          : orig_resume;

        // nothing to do if we're already on the step
        if (cur_check && nav._lastStepId == step_id) {
          return nav;
        }

        // call the pre-change hooks
        event.abort = false;
        event.force = force;

        if (revalidate) {
          nav.emit(nav.__self.$('EVENT_STEP_PRE_CHANGE'), event);

          if (event.abort === true) {
            return;
          }
        }

        nav._lastStepId = step_id;
        if (step_id > nav._topVisitedStepId) {
          nav._topVisitedStepId = step_id;
        }

        if (!nav.stepIsVisible(step_id)) {
          step_id = nav.getPrevStepId();
        }

        // the step has changed
        nav.emit(nav.__self.$('EVENT_STEP_CHANGE'), step_id);

        callback && callback();
      },
    };

    event.resume(true);
    return this;
  },

  /**
   * Returns the highest step the user has gotten to
   *
   * @return Integer top step id
   */
  getTopVisitedStepId: function () {
    return this._topVisitedStepId;
  },

  /**
   * Attempts to return the id of the next available step
   *
   * @return Integer id of the next step if available, otherwise id of the
   *                 current step
   */
  getNextStepId: function (step_id) {
    if (step_id === undefined) {
      step_id = this._lastStepId;
    }

    if (this.isLastStep(step_id)) {
      return this._lastStepId + 1;
    }

    const next_step = this._program.getNextVisibleStep(this._classes, step_id);

    return next_step === undefined
      ? Math.max(this._lastStepId, this._firstStepId)
      : next_step;
  },

  /**
   * Attempts to get the id of the next available previous step
   *
   * @return Integer id of previous step if available, otherwise id of the
   *                 current step
   */
  getPrevStepId: function () {
    const prev_id = this._program.getPreviousVisibleStep(
      this._classes,
      this._lastStepId
    );

    return prev_id === undefined || !this.hasPrevStep()
      ? this._lastStepId
      : prev_id;
  },

  /**
   * Returns whether a step has been visited
   *
   * @param Integer step_id id of step to check
   *
   * @return Boolean true if step has been previous visited, otherwise false
   */
  isStepVisited: function (step_id) {
    // if we add hidden steps, this logic will need to change to keep track
    // of specific steps
    return step_id <= this._topVisitedStepId ? true : false;
  },

  /**
   * Returns whether a previous step is available to navigate to
   *
   * @return Boolean true if a previous step is available, otherwise false
   */
  hasPrevStep: function () {
    // this logic is bound to change in the future
    return +this._lastStepId <= +this._firstStepId ? false : true;
  },

  /**
   * Attempts to navigate to the next available step
   *
   * @return Nav self to allow for method chaining
   */
  navigateToNextStep: function () {
    // we don't know what to do if we don't know what step we're on!
    if (this._lastStepId == 0) {
      return;
    }

    var step_id = this.getNextStepId();
    this.navigateToStep(step_id);

    return this;
  },

  /**
   * Attempts to navigate to the previous available step
   *
   * @return Nav self to allow for method chaining
   */
  navigateToPrevStep: function () {
    if (this.hasPrevStep() === false) {
      return;
    }

    var step_id = this.getPrevStepId();
    this.navigateToStep(step_id);

    return this;
  },

  setTopVisitedStepId: function (step_id) {
    this._topVisitedStepId = +step_id;
  },

  /**
   * Sets the quote id to be used for navigation
   *
   * @param Integer id quote id
   *
   * @return Nav self to allow for method chaining
   */
  setQuoteId: function (id, clear_step) {
    clear_step = clear_step === undefined ? false : !!clear_step;

    // if the quote id is the same, don't do anything
    if (id == this._quoteId || id === undefined) {
      return this;
    }

    this._quoteId = id;

    // raise the event
    this.emit(
      this.__self.$('EVENT_QUOTE_ID_CHANGE'),
      this._quoteId,
      clear_step
    );

    return this;
  },

  /**
   * Returns the quote id
   *
   * @return Integer quote id
   */
  getQuoteId: function () {
    return this._quoteId;
  },

  /**
   * Returns the id of the current step
   *
   * @return Integer id of the current step
   */
  getCurrentStepId: function () {
    return this._lastStepId;
  },

  /**
   * Check whether a step id is valid as a next step
   *
   * @param {number} step_id The step id to check
   *
   * @return {boolean} Whether the provided step is a valid next step
   */
  isValidNextStep: function (step_id) {
    // We are jumping too far ahead
    if (step_id > this.getNextStepId(this._topVisitedStepId)) {
      return false;
    }

    // next step is valid if currently on the last step
    if (this.isLastStep(this.getCurrentStepId())) {
      return true;
    }

    return this.stepIsVisible(step_id);
  },

  /**
   * Checks whether a step is visible
   *
   * @param {number} step_id The step to check
   *
   * @return {boolean} True if the step is visible
   */
  stepIsVisible(step_id) {
    return this._program.isStepVisible(this._classes, step_id);
  },

  /**
   * Update the step visibility based on a step's predicates
   *
   * @param {Object} classes The classes generated by classify
   */
  updateStepVisibility(classes) {
    const old_classes = this._classes;

    this._classes = classes;

    // If a previously hidden field is now showing we need to kick back the
    // top visited step to disallow navigation beyond it
    for (let i = this._stepData.length - 1; i >= 1; i--) {
      const new_vis = this._program.isStepVisible(this._classes, i);
      const prev_vis = this._program.isStepVisible(old_classes, i);

      if (prev_vis === false && new_vis == true && this._topVisitedStepId > i) {
        this._topVisitedStepId = i;
      }
    }
  },

  /**
   * Returns whether or not the given step is the last step
   *
   * @param {number} step_id
   *
   * @return {boolean} true if last step, otherwise false
   */
  isLastStep: function (step_id) {
    return step_id === this._stepCount ? true : false;
  },

  /**
   * Returns whether or not the given step is the quote review
   * step.
   *
   * @param {number} step_id
   *
   * @return {boolean} true if quote review step, otherwise false
   */
  isQuoteReviewStep: function (step_id) {
    return this._stepData[step_id].type === 'review' ? true : false;
  },

  /**
   * Returns whether or not the given step is the manage quote
   * step.
   *
   * @param {number} step_id
   *
   * @return {boolean} true if manage quote step, otherwise false
   */
  isManageQuoteStep: function (step_id) {
    return this._stepData[step_id].type === 'manage' ? true : false;
  },

  'public getFirstStepId': function () {
    return this._firstStepId;
  },

  'public setMinStepId': function (id) {
    this._minStepId = +id || 0;
    return this;
  },

  'public getMinStepId': function () {
    return this._minStepId;
  },
});
