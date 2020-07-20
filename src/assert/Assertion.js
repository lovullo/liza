/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-undef: "off", eqeqeq: "off" */
/**
 * Base Assertion class
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
 *
 * @todo notice that this is so old that it is a prototype
 */

exports.create = function (name, data) {
  return new Assertion(name, data);
};

var Assertion = function (name, data) {
  if (data === undefined) {
    data = name;
  }

  /**
   * List of children that failed the assertion
   * @type {Array.<number>}
   */
  this.failures = [];

  /**
   * List of children that passes the assertion
   * @type {Array.<number>}
   */
  this.successes = [];

  /**
   * Holds data for the destination var
   * @type {Object}
   */
  this.dest = {};

  /**
   * Default value to return if assertions contain no values to compare
   * @type {boolean}
   */
  this.defaultValue = true;

  /**
   * Default return value when processing data
   *
   * @type {boolean}
   */
  this.processDefault = true;

  /**
   * Whether to track failures within the failure array
   * @type {boolean}
   */
  this.trackFailures = true;

  /**
   * Whether to automatically add successful children to the destination var
   * @type {boolean}
   */
  this.autoAddDest = true;

  /**
   * Return default value if no data is given
   * @type {boolean}
   */
  this.failOnEmpty = true;

  /**
   * Function to call for performing the assertion
   * @type {Function}
   */
  this.processCallback = null;

  /**
   * Function to call to parse the expected value before the assertion
   * @type {Function}
   */
  this.parseExpectedCallback = null;

  this.name = '' + name;

  this._init(data);
};

Assertion.prototype = {
  /**
   * Initializes the assertion with the provided data
   *
   * @param Object data the data passed to the constructor
   *
   * @return undefined
   */
  _init: function (data) {
    // we accept a shorthand; if a function is passed rather than an object,
    // then use that as the assertion function
    if (data instanceof Function) {
      data = {assert: data};
    }

    // the assertion function will be whatever they passed in, or will
    // default to returning false if nothing was provided
    this.processCallback =
      data.assert ||
      function () {
        return false;
      };

    // If a function was provided to parse the expected value before it is
    // used (allowing it to be cached between assertions), it will be used.
    // Otherwise, we'll just return the value we were passed.
    this.parseExpectedCallback =
      data.parseExpected ||
      function (value) {
        return value;
      };

    this.defaultValue =
      data.defaultValue === undefined ? this.defaultValue : data.defaultValue;

    this.processDefault =
      data.processDefault === undefined
        ? this.processDefault
        : data.processDefault;
  },

  /**
   * Cleans out failures and destination data from a previous run
   *
   * @return undefined
   */
  _clean: function () {
    this.failures = [];
    this.successes = [];
    this.dest = {};
  },

  /**
   * Calls the function to parse the expected value
   *
   * This allows the expected value to be processed and cached between
   * assertions, rather than processing it each time an assertion is
   * performed. This method will be called for each new expected value, if
   * multiple exist for an assertion set.
   *
   * @param mixed value the expected value to process
   *
   * @return mixed result of function being called
   */
  _parseExpected: function (value) {
    return this.parseExpectedCallback.call(this, value);
  },

  /**
   * Performs the assertion by calling the assertion callback
   *
   * @param mixed expected the value to compare against
   * @param mixed given    the value provided to be compared to the expected
   *
   * @return Boolean true if assertion succeeded, otherwise false
   */
  _performAssertion: function (expected, given) {
    return this.processCallback.call({
      expected: expected,
      given: given,
    });
  },

  /**
   * Asserts the given data
   *
   * This method loops through the given data, comparing it to the associated
   * expected value. The expected value is shifted off the array each time
   * another value is compared, until there are no expected values left. At
   * that point, the last expected value is used for the remainder of the
   * assertions.
   *
   * @param Array expected the values to compare against
   * @param Array given    the values provided to be compared to the expected
   *
   * @return Boolean whether the assertion succeeded
   */
  _processData: function (expected, given) {
    expected = expected || [];
    given = given || [];

    // make copies of the provided arrays since we'll be doing some pretty
    // shady stuff to 'em
    expected = expected.slice(0);

    if (given.length === undefined) {
      given = [given];
    }

    given = given.slice(0);

    var return_val = this.processDefault,
      last = '',
      len = given.length;

    for (var i = 0; i < len; i++) {
      var val = given[i];

      // ignore null values
      if (val === null) {
        continue;
      }

      // if another expected value was given, use it, otherwise use the
      // last expected value
      cmp =
        expected.length > 0
          ? (last = this._parseExpected(expected.shift()))
          : last;

      if (this._performAssertion(cmp, val) === false) {
        // the assertion failed
        if (this.processDefault == true) {
          return_val = false;
        }

        // if we're tracking failures, add it to the list
        if (this.trackFailures) {
          this.failures[i] = i;
        }
      } else {
        // assertion succeeded
        if (this.processDefault == false) {
          return_val = true;
        }

        if (this.autoAddDest) {
          this.dest[i] = val;
        }

        this.successes[i] = i;
      }
    }

    return return_val;
  },

  /**
   * Perform an assertion on the given data
   *
   * @param Array expected the values to compare against
   * @param Array given    the values provided to be compared to the expected
   *
   * @return Boolean true on success, false on failure
   */
  assert: function (expected, given) {
    given = given || [];

    if (given.length === undefined) {
      given = [given];
    }

    // if we weren't given anything to compare, return the default
    if (this.failOnEmpty && (given === undefined || given.length == 0)) {
      return this.defaultValue;
    }

    this._clean();

    return this._processData(expected, given);
  },

  /**
   * Perform an assertion on a single value
   *
   * @param mixed expected the value to compare against
   * @param mixed given    the value provided to be compared to the expected
   *
   * @return Boolean true on success, false on failure
   */
  assertSingle: function (expected, given) {
    // if we weren't given anything to compare, return the default
    if (this.failOnEmpty && (given === undefined || given.length === 0)) {
      return this.defaultValue;
    }

    return this._performAssertion(this._parseExpected(expected), given);
  },

  /**
   * Returns successful children
   *
   * @return Array
   */
  getSuccesses: function () {
    return this.successes;
  },

  setSuccesses: function (successes) {
    this.successes = successes;
    return this;
  },

  /**
   * Returns the failed children
   *
   * @return Object
   */
  getFailures: function () {
    return this.failures;
  },

  setFailures: function (failures) {
    this.failures = failures;
    return this;
  },

  /**
   * Returns the destination var data
   *
   * @return Object
   */
  getDestData: function () {
    return this.dest;
  },

  getName: function () {
    return this.name;
  },
};
