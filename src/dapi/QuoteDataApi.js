/**
 * Transform key/value data into standard quote request
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
 * This is insurance-specific using a standardized request format for
 * producing insurance quote data.
 */

const {Class} = require('easejs');
const DataApi = require('./DataApi');
const EventEmitter = require('../events').EventEmitter;

/**
 * Structure flat key/value data for quote request
 *
 * The request structure can be seen in #mapData.  No fields are required to
 * be present---they all have defaults; the philosophy is to allow the
 * server to fail if necessary.  Basic validations (e.g. ensuring correct
 * data type and format) may be added in the future.
 *
 * This DataApi is responsible only for data transformation---it is expected
 * to decorate a DataApi capable of performing an actual data transfer.
 */
module.exports = Class('QuoteDataApi')
  .implement(DataApi)
  .extend({
    /**
     * Decorated DataApi
     *
     * @type {DataApi}
     */
    'private _dapi': null,

    /**
     * Initialize with DataApi to decorate
     *
     * @param {DataApi} dapi subject to decorate
     */
    constructor(dapi) {
      if (!Class.isA(DataApi, dapi)) {
        throw TypeError('Expected object of type DataApi; given: ' + dapi);
      }

      this._dapi = dapi;
    },

    /**
     * Request data from the service
     *
     * @param {Object=}                  data     request params
     * @param {function(?Error,Object)=} callback server response callback
     *
     * @return {DataApi} self
     */
    'public request'(data, callback, id) {
      this._dapi.request(this.mapData(data), callback);
    },

    /**
     * Map key/value data into quote request
     *
     * @param {Object} data key/value data
     *
     * @return {Object} mapped request data
     */
    'protected mapData'(data) {
      const rate_date = data.rate_date || data.effective_date || '';

      return {
        effective_date: this._formatDate(data.effective_date || ''),
        rate_date: this._formatDate(rate_date),
        insured: {
          location: {
            city: data.insured_city || '',
            state: data.insured_state || '',
            zip: data.insured_zip || '',
            county: data.insured_county || '',
          },
          business_year_count: +data.business_year_count || 0,
        },
        coverages: (data.classes || []).map((class_code, i) => ({
          class: class_code,
          limit: {
            occurrence: +(data.limit_occurrence || 0),
            aggregate: +(data.limit_aggregate || 0),
          },
          exposure: +(data.exposure || [])[i] || 0,
        })),
        losses: (data.loss_type || []).map(loss_type => ({
          type: loss_type,
        })),
      };
    },

    /**
     * Append time to ISO 8601 date+time format
     *
     * This is required by some services.
     *
     * @type {string} date ISO 8601 date (without time)
     *
     * @return {string} ISO 8601 combined date and time
     */
    'private _formatDate'(date) {
      return date === '' ? '' : date + 'T00:00:00';
    },
  });
