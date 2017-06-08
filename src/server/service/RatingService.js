/**
 * Rating service
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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

var Class  = require( 'easejs' ).Class;


/**
 * XXX: Half-assed, quick refactoring to extract from Server class; this is not
 * yet complete!
 *
 * TODO: Logging should be implemented by observers
 */
module.exports = Class( 'RatingService',
{
    _logger: null,

    _dao: null,

    _server: null,

    _raters: null,


    __construct: function( logger, dao, server, raters )
    {
        this._logger = logger;
        this._dao    = dao;
        this._server = server;
        this._raters = raters;
    },


    /**
     * Sends rates to the client
     *
     * Note that the continuation will be called after all data saving is
     * complete; the request will be sent back to the client before then.
     *
     * @param {UserRequest}  request  user request to satisfy
     * @param {UserResponse} response pending response
     * @param {Quote}        quote    quote to export
     * @param {string}       cmd      applicable of command request
     * @param {Function}     callback continuation after saving is complete
     *
     * @return Server self to allow for method chaining
     */
    'public request': function( request, response, quote, cmd, callback )
    {
        // cmd represents a request for a single rater
        if ( !cmd && this._isQuoteValid( quote ) )
        {
            // send an empty reply (keeps what is currently in the bucket)
            this._server.sendResponse( request, quote, {
                data: {},
            }, [] );

            callback();
            return this;
        }

        var program = quote.getProgram();

        try
        {
            this._performRating( request, program, quote, cmd, callback );
        }
        catch ( err )
        {
            this._sendRatingError( request, quote, program, err );
            callback();
        }

        return this;
    },


    _getProgramRater: function( program, quote )
    {
        var rater = this._raters.byId( program.getId() );

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
    },


    _isQuoteValid: function( quote )
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
    },


    _performRating: function( request, program, quote, indv, c )
    {
        var _self = this;

        var rater = this._getProgramRater( program );
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
            function( rate_data, actions )
            {
                actions = actions || [];

                _self._postProcessRaterData(
                    rate_data, actions, program, quote
                );

                var class_dest = {};

                rate_data = _self._cleanRateData(
                    rate_data,
                    class_dest
                );

                // TODO: move me during refactoring
                _self._dao.saveQuoteClasses( quote, class_dest );


                // save all data server-side (important: do after
                // post-processing); async
                _self._saveRatingData( quote, rate_data, indv, function()
                {
                    // we're done
                    c();
                } );

                // no need to wait for the save; send the response
                _self._server.sendResponse( request, quote, {
                    data: rate_data
                }, actions );
            },
            function( message )
            {
                _self._sendRatingError( request, quote, program,
                    Error( message )
                );

                c();
            }
        );
    },


    /**
     * Saves rating data
     *
     * Data will be merged with existing bucket data and saved. The idea behind
     * this is to allow us to reference the data (e.g. for reporting) even if
     * the client does not save it.
     *
     * @param {Quote}  quote quote to save data to
     * @param {Object} data  rating data
     *
     * @return {undefined}
     */
    _saveRatingData: function( quote, data, indv, c )
    {
        // only update the last premium calc date on the initial request
        if ( !indv )
        {
            var cur_date = Math.round(
                ( new Date() ).getTime() / 1000
            );

            quote.setLastPremiumDate( cur_date );
            quote.setRatedDate( cur_date );

            function done()
            {
                c();
            }

            // save the last prem status (we pass an empty object as the save
            // data argument to ensure that we do not save the actual bucket
            // data, which may cause a race condition with the below merge call)
            this._dao.saveQuote( quote, done, done, {} );
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
    },


    /**
     * Process rater data returned from a rater
     *
     * @param {Object}  data    rating data returned
     * @param {Array}   actions actions to send to client
     * @param {Program} program program used to perform rating
     * @param {Quote}   quote   quote used for rating
     *
     * @return {undefined}
     */
    _postProcessRaterData: function( data, actions, program, quote )
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
            this._dao.saveQuoteLockState( quote );
        }

        // if any have been deferred, instruct the client to request them
        // individually
        if ( Array.isArray( meta.deferred ) && ( meta.deferred.length > 0 ) )
        {
            var torate = [];

            meta.deferred.forEach( function( alias )
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
    },


    _sendRatingError: function( request, quote, program, err )
    {
        // well that's no good
        this._logger.log( this._logger.PRIORITY_ERROR,
            "Rating for quote %d (program %s) failed: %s",
            quote.getId(),
            program.getId(),
            err.message + '\n-!' + err.stack.replace( /\n/g, '\n-!' )
        );

        this._server.sendError( request,
            'There was a problem during the rating process. Unable to ' +
            'continue. Please contact RT Specialty / LoVullo for assistance.' +

            // show details for internal users
            ( ( request.getSession().isInternal() )
                ? '<br /><br />[Internal] ' + err.message + '<br /><br />' +
                    '<hr />' + err.stack.replace( /\n/g, '<br />' )
                : ''
            )
        );
    },


    _processWorksheetData: function( qid, data )
    {
        // TODO: this should be done earlier on, so that this is not necessary
        var wre        = /^(.+)___worksheet$/,
            worksheets = {};

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

        var _self = this;
        this._dao.setWorksheets( qid, worksheets, function( err )
        {
            if ( err )
            {
                _self._logger.log( this._logger.PRIORITY_ERROR,
                    "Failed to save rating worksheets for quote %d",
                    quote.getId(),
                    err.message + '\n-!' + err.stack.replace( /\n/g, '\n-!' )
                );
            }
        } );
    },


    serveWorksheet: function( request, quote, supplier, index )
    {
        var qid   = quote.getId(),
            _self = this;

        this._dao.getWorksheet( qid, supplier, index, function( data )
        {
            _self._server.sendResponse( request, quote, {
                data: data
            } );
        } );
    },


    /**
     * Prepares rate data to be sent back to the client
     *
     * There are certain data saved server-side that there is no use serving to
     * the client.
     *
     * @param {Object} data rate data
     *
     * @return {Object} modified rate data
     */
    'private _cleanRateData': function( data, classes )
    {
        classes = classes || {};

        var result = {};

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
    },
} );

