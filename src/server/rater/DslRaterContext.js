/**
 * Provides context-specific data to the DslRater
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

var Class        = require( 'easejs' ).Class,
    EventEmitter = require( '../../events' ).EventEmitter,
    Quote        = require( '../../quote/Quote' );


module.exports = Class( 'DslRaterContext' )
    .extend( EventEmitter,
{
    /**
     * TODO: Remove workaround for bug extending class across
     * multiple easejs instances
     */
    'public _events': {},

    /**
     * Hash of classes that will result in a global submit
     * @type {Object}
     */
    'private _global_submits': {},

    /**
     * Whether a particular global submit has been triggered
     * @type {Object}
     */
    'private _has_g_submit': {},

    /**
     * Rater corestrictions
     * @type {Object}
     */
    'private _restrict': {},

    /**
     * Quote data with which to rate
     * @type {Object}
     */
    'private _data': null,

    /**
     * Whether to immediately terminate on assertion failure
     * @type {boolean}
     */
    'private _can_term': true,

    /**
     * Result sets
     * @type {Object}
     */
    'private _results': [],

    /**
     * Number of available results
     * @type {number}
     */
    'private _avail_count': 0,

    /**
     * Total number of results
     * @type {number}
     */
    'private _total_count': 0,

    /**
     * Result ids
     * @type {array<string>}
     */
    'private _result_ids': [],


    __construct: function( data, can_term )
    {
        this._data    = data;
        this._can_term = ( can_term == undefined ) ? true : !!can_term;
        this.init();
    },


    /** XXX: return to protected (see commit message) **/
    'public getSourceData': function()
    {
        return this._data;
    },


    'public canTerm': function()
    {
        return this._can_term;
    },


    'virtual protected init': function()
    {
        // may be implemented by subtypes
    },


    'virtual public rate': function( name, meta, rate, complete )
    {
        rate( this._data );
    },


    'virtual public processResult': function( result, meta, context )
    {
        return result;
    },


    /**
     * Add a completed ResultSet
     *
     * @param {string}    name supplier/rater name
     * @param {ResultSet} set  completed rating result set
     *
     * @return {DslRaterContext} self
     */
    'public addResultSet': function( name, set )
    {
        this._total_count += set.getResultCount();
        this._avail_count += set.getAvailableCount();

        this._result_ids.push( set.getId() );

        this._checkGlobalSubmits( set );

        this._results.push( set );
        return this;
    },


    /**
     * Checks each result in a set to determine if a global submit is to be
     * triggered
     *
     * @param {ResultSet} set result set to scan
     *
     * @return {undefined}
     */
    'private _checkGlobalSubmits': function( set )
    {
        var _self = this;
        set.forEachResult( function( result, rcontext )
        {
            if ( !result.__classes  )
            {
                return;
            }

            for ( var cname in _self._global_submits )
            {
                if ( result.__classes[ cname ] )
                {
                    _self._has_g_submit[ cname ] = true;
                }
            }
        } );
    },


    'public setGlobalSubmits': function( submits )
    {
        var i = submits.length;
        while ( i-- )
        {
            this._global_submits[ submits[ i ] ] = true;
        }

        return this;
    },


    'public restrictSupplier': function( id, restricts )
    {
        this._restrict[ id ] = restricts;
        return this;
    },


    'virtual public canSubmit': function( result, rcontext )
    {
        return true;
    },


    'public complete': function()
    {
        // allow context some time to manipulate the results mercilessly
        this._avail_count = this.processCompleted(
            this._results, this._avail_count
        );

        this._processGlobalSubmits();
        this._emitResults();
    },


    /**
     * Process result sets after rating is complete
     *
     * This is called before post-processing, which flattens into the final
     * result; therefore, the ResultSet objects themselves can still be
     * manipulated.
     *
     * If the availablity count is unchanged, COUNT should be returned.
     *
     * @param {Array.<ResultSet>} results result sets
     * @param {number}            count   availaabilty count
     *
     * @return {number} availability count after processing
     */
    'virtual protected processCompleted': function( results, count )
    {
        return this._processCorestrictions( results, count );
    },


    /**
     * FIXME: I need to be cleaned up
     */
    'private _processCorestrictions': function( results, count )
    {
        var _self = this;

        if ( this._restrict.length === 0 )
        {
            return {};
        }

        // index results by id
        var id_results = results.reduce( function( byid, result_set )
        {
            byid[ result_set.getId() ] = result_set;
            return byid;
        }, {} );

        var rnames = Object.keys( this._restrict );

        return rnames.reduce( function( count, name )
        {
            var result_set = id_results[ name ];

            if ( !( result_set && result_set.getAvailableCount() > 0 ) )
            {
                return count;
            }

            // array of suppliers that we cannot be displayed with
            var chk = _self._restrict[ name ];
            for ( var chk_i in chk )
            {
                var chkname = chk[ chk_i ];

                var chk_results;

                if ( ( chk_results = id_results[ chk ] )
                    && ( chk_results.getAvailableCount() > 0 )
                )
                {
                    var n = chk_results.getResultCount();

                    chk_results.forEachResult( function( result )
                    {
                        if ( +result._unavailable )
                        {
                            return;
                        }

                        result._unavailable = '1';
                        result.ineligible   = 'Cannot display with ' +
                            'carrier ' + name;

                        count--;
                    } );

                    return count;
                }
            }

            return count;
        }, count );
    },


    /**
     * Apply global submits to result sets
     *
     * If global submits have been found, they will be applied to each result
     * individually, resulting in submits across the board.
     *
     * @return {undefined}
     */
    'private _processGlobalSubmits': function()
    {
        for ( var cname in this._has_g_submit )
        {
            this._results.forEach( function( set )
            {
                set.forEachResult( function( result )
                {
                    // TODO: class desc
                    result.submit += ( ( result.submit ) ? '; ' : '' ) +
                        cname;

                    result._unavailable = '1';
                    this._avail_count--;
                } );
            } );
        }
    },


    'private _emitResults': function()
    {
        this.emit( 'complete',
            this.postProcessResults( this._results )
        );
    },


    'virtual public postProcessResults': function( results )
    {
        var ret = {};

        results.forEach( function( set )
        {
            var id     = set.getId(),
                merged = set.getMergedResults();

            // prefix each field with the result set id (TODO: this should
            // really be part of a decorator, not this class)
            for ( var field in merged )
            {
                if ( !field )
                {
                    continue;
                }

                ret[ id + '_' + field ] = merged[ field ];
            }

        } );

        ret.__prem_avail_count = [ this._avail_count ];
        ret.__result_ids       = this._result_ids;

        return ret;
    }
} );

