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

type RequestCallback = () => void;


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
    /**
     * Initialize rating service
     *
     * @param _logger        - logging system
     * @param _dao           - database connection
     * @param _server        - server actions
     * @param _rater_manager - rating manager
     */
    constructor(
        private readonly _logger:        PriorityLog,
        private readonly _dao:           ServerDao,
        private readonly _server:        Server,
        private readonly _rater_manager: ProcessManager,
    ) {}


    /**
     * TODO: Remove once traits subtypes are converted to TS
     *
     * This works around an easejs bug where prototype constructors are not
     * properly invoked.  Note that technically the constructor above is
     * invoked twice by easejs: once with no arguments, and again when
     * calling this method with the proper arguments.
     */
    __construct()
    {
        (<any>RatingService ).apply( this, arguments );
    }


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
    ): Promise<void>
    {
        // cmd represents a request for a single rater
        if ( !cmd && this._isQuoteValid( quote ) )
        {
            // send an empty reply (keeps what is currently in the bucket)
            this._server.sendResponse( request, quote, {
                data: {},
            }, [] );

            return Promise.resolve();
        }

        var program = quote.getProgram();

        return new Promise( ( resolve, reject ) =>
        {
            try
            {
                this._performRating( request, program, quote, cmd, resolve );
            }
            catch ( err )
            {
                this._sendRatingError( request, quote, program, err );
                reject( err );
            }
        } );
    }


    private _getProgramRater( program: Program, quote: ServerSideQuote )
    {
        var rater = this._rater_manager.byId( program.getId() );

        // if a rater could not be found, we can't do any rating
        if ( rater === null )
        {
            this._logger.log( this._logger.PRIORITY_ERROR,
                "Rating for quote %d (program %s) failed; missing module",
                quote.getId(),
                program.getId()
            );
        }

        return rater;
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
        var re_date = Math.round( ( ( new Date() ).getTime() / 1000 ) -
            ( 60 * 60 * 24 * 30 )
        );

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


    private _performRating(
        request: UserRequest,
        program: Program,
        quote:   ServerSideQuote,
        indv:    string,
        c:       RequestCallback,
    )
    {
        var rater = this._getProgramRater( program, quote );

        if ( !rater )
        {
            this._server.sendError( request, 'Unable to perform rating.' );
            c();
        }

        this._logger.log( this._logger.PRIORITY_INFO,
            "Performing '%s' rating for quote #%s",
            quote.getProgramId(),
            quote.getId()
        );

        rater.rate( quote, request.getSession(), indv,
            ( rate_data: RateResult, actions: ClientActions ) =>
            {
                actions = actions || [];

                this.postProcessRaterData(
                    request, rate_data, actions, program, quote
                );

                const class_dest = {};

                const cleaned = this._cleanRateData(
                    rate_data,
                    class_dest
                );

                // TODO: move me during refactoring
                this._dao.saveQuoteClasses(
                    quote, class_dest, () => {}, () => {}
                );

                // save all data server-side (important: do after
                // post-processing); async
                this._saveRatingData( quote, rate_data, indv, function()
                {
                    // we're done
                    c();
                } );

                // no need to wait for the save; send the response
                this._server.sendResponse( request, quote, {
                    data:             cleaned,
                    initialRatedDate: quote.getRatedDate(),
                    lastRatedDate:    quote.getLastPremiumDate()
                }, actions );
            },
            ( message: string ) =>
            {
                this._sendRatingError( request, quote, program,
                    Error( message )
                );

                c();
            }
        );
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
            var cur_date = <UnixTimestamp>Math.round(
                ( new Date() ).getTime() / 1000
            );

            quote.setLastPremiumDate( cur_date );
            quote.setRatedDate( cur_date );

            // save the last prem status (we pass an empty object as the save
            // data argument to ensure that we do not save the actual bucket
            // data, which may cause a race condition with the below merge call)
            this._dao.saveQuote( quote, c, c, {
                ratedata: data,
            } );
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
        this._dao.mergeBucket( quote, data, () => {}, () => {} );
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
            this._dao.saveQuoteLockState( quote, () => {}, () => {} );
        }

        // if any have been deferred, instruct the client to request them
        // individually
        if ( Array.isArray( meta.deferred ) && ( meta.deferred.length > 0 ) )
        {
            var torate: string[] = [];

            meta.deferred.forEach( ( alias: string ) =>
            {
                actions.push( { action: 'indvRate', after: alias } );
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
        program: Program,
        err:     Error,
    ): void
    {
        // well that's no good
        this._logger.log( this._logger.PRIORITY_ERROR,
            "Rating for quote %d (program %s) failed: %s",
            quote.getId(),
            program.getId(),
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

        this._dao.setWorksheets( qid, worksheets, ( err: Error | null ) =>
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
     * Serve worksheet data to user
     *
     * @param request  - user request to satisfy
     * @param quote    - quote from which to look up worksheet data
     * @param supplier - supplier name
     * @param index    - worksheet index
     */
    serveWorksheet(
        request:  UserRequest,
        quote:    ServerSideQuote,
        supplier: string,
        index:    PositiveInteger,
    ): void
    {
        var qid = quote.getId();

        this._dao.getWorksheet( qid, supplier, index, data =>
        {
            this._server.sendResponse( request, quote, {
                data: data
            } );
        } );
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
}
