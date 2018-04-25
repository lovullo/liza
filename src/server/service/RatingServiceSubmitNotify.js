/**
 * Notification on all submit
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
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
 */
module.exports = Trait( 'RatingServiceSubmitNotify' )
    .extend( RatingService,
{
    /**
     * DataApi to trigger
     * @type {DataApi}
     */
    'private _dapi': null,


    /**
     * Initialize mixin with DataApi to trigger
     *
     * @param {DataApi} dapi DataApi to trigger
     */
    __mixin( dapi )
    {
        this._dapi = dapi;
    },


    /**
     * Trigger previously provided DataApi when no results are available
     *
     * Result count is determined by DATA.__prem_avail_count.
     *
     * @param {Object}  data    rating data returned
     * @param {Array}   actions actions to send to client
     * @param {Program} program program used to perform rating
     * @param {Quote}   quote   quote used for rating
     *
     * @return {undefined}
     */
    'override protected postProcessRaterData'( data, actions, program, quote )
    {
        const quote_id = quote.getId();
        const avail    = ( data.__prem_avail_count || [ 0 ] )[ 0 ];

        if ( avail === 0 )
        {
            this._dapi.request( { quote_id: quote_id }, () => {} );
        }

        this.__super( data, actions, program, quote );
    },
} );
