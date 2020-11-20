/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Validate bucket data by type
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

var Class = require('easejs').Class;

/**
 * Validates and formats bucket data
 */
module.exports = Class('BucketDataValidator', {
  /**
   * VFormat instances for each type
   * @type {Object}
   */
  'private _fmts': {},

  /**
   * Map fields to their types
   *
   * File names as the properties, type as the value.
   *
   * @type {Object}
   */
  'private _type_map': {},

  /**
   * Initializes bucket data validator
   *
   * Bucket data is validated using VFormat patterns. Each field will be
   * formatted according to their type as specified in the type_map and the
   * rules for the given type as provided in format_set.
   *
   * @param {Object} type_map   maps fields to their types
   * @param {Object} format_set VFormat objects for each type in
   *                                    type_map
   */
  __construct: function (type_map, format_set) {
    this._type_map = type_map || {};
    this._fmts = format_set || {};
  },

  /**
   * Validate the given data, returning another object consisting of the
   * formatted results
   *
   * Unrecognized fields will be ignored (and copied as-is to the resulting
   * object). Each value for the given data is expected to be an array;
   * otherwise, an empty array will be returned in its place.
   *
   * @param {Object.<Array>} data data to validate/format
   *
   * @param {function(name,value,i,e)} err callback for validation errors
   *
   * @param {boolean=} inplace alter data object rather than returning a new
   *                           object containing formatted data
   *
   * @return {Object.<Array.<string>>} formatted data
   */
  'virtual public validate': function (data, err, inplace) {
    err = err || function () {};
    inplace = !!inplace;

    var formatted = inplace ? data : {};

    // validate and format each item
    for (var name in data) {
      var type = this._getFieldType(name),
        value = data[name];

      // ignore unknown types (if it should be kicked out, then the server
      // will take care of it; we store a lot of random shit client-side
      // for calculated values, etc)
      if (!type) {
        formatted[name] = value;
        continue;
      }

      // we expect that the bucket data will always consist of an array of
      // values
      formatted[name] = this._validateEach(value, name, type, err);
    }

    return formatted;
  },

  /**
   * Format each provided bucket value for display to the user
   *
   * The data stored in the bucket may not necessarily be the best
   * representation for the user. For example, dates may be styled in a
   * familiar locale.
   *
   * Optionally, the data can be modified in place rather than returning a new
   * object.
   *
   * @param {Object.<Array>} data    data to validate/format
   * @param {boolean=}       inplace alter data object rather than returning
   *                                 a new object containing formatted data
   *
   * @return {Array.<string>} formatted data
   */
  'virtual public format': function (data, inplace) {
    inplace = !!inplace;

    var formatted = inplace ? data : {};

    for (var name in data) {
      var type = this._getFieldType(name),
        value = data[name];

      if (!type) {
        formatted[name] = value;
        continue;
      }

      formatted[name] = this._formatEach(value, name, type);
    }

    return formatted;
  },

  /**
   * Determine field type
   *
   * This maintains BC: the old data format used a string to represent
   * the type, whereas the new system uses an object describing additional
   * details.
   *
   * @param {string} name type name
   *
   * @return {string|undefined} type of field NAME
   */
  'private _getFieldType': function (name) {
    var type_data = this._type_map[name];

    return type_data ? type_data.type || type_data : undefined;
  },

  /**
   * Validate and format each element of the given array
   *
   * @param {Array.<string>} values values to validate and format
   * @param {string}         name   field name
   * @param {string}         type   field type
   *
   * @param {function(name,value,i,e)} err callback for validation errors
   *
   * @return {Array.<string>} formatted data
   */
  'private _validateEach': function (values, name, type, err) {
    return this._forEach(values, name, type, 'parse', err);
  },

  /**
   * Format each value in the given array
   *
   * @param {Array.<string>} values values to validate and format
   * @param {string}         name   field name
   * @param {string}         type   field type
   *
   * @return {Array.<string>} formatted data
   */
  'private _formatEach': function (values, name, type) {
    return this._forEach(values, name, type, 'retrieve');
  },

  /**
   * Iterate over each value, perform the requested action and return the
   * result set
   *
   * @param {Array.<string>} values values to validate and format
   * @param {string}         name   field name
   * @param {string}         type   field type
   * @param {string}         method parse/retrieve
   *
   * @param {function(string,string,number,Error)} err error handler
   *
   * @return {Array.<string>} formatted data
   */
  'private _forEach': function (values, name, type, method, err) {
    // formatted return values
    var ret = [],
      fmt = this._fmts[type];

    if (fmt === null) {
      // if the formatter is null, then perform no formatting
      return values;
    } else if (fmt === undefined) {
      throw Error('No formatter for type ' + type);
    }

    for (var i in values) {
      var value = values[i];

      // trim the data
      if (typeof value === 'string') {
        value = value.trim();
      }

      // ignore empty/undefined/null values (explicitly; avoid casting
      // magic)
      if (value === '' || value === undefined || value === null) {
        ret[i] = method === 'retrieve' ? '' : value;
        continue;
      }

      // format return values for display
      try {
        // validators expect strings
        ret[i] = fmt[method].call(fmt, '' + value);
      } catch (e) {
        if (err) {
          // the caller wishes to handle errors
          err(name, value, i, e);
        } else {
          // there was a problem formatting (or the formatter doesn't
          // exist); return the raw value so as not to wipe out their
          // data
          ret[i] = value;
        }
      }
    }

    return ret;
  },
});
