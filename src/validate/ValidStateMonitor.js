/**
 * Field validity monitor
 *
 *  Copyright (C) 2016, 2017 LoVullo Associates, Inc.
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

var Class        = require( 'easejs' ).Class;
var EventEmitter = require( 'events' ).EventEmitter;
var Failure      = require( './Failure' );
var Store        = require( '../store/Store' );


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
     * The field data `data` should be a key-value store with an array as
     * the value for each key.  If the data are not present, then it is
     * assumed to have been left unchanged, and will not contribute to a
     * fix.  Otherwise, any field in `failures` but not in `data` will count
     * as a fix.
     *
     * `failures` should follow the same structure as `data`.  Indexes
     * should omitted from the value if they are not failures.
     *
     * The return value is a promise that is accepted once all fix checks
     * have been performed.  The `failure` event is always emitted _before_
     * the fix event.
     *
     * @param {Object} data     key-value field data
     * @param {Object} failures key-value field errors
     *
     * @return {Promise.<ValidStateMonitor>} self after fix checks
     */
    'public update': function( data, failures )
    {
        if ( !Class.isA( Store, data ) )
        {
            throw TypeError(
                'Bucket diff data must be a Store; given ' + data
            );
        }

        var _self = this;
        var fixed = this.detectFixes( data, this._failures, failures );

        return fixed.then( function( fixes )
        {
            var count_new = _self.mergeFailures( _self._failures, failures );

            if ( _self.hasFailures() && ( count_new > 0 ) )
            {
                _self.emit( 'failure', _self._failures );
            }

            if ( fixes !== null )
            {
                _self.emit( 'fix', fixes );
            }

            return _self.__inst;
        } );
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
     * @return {number} number of new failures
     */
    'virtual protected mergeFailures': function( past, failures )
    {
        var count_new = 0;

        for ( var name in failures )
        {
            past[ name ] = past[ name ] || [];

            var cur_past = past[ name ];

            // copy each failure into the past failures table
            for ( var i in failures[ name ] )
            {
                var new_failure = failures[ name ][ i ];

                // merge with past failure if present
                cur_past[ i ] = ( cur_past[ i ] !== undefined )
                    ? cur_past[ i ].merge( new_failure )
                    : new_failure;

                count_new++;
            }
        }

        return count_new;
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
     * @return {Promise.<!Object>} fixed list of fixed indexes for each fixed field
     */
    'virtual protected detectFixes': function( data, past, failures )
    {
        var _self = this,
            fixed = {};

        return Promise.all(
            Object.keys( past ).map( function( name )
            {
                var past_fail = past[ name ],
                    fail      = failures[ name ];

                return _self._checkFailureFix(
                    name, fail, past_fail, data, fixed
                );
            } )
        )
            .then( function( fixes )
            {
                var has_fixed = fixes.some( function( value )
                {
                    return value === true;
                } );

                return ( has_fixed )
                    ? fixed
                    : null;
            } );
    },


    /**
     * Check past failure fixes
     *
     * @param {string} name      failing field name
     * @param {Array}  fail      failing field index/value
     * @param {Array}  past_fail past failures for field name
     * @param {Object} data      validated data
     * @param {Object} fixed     destination for fixed field data
     *
     * @return {Promise.<boolean>} whether a field was fixed
     */
    'private _checkFailureFix': function( name, fail, past_fail, data, fixed )
    {
        var _self = this;

        // we must check each individual index because it is possible that
        // not every index was modified or fixed (we must loop through like
        // this because this is treated as a hash table, not an array)
        return Promise.all( past_fail.map( function( failure, fail_i )
        {
            var causes = failure && failure.getCauses() || [];

            // to short-circuit checks, the promise will be _rejected_ once
            // a match is found (see catch block)
            return causes
                .reduce(
                    _self._checkCauseFix.bind( _self, data, fail ),
                    Promise.resolve( true )
                )
                .then( function()
                {
                    // no fixes
                    return false;
                } )
                .catch( function( result )
                {
                    if ( result instanceof Error )
                    {
                        throw result;
                    }

                    // looks like it has been resolved
                    ( fixed[ name ] = fixed[ name ] || [] )[ fail_i ] = result;

                    delete past_fail[ fail_i ];
                    return true;
                } );
        } ) ).then( function( result ) {
            return result.some( function( val )
            {
                return val === true;
            } );
        } );
    },


    /**
     * Check past failure causes
     *
     * Each past failure in `fail` will be checked against the data in
     * `diff` to determine whether it should be considered a possible
     * fix.  If so, the promise is fulfilled with the fix data.  It is the
     * responsibility of the caller to handle removing past failures.
     *
     * @param {Object}  data   validated data
     * @param {Object}  fail   failure records
     * @param {Promise} causep cause promise to chain onto
     * @param {Field}   cause  field that caused the error
     *
     * @return {Promise} whether a field should be fixed
     */
    'private _checkCauseFix': function( data, fail, causep, cause )
    {
        var cause_name  = cause.getName();
        var cause_index = cause.getIndex();

        return causep.then( function()
        {
            return new Promise( function( keepgoing, found )
            {
                data.get( cause_name ).then( function( field )
                {
                    // to be marked as fixed, there must both me no failure
                    // and there must be data for this index for the field
                    // in question (if the field wasn't touched, then of
                    // course there's no failure!)
                    if ( ( fail === undefined )
                        || ( !( fail[ cause_index ] )
                            && ( field[ cause_index ] !== undefined ) )
                    )
                    {
                        found( field[ cause_index ] );
                        return;
                    }

                    // keep searching
                    keepgoing( true );
                } )
                .catch( function( e )
                {
                    // doesn't exist, so just keep searching (it
                    // wasn't fixed)
                    keepgoing( true );
                } );
            } );
        } );
    },
} );
