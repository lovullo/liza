/**
 * Contains Program base class
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
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
 *
 * @todo This is one of the system's oldest relics; evolve!
 */

var AbstractClass = require('easejs').AbstractClass;
(EventEmitter = require('../events').EventEmitter),
  // XXX coupling
  (Failure = require('../validate/Failure')),
  (BucketField = require('../field/BucketField'));

exports.Program = AbstractClass('Program').extend(EventEmitter, {
  /**
   * Program id
   * @type {string}
   */
  id: 'undefined',

  /**
   * Program title
   * @type {string}
   */
  title: 'Rater',

  eventData: [],

  /**
   * Stores program metadata
   * @type {Object}
   */
  meta: {},

  /**
   * Array of step titles
   * @type {Array.<string>}
   */
  steps: [],

  /**
   * array of step ids
   * @type {Array.<string>}
   */
  stepIds: [],

  /**
   * Contains sidebar data
   * @type {Object}
   */
  sidebar: {overview: {}, static_content: {}},

  /**
   * Questions that should only be visible internally
   * @type {Array.<string>}
   */
  internal: [],

  /**
   * Default values for questions
   * @type {Object.<string,*>}
   */
  defaults: {},

  /**
   * Fields contained within groups
   * @type {Object.<string,Array.<string>>}
   */
  groupFields: {},

  /**
   * API descriptions
   * @type {Object}
   */
  'protected apis': {},

  'public secureFields': [],

  'private _assertDepth': 0,

  'protected classifier': '',

  'private _classify': null,

  'private _classifyKnownFields': {},

  /**
   * Id of the first valid step
   *
   * Useful if early steps are used for, say, management purposes.
   *
   * @type {number}
   */
  'protected firstStepId': 1,

  /**
   * Data API manager
   * @type {DataApiManager}
   */
  'protected dapiManager': null,

  /**
   * Initialize program
   *
   * @param {DataApiManager} dapi_manager
   */
  __construct: function (dapi_manager) {
    if (dapi_manager) {
      this.dapiManager = dapi_manager;
      this.dapiManager.setApis(this.apis);
    }

    try {
      this._classify = this.classifier
        ? require(this.classifier)
        : function () {
            return {};
          };
    } catch (e) {
      throw Error('Failed to load global classifier: ' + e.message);
    }

    this._initClasses();
  },

  'private _initClasses': function () {
    var fieldc = this._classify.fieldClasses || {};
    for (var field in fieldc) {
      // UI is considered to completely override (may change)
      this.whens[field] = this.whens[field] || [fieldc[field]];
    }

    this._initKnownClassFields();
  },

  'private _initKnownClassFields': function () {
    var known = this._classifyKnownFields;

    // maintain BC for the time being (old and new API, respectively)
    var cfields =
      this._classify.knownFields || this._classify.rater.knownFields;

    // from global classifier
    for (var f in cfields) {
      known[f] = true;
    }

    // from whens that reference questions in the UI directly
    for (var f in this.qwhens || {}) {
      known[f] = true;
    }
  },

  /**
   * Returns the program id
   *
   * @return String program id
   */
  getId: function () {
    return this.id;
  },

  'abstract public initQuote': ['bucket', 'store_only'],

  submit: function (step_id, bucket, cmatch, trigger_callback) {
    // if there are any pending data api calls, do not
    // bother validating the rest of the step data
    var pending_request = this._getPendingApiCall(step_id);

    if (pending_request !== null) {
      return pending_request;
    }

    trigger_callback = trigger_callback || function () {};

    var callback = this.eventData[step_id].submit;

    // if there was no callback for this step, then we haven't anything
    // to do
    if (callback === undefined) {
      return true;
    }

    return callback.call(this, bucket, {}, cmatch, trigger_callback);
  },

  postSubmit: function (step_id, bucket, trigger_callback) {
    trigger_callback = trigger_callback || function () {};

    // make sure that the step they're trying to load actually exists
    if (this.eventData[step_id] === undefined) {
      return false;
    }

    trigger_callback.call(this, 'kickBack', '', step_id);
    return true;
  },

  /**
   * Trigger processing of `forward' event
   *
   * @param {number}     step_id          step id to trigger event on
   * @param {function()} trigger_callback callback for event triggers
   *
   * @return {Object} failures
   */
  forward: function (step_id, bucket, cmatch, trigger_callback) {
    trigger_callback = trigger_callback || function () {};

    var callback = (this.eventData[step_id] || {}).forward;
    if (callback === undefined) {
      return null;
    }

    return callback.call(this, bucket, {}, cmatch, trigger_callback);
  },

  'public change': function (
    step_id,
    name,
    bucket,
    diff,
    cmatch,
    trigger_callback
  ) {
    var change = (this.eventData[step_id] || {}).change;

    if (!change || !change[name]) {
      return null;
    }

    return change[name].call(this, bucket, diff, cmatch, trigger_callback);
  },

  'public dapi': function (
    step_id,
    name,
    bucket,
    diff,
    cmatch,
    trigger_callback
  ) {
    var dapi = (this.eventData[step_id] || {}).dapi;

    if (!dapi || !dapi[name]) {
      return null;
    }

    return dapi[name].call(this, bucket, diff, cmatch, trigger_callback);
  },

  'public addFailure': function (dest, name, indexes, message, cause_names) {
    var to = (dest[name] = dest[name] || []);

    for (var i in indexes) {
      var index = indexes[i],
        field = BucketField(name, index),
        causes = [];

      for (var cause_i in cause_names) {
        causes.push(BucketField(cause_names[cause_i], index));
      }

      to[index] = Failure(field, message, causes);
    }
  },

  'public action': function (
    step_id,
    type,
    ref,
    index,
    bucket,
    trigger_callback
  ) {
    var action = (this.eventData[step_id] || {}).action;

    // the double-negative-or prevents the latter from being executed
    // (yielding an error) if the former fails
    if (!action || !action[ref]) {
      return this;
    }

    // attempt to locate this type of action for the given ref
    var action = action[ref][type];
    if (action === undefined) {
      return this;
    }

    // found it!
    action.call(this, trigger_callback, bucket, index);
    return this;
  },

  /**
   * Determine if any Api Calls are still pending
   *
   * @param {integer} step id to get pending api calls for
   *
   * @return {object|null} null if none are pending otherwise message
   */
  'private _getPendingApiCall': function (step_id) {
    if (!this.dapiManager) {
      return null;
    }

    var changes = this.eventData[step_id].change,
      pending = this.dapiManager.getPendingApiCalls();

    for (var id in pending) {
      if (pending[id] === undefined) {
        continue;
      }

      if (pending[id].uid !== undefined) {
        // no reason to check any further, return first pending
        // api call
        var ret_val = {},
          failed = [],
          name = pending[id].name,
          index = pending[id].index;

        // we only care if this data api request is associated
        // to this step
        if (changes[name] !== undefined) {
          this.addFailure(
            failed,
            name,
            [index],
            'Question is still loading; please wait...',
            [name]
          );

          ret_val[name] = failed[name];
          return ret_val;
        }
      }
    }

    // no pending requests
    return null;
  },

  eachChangeById: function (step_id, callback, trigger_callback) {
    trigger_callback = trigger_callback || function () {};

    var change = this.eventData[step_id].change;

    // if there's no change events, we don't need to do anything
    if (change === undefined) {
      return this;
    }

    // call the callback for each element that has a change function
    var program = this;
    for (name in change) {
      // use a closure to ensure that the variable we pass in will not be
      // changed (remember, we're in a loop)
      (function (change_callback) {
        // call the callback, passing in a callback of our own to be
        // called when the change event is triggered
        callback.call(
          program,
          name,
          function (bucket, diff, cmatch) {
            // run the assertions and return the result
            return change_callback.call(
              program,
              bucket,
              diff,
              cmatch,
              trigger_callback
            );
          },
          +step_id
        );
      })(change[name]);
    }

    return this;
  },

  beforeLoadStep: function (step_id, bucket, trigger_callback) {
    trigger_callback = trigger_callback || function () {};

    // make sure that the step they're trying to load actually exists
    if (this.eventData[step_id] === undefined) {
      return false;
    }

    var callback = this.eventData[step_id].beforeLoad;
    if (callback === undefined) {
      return false;
    }

    callback.call(this, trigger_callback, bucket);
    return true;
  },

  visitStep: function (step_id, bucket, trigger_callback) {
    trigger_callback = trigger_callback || function () {};

    // make sure that the step they're trying to load actually exists
    if (this.eventData[step_id] === undefined) {
      return false;
    }

    var callback = this.eventData[step_id].visit;
    if (callback === undefined) {
      return false;
    }

    callback.call(this, trigger_callback, bucket);
    return true;
  },

  doAssertion: function (
    assertion,
    qid,
    expected,
    given,
    success,
    failure,
    record
  ) {
    var thisresult = false,
      result = false;

    this._assertDepth++;

    if (assertion.assert(expected, given)) {
      thisresult = true;
      result = success ? success.call(this) : true;
    } else {
      thisresult = false;
      result = failure ? failure.call(this) : false;
    }

    this._assertDepth--;

    this.emit(
      'assert',
      assertion,
      qid,
      expected,
      given,
      thisresult,
      result,
      record,
      this._assertDepth
    );

    return result;
  },

  /**
   * Classify the given bucket data
   *
   * @param {Object} data bucket data to classify
   *
   * @return {Object.<Object.<any,indexes>>} classification results
   */
  'public classify': function (data) {
    // maintain BC for the time being (new and old respectively); can be
    // cleaned up to be less verbose once we remove compatibility
    var result = this._classify.rater
      ? this._classify.rater.classify.fromMap(data, false)
      : this._classify(data);

    // add qwhens (TODO: let's not do this every single time; use a diff)
    this.qwhens = this.qwhens || {};
    for (var f in this.qwhens) {
      var values = data[f],
        match = [],
        is = true,
        expect = this.qwhens[f];

      for (var i in values) {
        match[i] = +(!!(values[i] !== '0' && !!values[i]) === expect);

        is = is && !!match[i];
      }

      result['q:' + f] = {
        indexes: match,
        is: is,
      };
    }

    return result;
  },

  /**
   * Checks the given indexes against classification matches
   *
   * If the cmatch array indicates that the given index does not match its
   * required classification, then the index will be removed. This has the
   * effect of ignoring indexes for fields that do not match their required
   * classifications.
   *
   * The index array should be an array of index numbers. The values of the
   * index array will be used to check the associated index of the cmatch
   * array for a boolean value.
   *
   * CDATA should contain a modern set of classification match data if
   * supported by the underlying system.  CDATA.indexes is precisely the
   * first argument CMATCH in this case, but both are retained for
   * backwards-compatibility.  It also contains `CDATA.all' to indicate
   * whether all indexes matched and `CDATA.any' to indicate whether any
   * matched; this is needed to disambiguate the situation when
   * `CDATA.indexes' (or CMATCH) is empty, which is otherwise assumed to
   * mean "all matched" (a now-false assumption).
   *
   * @param {Array.<number>} cmatch  match array
   * @param {Array.<number>} indexes indexes to check
   * @param {Object}         cdata   modern cmatch data
   *
   * @return {Array.<number>} cmatch-filtered index array
   */
  'protected cmatchCheck': function (cmatch, indexes, cdata) {
    // start with a modern interpretation, if available, and
    // purposefully fall back to old logic so as not to break existing
    // quirky behavior that may depend on it
    if (cdata && cdata.any === false) {
      return [];
    }

    // if there's no cmatch data for this field, or if the cmatch data
    // exists but is empty (indicating a true match for any number of
    // indexes) then simply return what we were given
    if (!cmatch || cmatch.length === 0) {
      return indexes;
    }

    var ret = [],
      len = indexes.length;

    // return the indexes of only the available cmatch indexes
    for (var i = 0; i < len; i++) {
      var index = indexes[i];

      if (cmatch[index]) {
        ret.push(index);
      }
    }

    return ret;
  },

  'public getClassifierKnownFields': function () {
    return this._classifyKnownFields;
  },

  'public getFirstStepId': function () {
    return this.firstStepId;
  },
});
