/**
 * Contains program Quote class
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
 * @todo Use ``document'' terminology in place of ``quote''
 */

import {Program} from '../program/Program';
import {Quote, QuoteId} from './Quote';
import {QuoteDataBucket} from '../bucket/QuoteDataBucket';
import {PositiveInteger} from '../numeric';

export declare class BaseQuote implements Quote {
  /**
   * Retrieve Program associated with quote
   *
   * @return quote program
   */
  getProgram(): Program;

  /**
   * Returns the program id associated with the quote
   *
   * @return program id
   */
  getProgramId(): string;

  /**
   * Returns the quote id
   *
   * The quote id is immutable. A different quote id would represent a
   * different quote, therefore a new object should be created with the
   * desired quote id.
   *
   * @return quote id
   */
  getId(): QuoteId;

  /**
   * Returns the id of the current step
   *
   * @return id of current step
   */
  getCurrentStepId(): number;

  /**
   * Sets the id of the current step
   *
   * @param id of current step
   */
  setCurrentStepId(step_id: number): this;

  /**
   * Sets an explicit lock, providing a reason for doing so
   *
   * @param reason - lock reason
   * @param step   - step that user may not navigate prior
   *
   * @return self
   */
  setExplicitLock(reason: string, step?: number): this;

  /**
   * Set the date that the premium was calculated as a Unix timestamp
   *
   * @param timestamp - Unix timestamp representing premium date
   *
   * @return self
   */
  setLastPremiumDate(timestamp: UnixTimestamp): this;

  /**
   * Retrieve the last time the premium was calculated
   *
   * @return last calculated time or 0
   */
  getLastPremiumDate(): UnixTimestamp;

  /**
   * Returns the bucket used to store the quote form data
   *
   * @return the data bucket
   */
  getBucket(): QuoteDataBucket;

  /** Whether quote is locked, for any reason */
  isLocked(): boolean;

  /**
   * Retrieves the reason for an explicit lock
   *
   * @return lock reason
   */
  getExplicitLockReason(): string;

  /**
   * Returns the maximum step to which the explicit lock applies
   *
   * If no step restriction is set, then 0 will be returned.
   *
   * @return {number} locked max step or 0 if not applicable
   */
  getExplicitLockStep(): PositiveInteger;

  /**
   * Returns whether the quote has been imported
   *
   * @return true if imported, otherwise false
   */
  isImported(): boolean;

  /**
   * Returns whether the quote has been bound
   *
   * @return true if bound, otherwise false
   */
  isBound(): boolean;

  /**
   * Returns the id of the highest step the quote has reached
   *
   * @return top visited step id
   */
  getTopVisitedStepId(): PositiveInteger;

  /**
   * Returns the id of the highest step the quote has saved
   *
   * @return top saved step id
   */
  getTopSavedStepId(): PositiveInteger;

  /**
   * Sets the id of the highest step the quote has saved
   *
   * @param top saved step id
   */
  setTopSavedStepId(id: number): this;

  /**
   * Returns the quote's expiration date
   *
   * @return quote's expiration date
   */
  getExpirationDate(): number;

  /**
   * Sets username of the user who is accessing this quote
   *
   * @param {string} username
   */
  setUserName(username: string): this;

  /**
   * Returns the username of the user who is accessing this quote
   *
   * @return {string} username
   */
  getUserName(): string;

  /**
   * Sets the username of the user who created this quote
   *
   * @param {string} username
   */
  setCreatedByUserName(username: string): this;

  /**
   * Returns the username of the user who created this quote
   *
   * @return {string} username
   */
  getCreatedByUserName(): string;

  /**
   * Sets the username of the user who last updated this quote
   *
   * @param {string} username
   */
  setLastUpdatedByUserName(username: string): this;

  /**
   * Returns the username of the user who last updated this quote
   *
   * @return {string} username
   */
  getLastUpdatedByUserName(): string;
}
