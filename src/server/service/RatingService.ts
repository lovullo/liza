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

import { ClassificationData, RateResult, WorksheetData } from "../rater/Rater";
import { ClientActions } from "../../client/action/ClientAction";
import { PositiveInteger } from "../../numeric";
import { PriorityLog } from "../log/PriorityLog";
import { ProcessManager } from "../rater/ProcessManager";
import { Program } from "../../program/Program";
import { QuoteId } from "../../quote/Quote";
import { Server } from "../Server";
import { ServerDao } from "../db/ServerDao";
import { ServerSideQuote } from "../quote/ServerSideQuote";
import { UserRequest } from "../request/UserRequest";
import { UserResponse } from "../request/UserResponse";
import { DeltaConstructor } from "../../bucket/delta";

type RequestCallback = () => void;

/** Result of rating */
export type RateRequestResult = {
    data:             RateResult,
    initialRatedDate: UnixTimestamp,
    lastRatedDate:    UnixTimestamp,
};


/**
 * Handle rating requests
 *
 * XXX: This class was extracted from Server and needs additional
 * refactoring, testing, and cleanup.
 *
 * TODO: Logging should be implemented by observers
 */
export class RatingService
{
    /** The maximum amount of retries to attempt */
    readonly RETRY_MAX_ATTEMPTS: PositiveInteger = <PositiveInteger>12;

    /** Seconds to wait between retries */
    readonly RETRY_DELAY: PositiveInteger = <PositiveInteger>5;


    /**
     * Initialize rating service
     *
     * @param _logger        - logging system
     * @param _dao           - database connection
     * @param _server        - server actions
     * @param _rater_manager - rating manager
     * @param _createDelta   - delta constructor
     * @param _ts_ctor       - a timestamp constructor
     */
    constructor(
        private readonly _logger:        PriorityLog,
        private readonly _dao:           ServerDao,
        private readonly _server:        Server,
        private readonly _rater_manager: ProcessManager,
        private readonly _createDelta:   DeltaConstructor<number>,
        private readonly _ts_ctor:       () => UnixTimestamp,
    ) {}


