/**
 * Notification on all submit
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
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

'use strict';

const { Trait }       = require( 'easejs' );
const DslRaterContext = require( '../rater/DslRaterContext' )
const RatingService   = require( './RatingService' );


/**
 * Triggers DataApi when no results are available
 *
 * This information is currently stored in `__prem_avail_count`.  In the
 * future, it may be worth accepting a parameter to configure this at
 * runtime.
 *
 * Notification status will persist using the provided DAO.  The next time
 * such a notification is requested, it will only occur if the flag is not
 * set.  The flag is not set in the event of an error (determined by the
 * DataApi; usually an HTTP error).
 */
module.exports = Trait( 'RatingServiceSubmitNotify' )
    .extend( RatingService,
{
    /**
     * Function returning DataApi to trigger
     * @type {Function(UserSession):DataApi}
     */
    'private _dapif': null,

    /**
     * Data store for notification flag
     * @type {ServerDao}
     */
    'private _notifyDao': null,


    /**
     * Initialize mixin with DataApi to trigger
     *
     * @param {Function(UserSession):DataApi} dapif Function producing DataApi
     * @param {ServerDao}                     dao   store for notification flag
     */
    __mixin( dapif, dao )
    {
        this._dapif     = dapif;
        this._notifyDao = dao;
    },


    /**
     * Trigger previously provided DataApi when no results are available
     *
     * Result count is determined by DATA.__prem_avail_count.  If the
     * notification is successful (determined by the DataApi), then a
     * flag will be set preventing the request from being trigerred for
     * subsequent rating data.
     *
     * @param {UserRequest} request user request
     * @param {Object}      data    rating data returned
     * @param {Array}       actions actions to send to client
     * @param {Program}     program program used to perform rating
     * @param {Quote}       quote   quote used for rating
     *
     * @return {undefined}
     */
    'override protected postProcessRaterData'(
        request, data, actions, program, quote
    )
    {
        const quote_id = quote.getId();
        const avail    = ( data.__prem_avail_count || [ 0 ] )[ 0 ];

        if ( avail === 0 )
        {
            this._maybeNotify( quote_id, request );
        }

        this.__super( request, data, actions, program, quote );
    },


    /**
     * Perform notification if flag has not been set
     *
     * See #postProcessRaterData for more information.
     *
     * @param {number}      quote_id effective quote/document id
     * @param {UserRequest} request  user request
     *
     * @return {undefined}
     */
    'private _maybeNotify'( quote_id, request )
    {
        this._getNotifyState( quote_id, notified =>
        {
            if ( notified === true )
            {
                return;
            }

            // make the request, only setting the notification flag if
            // it is successful
            this._dapif( request )
                .request( { quote_id: quote_id }, err =>
                {
                    err || this._setNotified( quote_id );
                } );
        } );
    },


    /**
     * Get value of notification flag
     *
     * @param {number}            quote_id id of quote
     * @param {function(boolean)} callback callback to call when complete
     *
     * @return {undefined}
     */
    'private _getNotifyState'( quote_id, callback )
    {
        this._notifyDao.getDocumentField(
            quote_id,
            'submitNotified',
            ( err, value ) => callback( value )
        );
    },


    /**
     * Set notification flag
     *
     * @param {number} quote_id id of quote
     *
     * @return {undefined}
     */
    'private _setNotified'( quote_id )
    {
        this._notifyDao.setDocumentField(
            quote_id, 'submitNotified', true
        );
    },
} );
