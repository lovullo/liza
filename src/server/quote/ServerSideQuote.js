/**
 * Augments a quote with additional data for use by the quote server
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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

var Class     = require( 'easejs' ).Class,
    Quote     = require( '../../quote/Quote' ),
    BaseQuote = require( '../../quote/BaseQuote' );


module.exports = Class( 'ServerSideQuote' )
    .implement( Quote )
    .extend( BaseQuote,
{
    /**
     * Program version
     * @type {string}
     */
    'private _pver': '',

    /**
     * Credit score reference number
     * @type {number}
     */
    'private _creditScoreRef': 0,

    /**
     * Unix timestamp containing date of last premium calculation
     * @type {number}
     */
    'private _lastPremDate': 0,

    /**
     * Unix timestamp containing date of first premium calculation
     * @type {number}
     */
    'private _rated_date': 0,


    'public setProgramVersion': function( version )
    {
        this._pver = ''+( version );
        return this;
    },


    'public getProgramVersion': function()
    {
        return this._pver;
    },


    'public setCreditScoreRef': function( ref )
    {
        this._creditScoreRef = +ref;
        return this;
    },


    'public getCreditScoreRef': function()
    {
        return this._creditScoreRef;
    },


    /**
     * Set the date that the premium was calculated as a Unix timestamp
     *
     * @param {number} timestamp Unix timestamp representing premium date
     *
     * @return {Quote} self
     */
    'public setLastPremiumDate': function( timestamp )
    {
        this._lastPremDate = ( timestamp || 0 );
        return this;
    },


    /**
     * Set the timestamp of the first time quote was rated
     *
     * @param {number} timestamp Unix timestamp representing first rated date
     *
     * @return {Quote} self
     */
    'public setRatedDate': function( timestamp )
    {
        // do not overwrite date if it exists
        if ( this._rated_date === 0 )
        {
            this._rated_date = ( +timestamp || 0 );
        }

        return this;
    },


    /**
     * Retrieve the last time the premium was calculated
     *
     * @return {number} last calculated time or 0
     */
    'public getLastPremiumDate': function()
    {
        return ( this._lastPremDate || 0 );
    },


    /**
     * If the quote has been rated
     *
     * @return {boolean} has been rated
     */
    'public getRatedDate': function()
    {
        return this._rated_date;
    }
} );