    /**
     * Sends rates to the client
     *
     * Note that the promise will be resolved after all data saving is
     * complete; the request will be sent back to the client before then.
     *
     * @param request   - user request to satisfy
     * @param _response - pending response
     * @param quote     - quote to export
     * @param cmd       - applicable of command request
     *
     * @return result promise
     */
    request(
        request:   UserRequest,
        _response: UserResponse,
        quote:     ServerSideQuote,
        cmd:       string,
    ): Promise<RateRequestResult>
    {
        return new Promise<RateRequestResult>( resolve =>
        {
            // cmd represents a request for a single rater
            if ( !cmd && this._isQuoteValid( quote ) )
            {
                // send last rated data
                this._server.sendResponse( request, quote, {
                    data: quote.getRatingData(),
                    initialRatedDate: quote.getRatedDate(),
                    lastRatedDate: quote.getLastPremiumDate()
                }, [] );

                // XXX: When this class is no longer responsible for
                // sending the response to the server, this below data needs
                // to represent the _current_ values, since as it is written
                // now, it'll overwrite what is currently in the bucket
                return resolve( {
                    data:             { _unavailable_all: '0' },
                    initialRatedDate: <UnixTimestamp>0,
                    lastRatedDate:    <UnixTimestamp>0,
                } );
            }

            resolve( this._performRating( request, quote, cmd ) );
        } )
        .catch( err =>
        {
            this._sendRatingError( request, quote, err );
            throw err;
        } );
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
    private _isQuoteValid( quote: ServerSideQuote ): boolean
    {
        // quotes are valid for 30 days
        var re_date = this._ts_ctor() - ( 60 * 60 * 24 * 30 );

        if ( quote.getLastPremiumDate() > re_date )
        {
            this._logger.log( this._logger.PRIORITY_INFO,
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
     * @param request - user request to satisfy
     * @param quote   - quote to process
     * @param indv    - individual supplier to rate (or empty)
     *
     * @return promise for results of rating
     */
    private _performRating(
        request:  UserRequest,
        quote:    ServerSideQuote,
        indv:     string,
    ): Promise<RateRequestResult>
    {
        return new Promise<RateRequestResult>( ( resolve, reject ) =>
        {
            const rater = this._rater_manager.byId( quote.getProgramId() );

            this._logger.log( this._logger.PRIORITY_INFO,
                "Performing '%s' rating for quote #%s",
                quote.getProgramId(),
                quote.getId()
            );

            // Only update the rate request timestamp on the first request made
            if( quote.getRetryAttempts() === 0 )
            {
                const meta = { 'liza_timestamp_rate_request': [ this._ts_ctor() ] }

                quote.setMetadata( meta );
                this._dao.saveQuoteMeta( quote, meta );
            }

            rater.rate( quote, request.getSession(), indv,
                ( rate_data: RateResult, actions: ClientActions ) =>
                {
                    actions = actions || [];

                    this.postProcessRaterData(
                        request, rate_data, actions, quote.getProgram(), quote
                    );

                    const class_dest = {};

                    const cleaned = this._cleanRateData(
                        rate_data,
                        class_dest
                    );

                    // TODO: move me during refactoring
                    this._dao.saveQuoteClasses( quote, class_dest );

                    // save all data server-side (important: do after
                    // post-processing); async
                    this._saveRatingData( quote, rate_data, indv, () =>
                    {
                        const result = {
                            data:             cleaned,
                            initialRatedDate: quote.getRatedDate(),
                            lastRatedDate:    quote.getLastPremiumDate()
                        };

                        this._server.sendResponse(
                            request, quote, result, actions
                        );

                        resolve( result );
                    } );
                },
                ( message: string ) =>
                {
                    this._sendRatingError( request, quote,
                        Error( message )
                    );

                    reject( Error( message ) );
                }
            );
        } );
    }


    /**
     * Saves rating data
     *
     * Data will be merged with existing bucket data and saved. The idea behind
     * this is to allow us to reference the data (e.g. for reporting) even if
     * the client does not save it.
     *
     * @param quote - quote to save data to
     * @param data  - rating data
     * @param indv  - individual supplier, or empty
     * @param c     - callback
     */
    private _saveRatingData(
        quote: ServerSideQuote,
        data:  RateResult,
        indv:  string,
        c:     RequestCallback
    ): void
    {
        // only update the last premium calc date on the initial request
        if ( !indv )
        {
            var cur_date = this._ts_ctor();

            quote.setLastPremiumDate( cur_date );
            quote.setRatedDate( cur_date );

            const quote_data  = quote.getRatingData();
            const save_data   = { ratedata: data };
            const rdelta_data = {
                "rdelta.ratedata": {
                    data:            this._createDelta( data, quote_data ),
                    concluding_save: false,
                    timestamp:       cur_date,
                },
            };

            // save the last prem status (we pass an empty object as the save
            // data argument to ensure that we do not save the actual bucket
            // data, which may cause a race condition with the below merge call)
            this._dao.saveQuote( quote, c, c, save_data, rdelta_data );
        }
        else
        {
            c();
        }

        // we're not going to worry about whether or not this fails; if it does,
        // an error will be automatically logged, but we still want to give the
        // user a rate (if this save fails, it's likely we have bigger problems
        // anyway); this can also be done concurrently with the above request
        // since it only modifies a portion of the bucket
        this._dao.mergeBucket( quote, data );
    }


    /**
     * Process rater data returned from a rater
     *
     * @param _request - user request to satisfy
     * @param data     - rating data returned
     * @param actions  - actions to send to client
     * @param program  - program used to perform rating
     * @param quote    - quote used for rating
     */
    protected postProcessRaterData(
        _request: UserRequest,
        data:     RateResult,
        actions:  ClientActions,
        program:  Program,
        quote:    ServerSideQuote,
    ): void
    {
        var meta = data._cmpdata || {};

        // the metadata will not be provided to the client
        delete data._cmpdata;

        // rating worksheets are returned as metadata
        this._processWorksheetData( quote.getId(), data );

        const {
            pending_count,
            timeout,
            should_retry
        } = this._processRetries( program, quote, data );

        data[ '__rate_pending' ] = [ pending_count ];

        if ( should_retry )
        {
            actions.push( {
                'action':  'delay',
                'seconds': this.RETRY_DELAY,
                'then': {
                    action: 'rate',
                    indv:   'retry',
                },
            } );

            quote.retryAttempted();
            this._dao.saveQuoteRateRetries( quote );
        }
        else if ( timeout )
        {
            this._clearRetries( data );
        }

        if ( ( program.ineligibleLockCount > 0 )
            && ( +meta.count_ineligible >= program.ineligibleLockCount )
        )
        {
            // lock the quote client-side (we don't send them the reason; they
            // don't need it) to the current step
            actions.push( { action: 'lock' } );

            var lock_reason = 'Supplier ineligibility restriction';
            var lock_step   = quote.getCurrentStepId();

            // the next step is the step that displays the rating results
            quote.setExplicitLock( lock_reason, ( lock_step + 1 ) );

            // important: only save the lock state, not the step states, as we
            // have a race condition with async. rating (the /visit request may
            // be made while we're rating, and when we come back we would then
            // update the step id with a prior, incorrect step)
            this._dao.saveQuoteLockState( quote );
        }

        // if any have been deferred, instruct the client to request them
        // individually
        if ( Array.isArray( meta.deferred ) && ( meta.deferred.length > 0 ) )
        {
            var torate: string[] = [];

            meta.deferred.forEach( ( alias: string ) =>
            {
                actions.push( { action: 'indvRate', id: alias } );
                torate.push( alias );
            } );

            // we log that we're performing rating, so we should also log when
            // it is deferred (otherwise the logs will be rather confusing)
            this._logger.log( this._logger.PRIORITY_INFO,
                "'%s' rating deferred for quote #%s; will rate: %s",
                quote.getProgramId(),
                quote.getId(),
                torate.join( ',' )
            );
        }
    }


    /**
     * Send rating error to user and log
     *
     * @param request - user request to satisfy
     * @param quote   - problem quote
     * @param err     - error
     */
    private _sendRatingError(
        request: UserRequest,
        quote:   ServerSideQuote,
        err:     Error,
    ): void
    {
        // well that's no good
        this._logger.log( this._logger.PRIORITY_ERROR,
            "Rating for quote %d (program %s) failed: %s",
            quote.getId(),
            quote.getProgramId(),
            err.message + '\n-!' + ( err.stack || "" ).replace( /\n/g, '\n-!' )
        );

        this._server.sendError( request,
            'There was a problem during the rating process. Unable to ' +
            'continue. Please contact our support team for assistance.' +

            // show details for internal users
            ( ( request.getSession().isInternal() )
                ? '<br /><br />[Internal] ' + err.message + '<br /><br />' +
                    '<hr />' + ( err.stack || "" ).replace( /\n/g, '<br />' )
                : ''
            )
        );
    }


    /**
     * Retrieve the number of raters that are pending
     *
     * @param data Rating results
     */
    private _getRetryCount( data: RateResult ): number
    {
        const retry_pattern = /^(.+)__retry$/;

        return Object.keys( data )
            .filter( field =>
            {
                let value = Array.isArray( data[ field ] )

                    // In case the data are in a nested array
                    // e.g. data[ field ] === [ [ 0 ] ]
                    ? Array.prototype.concat.apply( [], data[ field ] )
                    : data[ field ];

                return field.match( retry_pattern ) && !!value[ 0 ];
            } )
            .length;
    }


    /**
     * Clear all pending retry attempts
     *
     * @param data Rating results
     */
    private _clearRetries( data: RateResult ): void
    {
        const retry_pattern = /^(.+)__retry$/;

        for ( let field in data )
        {
            if ( !field.match( retry_pattern ) )
            {
                continue;
            }

            // Reset the field to zero
            data[ field ] = [ 0 ];
        }

        data[ '__rate_pending' ] = [ 0 ];
    }


    /**
     * Process and save worksheet data from rating results
     *
     * @param qid  - quote id
     * @param data - rating result
     */
    private _processWorksheetData( qid: QuoteId, data: RateResult ): void
    {
        // TODO: this should be done earlier on, so that this is not necessary
        const wre = /^(.+)___worksheet$/;

        const worksheets: Record<string, WorksheetData> = {};

        // extract worksheets for each supplier
        for ( var field in data )
        {
            var match;
            if ( match = field.match( wre ) )
            {
                var name = match[ 1 ];

                worksheets[ name ] = data[ field ];
                delete data[ field ];
            }
        }

        this._dao.setWorksheets( qid, worksheets, ( err: NullableError ) =>
        {
            if ( err )
            {
                this._logger.log( this._logger.PRIORITY_ERROR,
                    "Failed to save rating worksheets for quote %d",
                    qid,
                    err.message + '\n-!' + ( err.stack || "" ).replace( /\n/g, '\n-!' )
                );
            }
        } );
    }


    /**
     * Get worksheet data
     *
     * @param quote    - quote from which to look up worksheet data
     * @param supplier - supplier name
     * @param index    - worksheet index
     */
    getWorksheet(
        quote:    ServerSideQuote,
        supplier: string,
        index:    PositiveInteger,
    ): Promise<WorksheetData>
    {
        var qid = quote.getId();

        return this._dao.getWorksheet( qid, supplier, index );
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
        data:    RateResult,
        classes: ClassificationData
    ): RateResult
    {
        // forceful cast because the below loop will copy everything
        const result = <RateResult>{};

        // clear class data
        for ( var key in data )
        {
            var mdata;

            // supplier___classes
            if ( mdata = key.match( /^(.*)___classes$/ ) )
            {
                classes[ mdata[ 1 ] ] = data[ key ];
                continue;
            }

            result[ key ] = data[ key ];
        }

        return result;
    }


    /**
     * Process retry logic
     *
     * @param program  - program used to perform rating
     * @param quote    - quote used for rating
     * @param data     - rating data returned
     *
     * @return an object with a retry flag, a timeout flag, and a pending count
     */
    private _processRetries(
        program: Program,
        quote:   ServerSideQuote,
        data:    RateResult
    ): Record<string, boolean|number>
    {
        // Gather determinant factors
        const pending_count  = this._getRetryCount( data );
        const retry_attempts = quote.getRetryAttempts();
        const step           = quote.getCurrentStepId();
        const is_rate_step   = ( ( program.rateSteps || [] )[ step ] === true );

        // Make determinations
        const max_attempts  = ( retry_attempts >= this.RETRY_MAX_ATTEMPTS );
        const has_pending   = ( pending_count > 0 );
        const retry_on_step = ( retry_attempts > 0 ) ? is_rate_step : true;

        return {
            pending_count: pending_count,
            timeout:       max_attempts,
            should_retry:  (
                has_pending &&
                !max_attempts &&
                retry_on_step
            ),
        }
    }
}
