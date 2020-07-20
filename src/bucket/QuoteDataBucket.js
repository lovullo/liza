/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", eqeqeq: "off", prefer-const: "off", block-scoped-var: "off", no-redeclare: "off", no-unused-vars: "off", prefer-arrow-callback: "off" */
/**
 * Key/value store
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

'use strict';

var Class = require('easejs').Class,
  Bucket = require('./Bucket'),
  EventEmitter = require('../events').EventEmitter;

/**
 * General key/value store for document
 *
 * The term "Quote" here is an artifact from the initial design of the
 * system used for insurance quoting.  It will be renamed.
 *
 * @todo Rename to DocumentDataBucket
 */
module.exports = Class('QuoteDataBucket')
  .implement(Bucket)
  .extend(EventEmitter, {
    /**
     * Triggered when data in the bucket is updated, before it's committed
     * @type {string}
     */
    'const EVENT_UPDATE': 'update',

    /**
     * Raw key/value store
     * @type {Object}
     */
    'private _data': {},

    /**
     * Cleans a name for use in the bucket
     *
     * Removes trailing brackets, if present
     *
     * @return {string} cleaned name
     */
    'private _cleanName': function (name) {
      name = '' + name || '';

      var bracket = name.indexOf('[');
      if (bracket == -1) {
        return name;
      }

      return name.substring(0, bracket);
    },

    /**
     * Explicitly sets the contents of the bucket
     *
     * @param {Object.<string,Array>} data associative array of the data
     *
     * @return {QuoteDataBucket} self to allow for method chaining
     */
    'public setValues': function (data) {
      this._mergeData(data);
      return this;
    },

    /**
     * Alias of setValues
     *
     * @return {QuoteDataBucket} self to allow for method chaining
     */
    'public setCommittedValues': function () {
      return this.setValues.apply(this, arguments);
    },

    /**
     * Clears all data from the bucket
     *
     * @return {QuoteDataBucket} self
     */
    'public clear': function () {
      this._data = {};
      return this;
    },

    /**
     * Merges updated data with the existing data
     *
     * @param Object data updated data
     *
     * @return undefined
     */
    'private _mergeData': function (data) {
      var ignore = {};

      // remove any data that has not been updated (the hooks do processing on
      // this data, often updating the DOM, so it's faster to do this than to
      // have a lot of unnecessary DOM work done)
      for (let name in data) {
        var data_set = data[name],
          pre_set = this._data[name],
          changed = false;

        // if there's no previous data for this key, or the lengths vary,
        // then we want to keep it
        if (pre_set === undefined || pre_set.length !== data_set.length) {
          continue;
        }

        for (var i = 0, len = data_set.length; i < len; i++) {
          if (data_set[i] !== pre_set[i]) {
            changed = true;
            break;
          }
        }

        // data matches original---we do not want to delete it, since that
        // would modify the provided object; instead, mark it to be ignored
        if (changed === false) {
          ignore[name] = true;
        }
      }

      this.emit(this.__self.$('EVENT_UPDATE'), data);

      for (let name in data) {
        if (ignore[name]) {
          continue;
        }

        var data_set = data[name];

        // initialize it if its undefined in the bucket
        if (this._data[name] === undefined) {
          this._data[name] = [];
        }

        // merge the indexes one by one to preserve existing data
        var data_set_len = data_set.length;
        for (var i = 0; i < data_set_len; i++) {
          // ignore undefined (since we're merging, if it's not set, then
          // we don't want to remove the data that's already there)
          if (data_set[i] === undefined) {
            continue;
          }

          // ignore if set to null (implying the index was removed)
          if (data_set[i] === null) {
            // this marks the end of the array as far as we're concerned
            this._data[name].length = i;
            break;
          }

          this._data[name][i] = data_set[i];
        }
      }
    },

    /**
     * Overwrites values in the original bucket
     *
     * For this buckeet, overwriteValues() is an alias for setValues() without
     * index merging. However, other Bucket implementations may handle it
     * differently.
     *
     * @param {Object.<string,Array>} data associative array of the data
     *
     * @return {Bucket} self
     */
    'public overwriteValues': function (data) {
      this.setValues(
        Object.keys(data).reduce(
          (vals, key) => ((vals[key] = data[key].concat([null])), vals),
          {}
        )
      );

      return this;
    },

    /**
     * Calls a function for each each of the values in the bucket
     *
     * Note: This format is intended to be consistent with Array.forEach()
     *
     * @param {function(string,string)} callback function to call for each
     *                                           value in the bucket
     *
     * @return {QuoteDataBucket} self to allow for method chaining
     */
    'public each': function (callback) {
      var bucket = this;

      for (var name in this._data) {
        callback(this._data[name], name);
      }

      return this;
    },

    /**
     * Calls a function for each each of the values in the bucket matching the
     * given predicate
     *
     * @param {function(string)}           pred predicate
     * @param {function( Object, number )} c    function to call for each
     *                                          value in the bucket
     *
     * @return {StagingBucket} self
     */
    'public filter': function (pred, c) {
      this.each(function (data, name) {
        if (pred(name)) {
          c(data, name);
        }
      });
    },

    /**
     * Returns the data for the requested field
     *
     * @param {string} name name of the field (with or without trailing brackets)
     *
     * @return {Array} data for the field, or empty array if none
     */
    'public getDataByName': function (name) {
      var data = this._data[this._cleanName(name)];

      if (data === undefined) {
        return [];
      }

      if (data === null) {
        return null;
      }

      // return a copy of the data
      return typeof data === 'object' ? data.slice(0) : data;
    },

    /**
     * Returns the data as a JSON string
     *
     * @return {string} data represented as JSON
     */
    'public getDataJson': function () {
      return JSON.stringify(this._data);
    },

    /**
     * Return raw bucket data
     *
     * TODO: remove; breaks encapsulation
     *
     * @return {Object} raw bucket data
     */
    'public getData': function () {
      return this._data;
    },
  });
