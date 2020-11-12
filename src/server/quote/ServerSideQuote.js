/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Augments a quote with additional data for use by the quote server
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

var Class = require('easejs').Class,
  Quote = require('../../quote/Quote'),
  BaseQuote = require('../../quote/BaseQuote');

module.exports = Class('ServerSideQuote')
  .implement(Quote)
  .extend(BaseQuote, {
    /**
     * Program version
     * @type {string}
     */
    'private _pver': '',

    /**
     * Credit score reference number
     * @type {number}
     */
    'private _creditScoreRef': 0,

    /**
     * Unix timestamp containing date of first premium calculation
     * @type {number}
     */
    'private _rated_date': 0,

    /**
     * Metabucket
     * @type {Bucket}
     */
    'private _metabucket': null,

    /**
     * Rating Data Bucket
     * @type {Bucket}
     */
    'private _rate_bucket': null,

    /**
     * The number of rate retries that have been attempted
     * @type {number}
     */
    'private _retry_attempts': 0,

    /** State of each currently applicable field */
    'private _field_state': undefined,

    'public setProgramVersion': function (version) {
      this._pver = '' + version;
      return this;
    },

    'public getProgramVersion': function () {
      return this._pver;
    },

    'public setCreditScoreRef': function (ref) {
      this._creditScoreRef = +ref;
      return this;
    },

    'public getCreditScoreRef': function () {
      return this._creditScoreRef;
    },

    /**
     * Set the timestamp of the first time quote was rated
     *
     * @param {number} timestamp Unix timestamp representing first rated date
     *
     * @return {Quote} self
     */
    'public setRatedDate': function (timestamp) {
      // do not overwrite date if it exists
      if (this._rated_date === 0) {
        this._rated_date = +timestamp || 0;
      }

      return this;
    },

    /**
     * If the quote has been rated
     *
     * @return {boolean} has been rated
     */
    'public getRatedDate': function () {
      return this._rated_date;
    },

    /**
     * Metadata bucket
     *
     * @return {Bucket}
     */
    'public getMetabucket': function () {
      return this._metabucket;
    },

    /**
     * Set metadata bucket
     *
     * @return {ServerSideQuote} self
     */
    'public setMetabucket': function (metabucket) {
      this._metabucket = metabucket;
    },

    /**
     * Set metabucket data
     *
     * @param {Object} data key/value data
     *
     * @return {ServerSideQuote} self
     */
    'public setMetadata': function (data) {
      if (!this._metabucket) {
        throw Error('No metabucket available for #setMetadata');
      }

      this._metabucket.setValues(data);
      return this;
    },

    /**
     * Set rating bucket
     *
     * @param {Bucket} bucket the rate bucket to set
     */
    'public setRateBucket': function (bucket) {
      this._rate_bucket = bucket;

      return this;
    },

    /**
     * Get rating bucket
     *
     * @return {Bucket}
     */
    'public getRateBucket': function () {
      return this._rate_bucket;
    },

    /**
     * Set rating data
     *
     * @param {Object.<string,Array>} data rating data
     */
    'public setRatingData': function (data) {
      if (!this._rate_bucket) {
        throw Error('No rating bucket available for #setRatingData');
      }

      this._rate_bucket.setValues(data);

      return this;
    },

    /**
     * Get rating data
     *
     * @return {Object.<string,Array>} rating data
     */
    'public getRatingData': function () {
      if (!this._rate_bucket) {
        throw Error('No rating bucket available for #setRatingData');
      }

      return this._rate_bucket.getData();
    },

    /**
     * Set the number of retries attempted
     *
     * @return {ServerSideQuote} self
     */
    'public setRetryAttempts': function (attempts) {
      this._retry_attempts = attempts;

      return this;
    },

    /**
     * Get the number of retries attempted
     *
     * @return {number} the number of attempts that have been made
     */
    'public getRetryAttempts': function () {
      return this._retry_attempts;
    },

    /**
     * Retrieve the number of raters that are pending
     *
     * @param {Object.<string,Array>} data (optional) Rate data
     *
     * @return {number} the number of retries pending
     */
    'public getRetryCount': function (data) {
      let retry_field_count = 0;

      // if no data is specified then use internal rate data
      data = data || this._rate_bucket.getData();

      const retry_pattern = /^(.+)__retry$/;
      const retry_true_count = Object.keys(data).filter(field => {
        const value = Array.isArray(data[field])
          ? // In case the data are in a nested array
            // e.g. data[ field ] === [ [ 0 ] ]
            Array.prototype.concat.apply([], data[field])
          : data[field];

        const is_retry = field.match(retry_pattern);

        if (is_retry) {
          retry_field_count++;
        }

        return is_retry && !!value[0];
      }).length;

      return {
        field_count: retry_field_count,
        true_count: retry_true_count,
      };
    },

    /** Classify this quote and update field state */
    classify() {
      const program = this.getProgram();
      const class_data = program.classify(this.getBucket().getData());

      /**
       * Force class matrices into vectors
       *
       * If `xs` is not a matrix, the return value is unchanged from `xs`.
       *
       * The idea is that fields should never have matrix classification
       * data, because bucket data is always a vector.  This was overly
       * accommodating for convenience, and has bit us; in the future, the
       * compiler will force things to vectors for us, and we won't have to
       * worry about this.
       */
      const matrixToVec = xs =>
        !isArray(xs) ? xs : xs.map(x => (isArray(x) ? +x.some(v => !!v) : x));

      const {isArray} = Array;
      const qvisState = visq => class_data =>
        Object.fromEntries(
          Object.entries(class_data)
            .map(
              ([c, {is, indexes}]) =>
                is && visq[c] && [visq[c], matrixToVec(indexes)]
            )
            .filter(isArray)
        );
      const filtered = qvisState(program.whenq)(class_data);

      this._field_state = filtered;

      return class_data;
    },

    /**
     * State of each currently applicable field
     *
     * This is updated by `#classify`, and so will be `undefined` if that
     * has not yet been invoked.  Since classifying is a potentially
     * expensive operation, do not expect that field state will always be
     * available, and do not expect that the classifier would be
     * automatically invoked to acquire it.
     */
    getFieldState() {
      return this._field_state;
    },

    /** Set applicability of quote as it existed the last save */
    setLastPersistedFieldState(state) {
      this._last_persisted_field_state = state;
      return this;
    },

    /** Applicability of each field the last time the quote was saved */
    getLastPersistedFieldState() {
      return this._last_persisted_field_state;
    },
  });
