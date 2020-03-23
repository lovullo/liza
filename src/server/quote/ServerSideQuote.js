/**
 * Augments a quote with additional data for use by the quote server
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
     * Unix timestamp containing date of first premium calculation
     * @type {number}
     */
    'private _rated_date': 0,

    /**
     * Metabucket
     * @type {Bucket}
     */
    'private _metabucket': null,

    /**
     * Rating Data Bucket
     * @type {Bucket}
     */
    'private _rate_bucket': null,

    /**
     * The number of rate retries that have been attempted
     * @type {number}
     */
    'private _retry_attempts': 0,


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
     * If the quote has been rated
     *
     * @return {boolean} has been rated
     */
    'public getRatedDate': function()
    {
        return this._rated_date;
    },


    /**
     * Metadata bucket
     *
     * @return {Bucket}
     */
    'public getMetabucket': function()
    {
        return this._metabucket;
    },


    /**
     * Set metadata bucket
     *
     * @return {ServerSideQuote} self
     */
    'public setMetabucket': function( metabucket )
    {
        this._metabucket = metabucket;
    },


    /**
     * Set metabucket data
     *
     * @param {Object} data key/value data
     *
     * @return {ServerSideQuote} self
     */
    'public setMetadata': function( data )
    {
        if ( !this._metabucket )
        {
            throw Error( "No metabucket available for #setMetadata" );
        }

        this._metabucket.setValues( data );
        return this;
    },


    /**
     * Get the last time metadata was updated
     *
     * @return {number} self
     */
    'public getMetaUpdatedDate': function()
    {
        if ( !this._metabucket )
        {
            throw Error( "No metabucket available for #getMetaUpdatedDate" );
        }

        const data = this._metabucket.getDataByName(
            'liza_timestamp_last_meta_update'
        );

        if( data && Array.isArray( data ) && data.length > 0 )
        {
            return +data[ 0 ];
        }

        return 0;
    },


    /**
     * Set rating bucket
     *
     * @param {Bucket} bucket the rate bucket to set
     */
    'public setRateBucket': function( bucket )
    {
        this._rate_bucket = bucket;

        return this;
    },


    /**
     * Get rating bucket
     *
     * @return {Bucket}
     */
    'public getRateBucket': function()
    {
        return this._rate_bucket;
    },


    /**
     * Set rating data
     *
     * @param {Object.<string,Array>} data rating data
     */
    'public setRatingData': function( data )
    {
        if ( !this._rate_bucket )
        {
            throw Error( "No rating bucket available for #setRatingData" );
        }

        this._rate_bucket.setValues( data );

        return this;
    },


    /**
     * Get rating data
     *
     * @return {Object.<string,Array>} rating data
     */
    'public getRatingData': function()
    {
        if ( !this._rate_bucket )
        {
            throw Error( "No rating bucket available for #setRatingData" );
        }

        return this._rate_bucket.getData();
    },


    /**
     * Set the number of retries attempted
     *
     * @return {ServerSideQuote} self
     */
    'public setRetryAttempts': function( attempts )
    {
        this._retry_attempts = attempts;

        return this;
    },


    /**
     * Get the number of retries attempted
     *
     * @return {number} the number of attempts that have been made
     */
    'public getRetryAttempts': function()
    {
        return this._retry_attempts;
    },


    /**
     * Increments the number of retries attempted
     *
     * @return {ServerSideQuote} self
     */
    'public retryAttempted': function()
    {
        this._retry_attempts++;

        return this;
    },
} );

