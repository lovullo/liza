/**
 * Invidiual rate request event handler
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

var Class            = require( 'easejs' ).Class,
    RateEventHandler = require( './RateEventHandler' );


/**
 * Performs rate requests
 */
module.exports = Class( 'IndvRateEventHandler' )
    .extend( RateEventHandler,
{
    'override protected postRate': function( err, data, client, quote )
    {
        if ( err )
        {
            var inelig = {};
            inelig[ action.id + '_ineligible' ] = 'Error calculating premium.';

            // uh oh. notify the user that there was a problem.
            quote.setData( inelig ).save();
        }

        // we must force a screen update (TODO: make this unnecessary)
        client.getUi().getCurrentStep().emptyBucket();
    },


    'override protected queueProgressDialog': function( after_ms )
    {
        // no dialog.
        return function() {};
    }
} );
