/**
 * Kickback event handler
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
module.exports = Class( 'KickbackEventHandler' )
    .implement( EventHandler )
    .extend(
{
    /**
     * Client that will perform requests on this handler
     * @type {Client}
     */
    'private _client': null,


    /**
     * Initializes with client that will delegate the event
     *
     * @param {Client} client client object
     */
    __construct: function( client )
    {
        this._client = client;
    },


    /**
     * Handles kick-back
     *
     * @param {string} type event id; ignored
     *
     * @param {function(*,Object)} continuation to invoke on completion
     *
     * @return {KickbackEventHandler} self
     */
    'public handle': function( type, c, data )
    {
        var step_id = +data.stepId,
            quote   = this._client.getQuote(),
            nav     = this._client.nav,
            ui      = this._client.getUi();

        if ( quote.getTopVisitedStepId() > step_id )
        {
            quote.setTopVisitedStepId( step_id );
            nav.setTopVisitedStepId( step_id );

            if ( quote.getCurrentStepId() > step_id )
            {
                nav.navigateToStep( step_id );
            }

            ui.redrawNav();
        }

        c();
    }
} );
