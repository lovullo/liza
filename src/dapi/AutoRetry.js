/**
 * DataApi auto-retry requests on specified failure
 *
 *  Copyright (C) 2015 LoVullo Associates, Inc.
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

var Trait   = require( 'easejs' ).Trait,
    DataApi = require( './DataApi' );


/**
 * Automatically retries requests while satisfying a given predicate
 *
 * It is important to distinguish between the concept of a request failure
 * and a retry predicate: the former represents a problem with the request,
 * whereas the latter indicates that a retry should be performed, but may
 * not necessarily imply a request failure.
 */
module.exports = Trait( 'AutoRetry' )
    .implement( DataApi )
    .extend(
{
    /**
     * Predicate function determining whether a retry is needed
     * @var {function(?Error,*): boolean}
     */
    'private _pred': '',

    /**
     * Maximum number of tries (including initial request)
     * @var {number}
     */
    'private _tries': 0,

    /**
     * Function to be passed a continuation to introduce a delay between
     * requests
     *
     * @var {function(number,function(),function())} delay
     */
    'private _delay': null,


    /**
     * Initialize auto-retry
     *
     * If TRIES is negative, then requests will continue indefinitely while
     * the retry predicate is true, or is aborted by DELAY.  If TRIES is 0,
     * then no requests will be performed.
     *
     * If DELAY is a function, then it invoked with a retry continuation
     * before each retry, the number of tries remaining, and a failure
     * continuation that may be used to abort the process at an arbitrary
     * time.
     *
     * @param {function(?Error,*): boolean}   pred  predicate determining if
     *                                              a retry is needed
     * @param {number}                        tries maximum number of tries,
     *                                              including the initial
     *                                              request
     *
     * @param {?function(number,function(),function())} delay
     *                                              an optional function
     *                                              accepting a continuation
     *                                              to continue with the next
     *                                              request
     *
    * @return {undefined}
    */
    __mixin: function( pred, tries, delay )
    {
        if ( typeof pred !== 'function' )
        {
            throw TypeError( 'Predicate must be a function' );
        }
        if ( delay && ( typeof delay !== 'function' ) )
        {
            throw TypeError( "Delay must be a function" );
        }

        this._pred  = pred;
        this._tries = +tries;
        this._delay = delay || function( _, c, __ ) { c(); };
    },


    /**
     * Perform an asynchronous request and invoke CALLBACK with the
     * reply
     *
     * In the special case that the number of tries is set to zero, CALLBACK
     * will be immediately invoked with a null error and result (but not
     * necessarily asynchronously---that remains undefined).
     *
     * Otherwise, requests will continue to be re-issued until either the
     * retry predicate fails or the number of retries are exhausted,
     * whichever comes first.  Once the retries are exhausted, the error and
     * output data from the final request are returned.
     *
     * If the number of tries is negative, then requests will be performed
     * indefinitely while the retry predicate is met; the delay function (as
     * provided via the constructor) may be used to abort in this case.
     *
     * @param {string}             input    binary data to transmit
     * @param {function(?Error,*)} callback continuation upon reply
     *
     * @return {DataApi} self
     */
    'abstract override public request': function( input, callback )
    {
        this._try( input, callback, this._tries );

        return this;
    },


    /**
     * Recursively perform request until retry predicate failure or try
     * count exhaustion
     *
     * For more information, see `#request'.
     *
     * @param {string}             input    binary data to transmit
     * @param {function(?Error,*)} callback continuation upon reply
     * @param {number}             n        number of retries remaining
     *
     * @return {undefined}
     */
    'private _try': function( input, callback, n )
    {
        var _self = this;

        // the special case of 0 retries still invokes the callback, but has
        // no data to return
        if ( n === 0 )
        {
            callback( null, null );
            return;
        }

        // super ES3 compatibility (for now)
        this.request['super'].call( this, input, function( err, output )
        {
            var complete = function()
            {
                callback( err, output );
            };

            // predicate determines whether a retry is necessary
            if ( !!_self._pred( err, output ) === false )
            {
                return complete();
            }

            // note that we intentionally do not want to check <= 1, so that
            // we can proceed indefinitely (JavaScript does not wrap on overflow)
            if ( n === 1 )
            {
                return complete();
            }

            _self._delay(
                ( n - 1 ),
                function()
                {
                    _self._try( input, callback, ( n - 1 ) );
                },
                complete
            );
        } );
    }
} );
