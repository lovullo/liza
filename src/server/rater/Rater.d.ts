/**
 * Contains Rater interface
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

import {ClientActions} from '../../client/action/ClientAction';
import {ServerSideQuote} from '../quote/ServerSideQuote';
import {UserSession} from '../request/UserSession';

/** Result of rating */
export interface RateResult {
  /** Whether all suppliers were not able to provide rates */
  _unavailable_all: '0' | '1';

  /** The ids for each supplier */
  __result_ids: string[];

  /** Result data */
  [P: string]: any;
}

/**
 * Result of rating with an individual supplier
 *
 * This gets combined into a single RateResult prefixed with each supplier
 * id and an underscore.
 */
export interface SupplierRateResult {
  /** Rating worksheet data */
  __worksheet?: WorksheetData;

  /** Classification system results */
  __classes?: ClassificationData;

  /** Basic profiling data */
  __perf: PerformanceData;

  /** Ineligible message, if any */
  ineligible: string;

  /** Submit message, if any */
  submit: string;

  /** Final premium */
  premium: number;

  /** Rating data */
  [P: string]: any;
}

/** Basic profiling data */
export interface PerformanceData {
  /** Timestamp of beginning of rating */
  start: UnixTimestampMillis;

  /** Timestamp of end of rating */
  end: UnixTimestampMillis;

  /** Total rating time */
  total: Milliseconds;
}

/**
 * Worksheet data from rater
 *
 * These data come from the compiled raters.
 *
 * TODO: Fill in a schema here
 */
export type WorksheetData = Record<string, any>;

/** Classification results */
export type ClassificationData = Record<string, boolean>;

/**
 * Represents a rater that will generate a quote from a given set of values
 */
export interface Rater {
  /**
   * Asynchronously performs rating
   *
   * @param quote   - quote to perform rating on
   * @param session - user session
   * @param indv    - individual supplier to rate (otherwise empty)
   * @param success - continuation when rating is successful
   * @param failure - continuation when rating fails
   *
   * @return self
   */
  rate(
    quote: ServerSideQuote,
    session: UserSession,
    indv: string,
    success: (rate_data: RateResult, actions: ClientActions) => void,
    failure: (message: string) => void
  ): this;
}
