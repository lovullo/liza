/**
 * Field validator
 *
 *  Copyright (C) 2016 LoVullo Associates, Inc.
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
 *
 * @needsLove
 *   - Liberate QuoteClient
 * @end needsLove
 */

var Class        = require( 'easejs' ).Class,
    QuoteClient  = require( 'program/QuoteClient' ),
    EventEmitter = require( 'events' ).EventEmitter;


/**
 * Passively monitors quote data, validating and formatting any fields that are
 * altered for the given QuoteClient
 *
 * In the event of a validation failure, the data will not be added to the
 * bucket and the caller may be notified via a failure callback. This way, you
 * may forget that the monitoring is even occuring unless there is a problem to
 * handle.
 */
module.exports = Class( 'ClientFieldValidator' )
    .extend( EventEmitter,
{
    /**
     * Validation/formatting object
     * @type {BucketDataValidator}
     */
    'private _validator': null,

    /**
     * Past validation failures
     * @type {Object}
     */
    'private _past_fail': {},


    /**
     * Initializes monitor with a validator
     *
     * @param {BucketDataValidator} validator validation object
     */
    __construct: function( validator )
    {
        this._validator = validator;
    },


    /**
     * Monitor the given QUOTE_CLIENT for field changes and trigger validation     *
     *
     * @param {QuoteClient} quote_client quote client to validate against
     *
     * @param {function(Object)} failure_callback  function to call with errors
     * @param {function(Object)} fix_callback      function to call with indexes
     *                                             of fields that have previously
     *                                             failed, but have since been
     *                                             resolved
     *
     * @return {ClientFieldValidator} self
     */
    'public monitor': function( quote_client, failure_callback, fix_callback )
    {
        var _self = this;

        // catch problems *before* the data is staged, altering the data
        // directly if need be
        quote_client.on( 'preDataUpdate', function( data )
        {
            _self.validate( data, failure_callback, fix_callback );
        } );

        return this;
    },


    /**
     * Perform field validation
     *
     * The failure callback will be called only if there are errors to report,
     * in which case the object will contain each field that has errors with an
     * array of their failed indexes.
     *
     * This validator will keep track of failures and can report on when the
     * failure has been resolved. This feature is useful for clearing any
     * error indicators.
     *
     * @param {Object}           data              bucket data diff
     * @param {function(Object)} failure_callback  function to call with errors
     * @param {function(Object)} fix_callback      function to call with indexes
     *                                             of fields that have previously
     *                                             failed, but have since been
     *                                             resolved
     *
     * @return {ClientFieldValidator} self
     */
    'public validate': function( data, failure_callback, fix_callback )
    {
        // minor overhead for default definition and invocation (likely to be
        // optimized away by most modern engines) for the sake of code clarity
        // further down
        failure_callback = failure_callback || function() {};
        fix_callback     = fix_callback     || function() {};

        var failures = {};

        // assert the correctness of the data, formatting it in-place for
        // storage in the bucket
        try
        {
            this._validator.validate( data, function( name, value, i, e )
            {
                // set failures to undefined, which will cause the staging
                // bucket to ignore the value entirely (we don't want crap
                // data to be staged)
                data[ name ][ i ] = undefined;

                // these failures will be returned (return as an object
                // rather than an array, even though our indexes are
                // numeric, to make debugging easier, since some values may
                // be undefined)
                ( failures[ name ] = failures[ name ] || {} )[ i ] = value;
            }, true );
        }
        catch ( e )
        {
            this.emit( 'error', e );
        }

        // allow others to add to the list of failures if needed
        this.emit( 'validate', data, failures );

        var fixed = this._detectFixes( this._past_fail, data, failures );

        // quick pre-ES5 means of detecting object keys
        var has_fail = false;
        for ( var _ in failures )
        {
            has_fail = true;
            break;
        }

        // it's important to do this *after* retrieving the fixed indexes,
        // but we should do it *before* calling the callbacks just in case
        // they themselves trigger the preDataUpdate event
        this._mergeFailures( this._past_fail, failures );

        // if we have failures, notify the caller via the callback so that
        // they do not have to loop through each field to determine what
        // failed based on their undefined values
        if ( has_fail )
        {
            failure_callback( failures );
        }

        // will be null if no fixes have been made
        if ( fixed !== null )
        {
            fix_callback( fixed, this._hasFailures( this._past_fail ) );
        }

        return this;
    },


    /**
     * Detects fixes based on previous failures
     *
     * This method will also clear fixed failures from the past failures object
     * by directly modifying it (for performance reasons).
     *
     * Note that this does not entirely remove the field from the past failures
     * object; this is because the memory consumption is negligable when
     * compared with the rest of the software and it would only muddy up the
     * code (counting the number of checks vs the number of fixes). Cleanup is
     * handled by _hasFailures().
     *
     * @param {Object} past     past failures to merge with
     * @param {Object} data     validated data
     * @param {Object} failures new failures
     *
     * @return {!Object} fixed list of fixed indexes for each fixed field
     */
    'private _detectFixes': function( past, data, failures )
    {
        var fixed     = {},
            has_fixed = false;

        for ( var name in past )
        {
            // we're only interested in detecting fixes on the data that has
            // been set
            if ( !( data[ name ] ) )
            {
                continue;
            }

            var field     = data[ name ],
                past_fail = past[ name ],
                fail      = failures[ name ];

            // we must check each individual index because it is possible that
            // not every index was modified or fixed (we must loop through like
            // this because this is treated as a hash table, not an array)
            for ( var i in past_fail )
            {
                // to be marked as fixed, there must both me no failure and
                // there must be data for this index for the field in question
                // (if the field wasn't touched, then of course there's no
                // failure!)
                if ( ( fail === undefined )
                    || ( !( fail[ i ] ) && ( field[ i ] !== undefined ) )
                )
                {
                    // looks like it has been resolved
                    ( fixed[ name ] = fixed[ name ] || {} )[ i ] =
                        data[ name ][ i ];

                    has_fixed = true;

                    delete past_fail[ i ];
                }
            }
        }

        return ( has_fixed )
            ? fixed
            : null;
    },


    /**
     * Determine whether or not there are additional failures that must be fixed
     *
     * This runs fastest if there are failures or if there are no failures and
     * the object is entriely clean. Will clean up fixed fields as it goes,
     * speeding up future runs. Will return true on the first failure it
     * encounters, but in order to determine if there are no failures, it must
     * loop through all past failures (unless they have bene cleaned).
     *
     * Assuming a failure, this will run in *at best* O(2) time  (check first
     * field, check first field index). If it must check a few fields, it will
     * run in O(n + 1) time, where n is the number of fields until the first
     * failure, yielding O(2) on subsequent calls assuming no changes in past
     * failures. Assuming no failures and a clean object, O(1). Worst case is
     * O(n). I'm not going to bother working out the average run time.
     *
     * Essentially --- it's not that bad.
     *
     * @param {Object} past past failures cache
     *
     * @return {boolean} true if errors exist, otherwise false
     */
    'private _hasFailures': function( past )
    {
        for ( var field in past )
        {
            for ( var i in past[ field ] )
            {
                return true;
            }

            // clean up as we go
            delete past[ field ];
        }

        return false;
    },


    /**
     * Merges a new set of failures into the past failures table
     *
     * This will merge each individual index of each field. Note that it is not
     * responsible for clearing failures that are no longer present.
     *
     * @param {Object} past     past failures to merge with
     * @param {Object} failures new failures
     *
     * @return {undefined}
     */
    'private _mergeFailures': function( past, failures )
    {
        for ( var name in failures )
        {
            var cur = ( past[ name ] = past[ name ] || [] );

            // copy each failure into the past failures table
            for ( var i in failures[ name ] )
            {
                cur[ i ] = true;
            }
        }
    }
} );
