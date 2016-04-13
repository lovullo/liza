/**
 * Field validity monitor
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
 */

var Class        = require( 'easejs' ).Class,
    EventEmitter = require( 'events' ).EventEmitter;


/**
 * Monitor field state and emit fix/failure events
 */
module.exports = Class( 'ValidStateMonitor' )
    .extend( EventEmitter,
{
    /**
     * Past validation failures
     * @type {Object}
     */
    'private _failures': {},


    /**
     * Mark fields as updated and detect failures and fixes
     *
     * The field data DATA should be a key-value store with an array as the
     * value for each key.  If the data are not present, then it is assumed
     * to have been left unchanged, and will not contribute to a
     * fix.  Otherwise, any field in FAILURES but not in DATA will count as
     * a fix.
     *
     * FAILURES should follow the same structure as DATA.  Indexes should
     * omitted from the value if they are not failures.
     *
     * @param {Object} data     key-value field data
     * @param {Object} failures key-value field errors
     *
     * @return {ValidStateMonitor} self
     */
    'public update': function( data, failures )
    {
        var fixed = this.detectFixes( data, this._failures, failures );

        this.mergeFailures( this._failures, failures );

        if ( this.hasFailures() )
        {
            this.emit( 'failure', this._failures );
        }

        if ( fixed !== null )
        {
            this.emit( 'fix', fixed );
        }

        return this;
    },


    /**
     * Retrieve current validation errors
     *
     * @return {Object} key-value object where key is field name and
     *                  value is an array with each failure index and
     *                  the value that caused the failure
     */
    'public getFailures': function()
    {
        return this._failures;
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
     * Assuming a failure, this will run in *at best* O(1) time  (check first
     * field, check first field index). If it must check a few fields, it will
     * run in O(n) time, where n is the number of fields until the first
     * failure, yielding O(1) on subsequent calls assuming no changes in past
     * failures. Assuming no failures and a clean object, O(1). Worst case is
     * O(n). I'm not going to bother working out the average run time.
     *
     * Essentially---it's not that bad.
     *
     * @param {Object} past past failures cache
     *
     * @return {boolean} true if errors exist, otherwise false
     */
    'virtual public hasFailures': function()
    {
        var past = this._failures;

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
    'virtual protected mergeFailures': function( past, failures )
    {
        for ( var name in failures )
        {
            past[ name ] = past[ name ] || [];

            // copy each failure into the past failures table
            for ( var i in failures[ name ] )
            {
                past[ name ][ i ] = failures[ name ][ i ];
            }
        }
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
    'virtual protected detectFixes': function( data, past, failures )
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
                    ( fixed[ name ] = fixed[ name ] || [] )[ i ] =
                        data[ name ][ i ];

                    has_fixed = true;

                    delete past_fail[ i ];
                }
            }
        }

        return ( has_fixed )
            ? fixed
            : null;
    }
} );
