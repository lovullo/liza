/* TODO auto-generated eslint ignore, please fix! */
/* eslint @typescript-eslint/no-inferrable-types: "off", no-var: "off", prefer-const: "off" */
/**
 * Rating service
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

import {ClassificationData, RateResult, WorksheetData} from '../rater/Rater';
import {ClientActions} from '../../client/action/ClientAction';
import {PositiveInteger} from '../../numeric';
import {PriorityLog} from '../log/PriorityLog';
import {ProcessManager} from '../rater/ProcessManager';
import {QuoteId} from '../../quote/Quote';
import {ServerDao} from '../db/ServerDao';
import {ServerSideQuote} from '../quote/ServerSideQuote';
import {DeltaConstructor} from '../../bucket/delta';
import {UserSession} from '../request/UserSession';

type RequestCallback = () => void;

/** Content result of rating */
export type RateRequestContent = {
  data: RateResult;
  initialRatedDate: UnixTimestamp;
  lastRatedDate: UnixTimestamp;
};

/** Complete Rating Results */
export type RateRequestResult = {
  content: RateRequestContent;
  actions: ClientActions;
};

/**
 * Handle rating requests
 *
 * XXX: This class was extracted from Server and needs additional
 * refactoring, testing, and cleanup.
 *
 * TODO: Logging should be implemented by observers
 */
export class RatingService {
  /** The maximum amount of retries to attempt */
  readonly RETRY_MAX_ATTEMPTS: PositiveInteger = <PositiveInteger>12;

  /** Seconds to wait between retries */
  readonly RETRY_DELAY: PositiveInteger = <PositiveInteger>5;

  /**
   * Initialize rating service
   *
   * @param _logger        - logging system
   * @param _dao           - database connection
   * @param _rater_manager - rating manager
   * @param _createDelta   - delta constructor
   * @param _ts_ctor       - a timestamp constructor
   */
  constructor(
    private readonly _logger: PriorityLog,
    private readonly _dao: ServerDao,
    private readonly _rater_manager: ProcessManager,
    private readonly _createDelta: DeltaConstructor<number>,
    private readonly _ts_ctor: () => UnixTimestamp
  ) {}

  /**
   * Sends rates to the client
   *
   * Note that the promise will be resolved after all data saving is
   * complete; the request will be sent back to the client before then.
   *
   * @param session - user session
   * @param quote   - quote to export
   * @param cmd     - applicable of command request
   * @param force   - (optional) force a rate, overriding quote valid checks
   *
   * @return result promise
   */
  request(
    session: UserSession,
    quote: ServerSideQuote,
    cmd: string,
    force: boolean = false
  ): Promise<RateRequestResult> {
    return new Promise<RateRequestResult>(resolve => {
      // cmd represents a request for a single rater
      if (!cmd && !force && this._isQuoteValid(quote)) {
        const actions: ClientActions = [];
        const data = quote.getRatingData();

        this._processRetries(quote, data, actions);

        // send last rated data
        return resolve({
          content: {
            data: data,
            initialRatedDate: quote.getRatedDate(),
            lastRatedDate: quote.getLastPremiumDate(),
          },
          actions: actions,
        });
      }

      resolve(this._performRating(session, quote, cmd));
    }).catch(err => {
      this._logRatingError(quote, err);
      throw err;
    });
  }

  /**
   * Whether quote is still valid
   *
   * TODO: This class shouldn't be making this determination, and this
   * method is nondeterministic.
   *
   * @param quote - quote to check
   *
   * @return whether quote is still valid
   */
  private _isQuoteValid(quote: ServerSideQuote): boolean {
    // quotes are valid for 30 days
    var re_date = this._ts_ctor() - 60 * 60 * 24 * 30;

    if (quote.getLastPremiumDate() > re_date) {
      this._logger.log(
        this._logger.PRIORITY_INFO,
        "Skipping '%s' rating for quote #%s; quote is still valid",
        quote.getProgramId(),
        quote.getId()
      );

      return true;
    }

    return false;
  }

