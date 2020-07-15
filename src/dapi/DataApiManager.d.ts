/**
 * Manages DataAPI requests and return data
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
 */

import {PositiveInteger} from '../numeric';
import {DataApiDefinitions} from '../program/Program';
import {UserRequest} from '../server/request/UserRequest';
import {ServerSideQuote} from '../server/quote/ServerSideQuote';

export type DataApiConstructor = (
  apis: DataApiDefinitions,
  request: UserRequest,
  quote: ServerSideQuote
) => DataApiManager;

/**
 * Pends and manages API calls and return data
 *
 * TODO: Extracted pretty much verbatim from Program; needs refactoring
 */
export declare class DataApiManager {
  /**
   * Set available APIs
   *
   * TODO: Remove me; pass via ctor
   * TODO: Document API definition format
   *
   * @param apis - API definitions
   */
  setApis(apis: DataApiDefinitions): this;

  /**
   * Retrieve data from the API identified by the given id
   *
   * The optional request id permits cancelling requests if necessary.
   *
   * Once a field has finished loading, a `fieldLoaded` event will be
   * emitted with `name` and `index`.
   *
   * TODO: refactor argument list; it's just been built upon too much and
   * needs reordering
   *
   * @param api      - API id
   * @param data     - API arguments (key-value)
   * @param callback - callback to contain response
   * @param name     - element name for tracking
   * @param index    - index for tracking
   * @param bucket   - optional bucket to use as data source
   * @param fc       - failure continuation
   */
  getApiData(
    api: string,
    data: any,
    callback: any,
    name: string,
    index: PositiveInteger,
    bucket: any,
    fc: any
  ): this;

  /**
   * Get pending API calls
   *
   * TODO: Added to support a progressive refactoring; this breaks
   * encapsulation and should be removed, or formalized.
   *
   * Returned object contains uid, name, and index fields.
   *
   * @return pending API calls
   */
  getPendingApiCalls(): any;

  /**
   * Marks field for re-loading
   *
   * Stale fields will not be considered to have data, but the data
   * will remain in memory until the next request.
   *
   * @param field - field name
   * @param index - field index
   * @param stale - whether field is stale
   */
  fieldStale(field: string, index: PositiveInteger, stale?: boolean): this;

  /**
   * If the field has data, clear the data here and in the bucket
   *
   * @param id     - field id
   * @param i      - index to set
   * @param bucket - bucket to set values in
   */
  fieldNotReady(id: string, i: PositiveInteger, bucket: any): void;

  /**
   * perform the API calls
   */
  processFieldApiCalls(): this;

  /**
   * Set API return data for a given field
   *
   * @param name      - field name
   * @param index     - field index
   * @param data      - return data set
   * @param value     - param to map to value
   * @param label     - param to map to label
   * @param unchanged - whether the value has changed
   */
  setFieldData(
    name: string,
    index: PositiveInteger,
    data: Record<string, any>,
    value: string,
    label: string,
    unchanged: boolean
  ): this;

  /**
   * Update the field data and emit the relevant events
   *
   * @param name      - field name
   * @param index     - field index
   * @param value     - field value
   * @param label     - field label
   * @param unchanged - whether the field has changed
   *
   * @return true if the field has changed
   */
  triggerFieldUpdate(
    name: string,
    index: PositiveInteger,
    value: string,
    label: string,
    unchanged: boolean
  ): boolean;

  /**
   * Returns whether the given field has any result data associated with it
   *
   * @param name  - field name
   * @param index - field index
   *
   * @return true if result data exists for field, otherwise false
   */
  hasFieldData(name: string, index: PositiveInteger): boolean;

  /**
   * Clear all API response data associated with a given field
   *
   * @param name          - field name
   * @param index         - field index
   * @param trigger_event - trigger clear event
   */
  clearFieldData(
    name: string,
    index: PositiveInteger,
    trigger_event: boolean
  ): this;

  /**
   * Clear API Pending status
   * Preventing the result for the associated request from taking effect
   * This eliminates side-effects of race conditions (e.g. clearing a field
   * while a request is still pending), but does not actually cancel the API
   * call itself.
   *
   * @param id - tracking identifier
   */
  clearPendingApiCall(id: string): this;

  /**
   * Expand the mapped field data for the given field into the bucket
   *
   * It is expected that the callers are intelligent enough to not call this
   * method if it would result in nonsense. That is, an error will be raised
   * in the event that field data cannot be found; this will help to point out
   * logic errors that set crap values.
   *
   * The predictive parameter allows data for the field to be set when the
   * caller knows that the data for the value may soon become available (e.g.
   * setting the value to pre-populate the value of a pending API call).
   *
   * @param name       - field name
   * @param index      - field index
   * @param bucket     - bucket to expand into
   * @param map        - param mapping to bucket fields
   * @param predictive - allow value to be set even if its data does not exist
   * @param diff       - changeset
   */
  expandFieldData(
    name: string,
    index: PositiveInteger,
    bucket: any,
    map: any,
    predictive: boolean,
    diff: any
  ): this;

  /**
   * expandFieldData without setting values in the bucket
   *
   * @param name       - field name
   * @param index      - index
   * @param bucket     - bucket to get data from
   * @param map        - mapping of fields
   * @param predictive - allow value to be set even if its data does not exist
   * @param diff       - changeset
   *
   * @return data
   */
  getDataExpansion(
    name: string,
    index: PositiveInteger,
    bucket: any,
    map: any,
    predictive: boolean,
    diff: any
  ): Record<string, any>;
}
