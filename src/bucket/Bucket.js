/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Generalized key-value store
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
 * There's a hole in my bucket, dear Liza, dear Liza [...]
 */

var Interface = require('easejs').Interface;

/**
 * Represents an object that is able to store key-value data with multiple
 * indexes per value
 */
module.exports = Interface('Bucket', {
  /**
   * Explicitly sets the contents of the bucket
   *
   * @param {Object.<string,Array>} data associative array of the data
   *
   * @return {Bucket} self
   */
  'public setValues': ['data'],

  /**
   * Overwrites values in the original bucket
   *
   * @param {Object.<string,Array>} data associative array of the data
   *
   * @return {Bucket} self
   */
  'public overwriteValues': ['data'],

  /**
   * Clears all data from the bucket
   *
   * @return {Bucket} self
   */
  'public clear': [],

  /**
   * Calls a function for each each of the values in the bucket
   *
   * Note: This format is intended to be consistent with Array.forEach()
   *
   * @param {function( Object, number )} callback function to call for each
   *                                              value in the bucket
   *
   * @return {Bucket} self
   */
  'public each': ['callback'],

  /**
   * Returns the data for the requested field
   *
   * @param {string} name field name (with or without trailing brackets)
   *
   * @return {Array} data for the field, or empty array if none
   */
  'public getDataByName': ['name'],

  /**
   * Returns the data as a JSON string
   *
   * @return {string} data represented as JSON
   */
  'public getDataJson': [],

  /**
   * Return raw bucket data
   *
   * TODO: remove; breaks encapsulation
   *
   * @return {Object} raw bucket data
   */
  'public getData': [],

  /**
   * Calls a function for each each of the values in the bucket matching the
   * given predicate
   *
   * @param {function(string)}           pred     predicate
   * @param {function( Object, number )} callback function to call for each
   *                                              value in the bucket
   *
   * @return {Bucket} self
   */
  'public filter': ['pred', 'callback'],
});
