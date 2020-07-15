/**
 * Formats program bucket data
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const Class = require('easejs').Class;

/**
 * Formats program bucket data
 *
 * This takes a document and formats the bucket data in a
 * structured manner of steps, groups and fields metadata
 */
module.exports = Class('DocumentProgramFormatter', {
  /**
   * Current program
   *
   * @type {Program}
   */
  'private _program': null,

  /**
   * Performs classification matching on fields
   *
   * A field will have a positive match for a given index if all of its
   * classes match
   *
   * @type {FieldClassMatcher}
   */
  'private _class_matcher': null,

  /**
   * Initialize document formatter
   *
   * @param {Program}           program       active program
   * @param {FieldClassMatcher} class_matcher class/field matcher
   */
  constructor(program, class_matcher) {
    this._program = program;
    this._class_matcher = class_matcher;
  },

  /**
   * Formats document data into structure similar to program
   *
   * @param {Bucket} bucket document bucket
   *
   * @return {Promise.<Object>} a promise of a data object
   */
  'public format'(bucket) {
    return new Promise((resolve, reject) => {
      const cmatch = this._program.classify(bucket.getData());

      this._class_matcher.match(cmatch, matches => {
        const len = this._program.steps.length;
        const data = this._parseSteps(len, bucket, matches);

        resolve(data);
      });
    });
  },

  /**
   * Parses step data
   *
   * @param {Number} len     step length
   * @param {Bucket} bucket  document bucket
   * @param {Object} matches field matches
   *
   * @return {Object} step data
   */
  'private _parseSteps'(len, bucket, matches) {
    const data = {
      steps: [],
      stepIds: [],
    };

    for (let i = 1; i < len; i++) {
      const step = {};
      const step_groups = this._program.steps[i].groups;

      const groups = this._parseGroups(step_groups, bucket, matches);
      const title = this._program.steps[i].title;
      const step_id = this._program.stepIds[i];

      step.title = title;
      step.groups = groups;
      step.id = step_id;

      data.steps.push(step);
      data.stepIds.push(step_id);
    }

    return data;
  },

  /**
   * Parses group data
   *
   * @param {Array}  step_groups array of group data
   * @param {Bucket} bucket      document bucket
   * @param {Object} matches     field matches
   *
   * @return {Array} array of groups
   */
  'private _parseGroups'(step_groups, bucket, matches) {
    return step_groups.map(group_id => {
      const fields = this._program.groupExclusiveFields[group_id];
      const {title, link} = this._program.groups[group_id];

      return {
        id: group_id,
        title: title || '',
        link: link || '',
        questions: this._parseFields(fields, bucket, matches),
      };
    });
  },

  /**
   * Parses fields/question data
   *
   * @param {Array}  fields  array of field data
   * @param {Bucket} bucket  document bucket
   * @param {Object} matches field matches
   *
   * @return {Array} array of questions
   */
  'private _parseFields'(fields, bucket, matches) {
    const questions = [];

    for (let field in fields) {
      const field_id = fields[field];

      // Don't include fields that are not in program.fields
      if (typeof this._program.fields[field_id] === 'undefined') {
        continue;
      }

      const value = bucket.getDataByName(field_id);
      const {label, type} = this._program.fields[field_id];

      questions.push({
        id: field_id,
        label: label || '',
        value: value,
        type: type || '',
        applicable: this._getApplicable(matches, field_id, value),
      });
    }

    return questions;
  },

  /**
   * Determine when a field is shown by index
   * Map boolean values of [0, 1] to [true, false]
   *
   * @param {Object} matches     field matches
   * @param {String} field_id    id of field
   * @param {Object} field_value field object
   *
   * @return {Array.<boolean>} array of booleans
   */
  'private _getApplicable'(matches, field_id, field_value) {
    // If object is undefined, default to array of true
    if (typeof matches[field_id] === 'undefined') {
      return field_value.map(_ => true);
    }

    const indexes = matches[field_id].indexes;
    const all_match = matches[field_id].all;

    if (indexes.length > 0) {
      // Map indexes of  0, 1 to true, false
      return indexes.map(x => !!x);
    } else {
      return field_value.map(_ => all_match);
    }
  },
});
