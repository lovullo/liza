/**
 * Rate event handler
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

var Class        = require( 'easejs' ).Class,
    EventHandler = require( './EventHandler' );


/**
 * Performs rate requests
 */
module.exports = Class( 'RateEventHandler' )
    .implement( EventHandler )
    .extend(
{
    /**
     * Number of milliseconds to delay rating progress dialog display
     * @type {number}
     */
    'private const _DIALOG_DELAY_MS': 500,

    /**
     * Client that will perform requests on this handler
     * @type {Client}
     */
    'private _client': null,

    /**
     * Data proxy used for requests
     * @type {ClientDataProxy}
     */
    'private _dataProxy': null,


    /**
     * Initializes event handler with a data proxy that may be used to
     * communicate with a remote server for rate requests
     *
     * @param {Client}          client client object
     * @param {ClientDataProxy} data   proxy used for rate requests
     */
    __construct: function( client, data_proxy )
    {
        this._client    = client;
        this._dataProxy = data_proxy;
    },


    /**
     * Handle rating request and performs rating
     *
     * If the quote is locked, no rating request will be made and the
     * continuation will be immediately invoked with no error and null rate
     * data.
     *
     * If the client is in the process of saving, then rating will be deferred
     * until all save operations have completed, after which rating will proceed
     * as normal.
     *
     * After rating is complete, the coninuation will be invoked. If there is an
     * error, it will be provided as the first argument and the data argument
     * will be null. Otherwise, the error argument will be null and the data
     * argument will contain the result of the rate call. Note that the quote
     * will be automatically filled with the return data.
     *
     * @param {string} type   event id; ignored
     *
     * @param {function(*,Object)} continuation to invoke on completion
     *
     * @return {RateEventHandler} self
     */
    'public handle': function( type, c, data )
    {
        var _self = this,
            quote = this._client.getQuote(),
            qstep = quote.getCurrentStepId();

        // do not perform rating if quote is locked; use existing rates, if
        // available (stored in bucket)
        if ( quote.isLocked()
            || ( qstep <= quote.getExplicitLockStep() )
        )
        {
            // no error, no data.
            c( null, null );
            return;
        }

        // if we're in the process of saving, then wait until all saves are
        // complete before continuing
        if ( this._client.isSaving() )
        {
            // defer rating until after saving is complete
            this._client.once( 'postSaveAll', function()
            {
                dorate();
            } );

            return;
        }

        function dorate()
        {
            _self._performRating( quote, c, data.indv, data.stepId );
        }

        // perform rating immediately
        dorate();

        return this;
    },


    'private _performRating': function( quote, c, indv, dest_step_id )
    {
        var _self = this;

        // queue display of "rating in progress" dialog
        var dialog_close = this.queueProgressDialog(
            this.__self.$( '_DIALOG_DELAY_MS' )
        );

        // grab the rates from the server for the already posted quote data
        this._dataProxy.get( this._genRateUrl( quote, indv ),
            function( response, err )
            {
                var data = ( response.content.data || {} );

                if ( err )
                {
                    // error; do not provide rate data
                    c( err, null );
                    return;
                }

                // fill the bucket with the response data and save (client-side
                // save only; no transport is specified)
                quote.refreshData( data );

                // let subtypes handle additional processing
                _self.postRate( err, data, _self._client, quote );

                // close rating dialog after rates are displayed
                dialog_close();

                // invalidate the step to force emptying of the bucket, ensuring
                // that data is updated on the screen when it's re-rated (will
                // be undefined if the step hasn't been loaded yet, in which
                // case it doesn't need to be invalidated)
                var stepui = _self._client.getUi().getStep( dest_step_id );
                if ( stepui !== undefined )
                {
                    stepui.invalidate();
                }

                c( null, response.content.data );
            }
        );
    },


    'virtual protected postRate': function( err, data, client, quote )
    {
        // reserved for subtypes
    },


    /**
     * Generate the rate request URL
     *
     * @param {Quote}   quote to get premium for
     * @param {string}  indv  optional individual supplier to request
     *
     * @return {string} request URL
     */
    'private _genRateUrl': function( quote, indv )
    {
        return quote.getId() + '/rate' +
            ( ( indv )
                ? '/' + indv
                : ''
            );
    },


    /**
     * Queue "rating in progress" dialog for display after a short period of
     * time
     *
     * The dialog may be closed/cancelled by invoking the returned function.
     *
     * @param {number} after_ms display dialog after this number of millisecs
     *
     * @return {function()} function to close dialog
     */
    'virtual protected queueProgressDialog': function( after_ms )
    {
        var _self   = this,
            $dialog = null;

        // only display the dialog if the rating time exceeds 500ms
        var timeout = setTimeout( function()
        {
            $dialog = _self._client.uiDialog.showRatingInProgressDialog();
        }, after_ms );

        // return a function that may be used to close the dialog
        return function()
        {
            // prevent the dialog from being displayed and close it if it has
            // already been displayed
            clearTimeout( timeout );
            $dialog && $dialog.close();
        }
    }
} );