  /**
   * Perform rating and process result
   *
   * @param session - user session
   * @param quote   - quote to process
   * @param indv    - individual supplier to rate (or empty)
   *
   * @return promise for results of rating
   */
  private _performRating(
    session: UserSession,
    quote: ServerSideQuote,
    indv: string
  ): Promise<RateRequestResult> {
    return new Promise<RateRequestResult>((resolve, reject) => {
      const rater = this._rater_manager.byId(quote.getProgramId());

      this._logger.log(
        this._logger.PRIORITY_INFO,
        "Performing '%s' rating for quote #%s",
        quote.getProgramId(),
        quote.getId()
      );

      // Only update the rate request timestamp on the first request made
      if (quote.getRetryAttempts() === 0) {
        const ts = this._ts_ctor();
        const meta = {liza_timestamp_rate_request: [ts]};

        quote.setMetadata(meta);
        this._dao.saveQuoteMeta(quote, meta);
      }

      rater.rate(
        quote,
        session,
        indv,
        (
          rate_data: RateResult,
          actions: ClientActions,
          override: boolean = false
        ) => {
          actions = actions || [];

          this.postProcessRaterData(rate_data, actions, quote);
          quote.setRatingData(rate_data);

          const class_dest = {};
          const cleaned = this._cleanRateData(rate_data, class_dest);

          // save all data server-side (important: do after
          // post-processing); async
          this._saveRatingData(
            quote,
            rate_data,
            class_dest,
            indv,
            override,
            () => {
              const content = {
                data: cleaned,
                initialRatedDate: quote.getRatedDate(),
                lastRatedDate: quote.getLastPremiumDate(),
              };

              resolve({content: content, actions: actions});
            }
          );
        },
        (message: string) => {
          this._logRatingError(quote, Error(message));

          reject(Error(message));
        }
      );
    });
  }

  /**
   * Saves rating data
   *
   * Data will be merged with existing bucket data and saved. The idea behind
   * this is to allow us to reference the data (e.g. for reporting) even if
   * the client does not save it.
   *
   * @param quote    - quote to save data to
   * @param data     - rating data
   * @param indv     - individual supplier, or empty
   * @param override - rating was overridden and results are custom
   * @param c        - callback
   */
  private _saveRatingData(
    quote: ServerSideQuote,
    data: RateResult,
    classes: Record<string, any>,
    indv: string,
    override: boolean,
    c: RequestCallback
  ): void {
    // only update the last premium calc date on the initial request
    if (!indv) {
      var cur_date = this._ts_ctor();

      // If we overrode the rating process we do not want to mark it as a
      // valid rate
      quote.setLastPremiumDate(override ? <UnixTimestamp>0 : cur_date);
      quote.setRatedDate(cur_date);

      const quote_data = quote.getRatingData();
      const save_data: Record<string, any> = {ratedata: data};
      const rdelta_data = {
        'rdelta.ratedata': {
          data: this._createDelta(data, quote_data),
          concluding_save: false,
          timestamp: cur_date,
        },
      };

      // Save quote classes
      for (let key in classes) {
        save_data['classData.' + key] = classes[key];
      }

      // save the last prem status (we pass an empty object as the save
      // data argument to ensure that we do not save the actual bucket
      // data, which may cause a race condition with the below merge call)
      this._dao.saveQuote(
        quote,
        () => {},
        () => {},
        save_data,
        rdelta_data
      );
    }

    this._dao.mergeBucket(quote, data, c, c);
  }

  /**
   * Process rater data returned from a rater
   *
   * @param data     - rating data returned
   * @param actions  - actions to send to client
   * @param quote    - quote used for rating
   */
  protected postProcessRaterData(
    data: RateResult,
    actions: ClientActions,
    quote: ServerSideQuote
  ): void {
    var meta = data._cmpdata || {};

    // the metadata will not be provided to the client
    delete data._cmpdata;

    // rating worksheets are returned as metadata
    this._processWorksheetData(quote.getId(), data);
    this._processRetries(quote, data, actions);

    const program = quote.getProgram();

    if (
      program.ineligibleLockCount > 0 &&
      +meta.count_ineligible >= program.ineligibleLockCount
    ) {
      // lock the quote client-side (we don't send them the reason; they
      // don't need it) to the current step
      actions.push({action: 'lock'});

      var lock_reason = 'Supplier ineligibility restriction';
      var lock_step = quote.getCurrentStepId();

      // the next step is the step that displays the rating results
      quote.setExplicitLock(lock_reason, lock_step + 1);

      // important: only save the lock state, not the step states, as we
      // have a race condition with async. rating (the /visit request may
      // be made while we're rating, and when we come back we would then
      // update the step id with a prior, incorrect step)
      this._dao.saveQuoteLockState(quote);
    }

    // if any have been deferred, instruct the client to request them
    // individually
    if (Array.isArray(meta.deferred) && meta.deferred.length > 0) {
      var torate: string[] = [];

      meta.deferred.forEach((alias: string) => {
        actions.push({action: 'indvRate', id: alias});
        torate.push(alias);
      });

      // we log that we're performing rating, so we should also log when
      // it is deferred (otherwise the logs will be rather confusing)
      this._logger.log(
        this._logger.PRIORITY_INFO,
        "'%s' rating deferred for quote #%s; will rate: %s",
        quote.getProgramId(),
        quote.getId(),
        torate.join(',')
      );
    }
  }

  /**
   * Send rating error to user and log
   *
   * @param quote   - problem quote
   * @param err     - error
   */
  private _logRatingError(quote: ServerSideQuote, err: Error): void {
    // well that's no good
    this._logger.log(
      this._logger.PRIORITY_ERROR,
      'Rating for quote %d (program %s) failed: %s',
      quote.getId(),
      quote.getProgramId(),
      err.message + '\n-!' + (err.stack || '').replace(/\n/g, '\n-!')
    );
  }

  /**
   * Clear all pending retry attempts
   *
   * @param data Rating results
   *
   * @return only retry attempt fields
   */
  private _clearRetries(data: RateResult): RateResult {
    let cleared = <RateResult>{};

    for (let field in data.__result_ids) {
      // Reset the field to zero
      data[data.__result_ids[field] + '___retry'] = [0];
      cleared[data.__result_ids[field] + '___retry'] = [0];
    }

    data['__rate_pending'] = [0];
    cleared['__rate_pending'] = [0];

    return cleared;
  }

  /**
   * Process and save worksheet data from rating results
   *
   * @param qid  - quote id
   * @param data - rating result
   */
  private _processWorksheetData(qid: QuoteId, data: RateResult): void {
    // TODO: this should be done earlier on, so that this is not necessary
    const wre = /^(.+)___worksheet$/;

    const worksheets: Record<string, WorksheetData> = {};

    // extract worksheets for each supplier
    for (var field in data) {
      var match;
      if ((match = field.match(wre))) {
        var name = match[1];

        worksheets[name] = data[field];
        delete data[field];
      }
    }

    this._dao.setWorksheets(qid, worksheets, (err: NullableError) => {
      if (err) {
        this._logger.log(
          this._logger.PRIORITY_ERROR,
          'Failed to save rating worksheets for quote %d',
          qid,
          err.message + '\n-!' + (err.stack || '').replace(/\n/g, '\n-!')
        );
      }
    });
  }

  /**
   * Get worksheet data
   *
   * @param quote    - quote from which to look up worksheet data
   * @param supplier - supplier name
   * @param index    - worksheet index
   */
  getWorksheet(
    quote: ServerSideQuote,
    supplier: string,
    index: PositiveInteger
  ): Promise<WorksheetData> {
    var qid = quote.getId();

    return this._dao.getWorksheet(qid, supplier, index);
  }

  /**
   * Prepares rate data to be sent back to the client
   *
   * There are certain data saved server-side that there is no use serving to
   * the client.
   *
   * @param data    - rate data
   * @param classes - classification data
   *
   * @return modified rate data
   */
  private _cleanRateData(
    data: RateResult,
    classes: ClassificationData
  ): RateResult {
    // forceful cast because the below loop will copy everything
    const result = <RateResult>{};

    // clear class data
    for (var key in data) {
      var mdata;

      // supplier___classes
      if ((mdata = key.match(/^(.*)___classes$/))) {
        classes[mdata[1]] = data[key];
        continue;
      }

      result[key] = data[key];
    }

    return result;
  }

  /**
   * Process retry logic
   *
   * @param quote    - quote used for rating
   * @param data     - rating data returned
   * @param actions  - actions to sent to the client
   */
  private _processRetries(
    quote: ServerSideQuote,
    data: RateResult,
    actions: ClientActions
  ): void {
    // Gather determinant factors
    const retries = quote.getRetryCount(data);
    const pending_count = retries.true_count;
    const retry_total = retries.field_count;
    const supplier_total = data.__result_ids?.length || retry_total;
    const retry_attempts = quote.getRetryAttempts();

    // Make the assumption here that if there are no retry fields at all then
    // we do not want deferred rating
    const missing_retries =
      retry_total === 0 ? 0 : supplier_total - retry_total;

    // Make determinations
    const max_attempts = retry_attempts >= this.RETRY_MAX_ATTEMPTS;
    const has_pending = missing_retries + pending_count > 0;

    // Clear retry attempts when we have no more pending rates
    quote.setRetryAttempts(has_pending ? retry_attempts + 1 : 0);

    data['__rate_pending'] = [pending_count];
    this._dao.mergeData(quote, {
      'ratedata.__rate_pending': [pending_count],
      retryAttempts: quote.getRetryAttempts(),
    });

    if (has_pending && !max_attempts) {
      // Set rate event value to -1 so that it will be in the background
      actions.push({
        action: 'delay',
        seconds: this.RETRY_DELAY,
        then: {
          action: 'rate',
          value: -1,
        },
      });
    } else if (has_pending && max_attempts) {
      const clear_data = this._clearRetries(data);
      const save_data = <RateResult>{};

      // Update quote ratedata
      quote.setRatingData(data);

      // do not overwrite data that we still want
      Object.keys(clear_data).forEach(key => {
        save_data['ratedata.' + key] = clear_data[key];
        save_data['data.' + key] = clear_data[key];
      });

      this._dao.saveQuote(
        quote,
        () => {},
        () => {},
        save_data
      );
    }
  }
}
