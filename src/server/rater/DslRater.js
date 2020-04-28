/**
 * Handles rating with local, JS-compiled TAME-written raters
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

    DslRaterContext = require( './DslRaterContext' );


module.exports = Class( 'DslRater' )
    .extend( EventEmitter,
{
    /**
     * List of raters
     * @type {Array.<Object.<rate>>}
     */
    'private _raters': [],

    /**
     * ResultSet constructor (used in place of a factory)
     * @type {Function}
     */
    'private _ResultSet': null,


    __construct: function( raters, ResultSet )
    {
        this._raters    = raters;
        this._ResultSet = ResultSet;
    },


    'public rate': function( context )
    {
        if ( this._raters.length === 0 )
        {
            // TODO: this is a BS answer
            callback(
                Error( 'No raters are available at this time.' ),
                null
            );
            return this;
        }

        if ( !( Class.isA( DslRaterContext, context ) ) )
        {
            throw TypeError( "Invalid DslRaterContext provided" );
        }

        this._doRate( this._raters.slice( 0 ), context );
    },


    'private _queueNext': function()
    {
        var _self = this,
            args  = arguments;

        process.nextTick( function()
        {
            _self._doRate.apply( _self, args );
        } );
    },


    /**
     * Process next available supplier until complete
     */
    'private _doRate': function( queue, context )
    {
        var _self = this,
            args  = arguments;

        var rater = queue.pop();
        if ( rater === undefined )
        {
            this._complete( context );
            return;
        }

        // null means that the rater failed to load
        if ( rater === null )
        {
            // TODO: log error
            this._queueNext.apply( this, args );
            return;
        }

        var name = rater.supplier,
            meta = rater.rater.meta,
            set  = this._ResultSet( name );

        // give context the chance to augment the data and determine how many
        // times we should rate with a given supplier; this continuation will be
        // called for each time that the context wishes to perform rating
        var data = context.rate( name, meta, function( data, rcontext )
        {
            try
            {
                var can_term = context.canTerm();
                var single   = rater( data, can_term );

                // ensures that any previous eligibility errors are cleared out
                single.ineligible = '';
                single.submit     = '';
            }
            catch ( e )
            {
                // ineligible.
                single = {
                    ineligible: e.message,
                    submit:     '',
                    premium:    0.00,
                };
            }

            // give the context to process the result of the rating before we
            // perform any of our own processing (that way they can trigger
            // submits, etc)
            single = context.processResult( single, meta, rcontext );

            _self ._processProhibits( rater, single, context, data )
                ._processSubmits( rater, single, context, data, rcontext )
                ._flagEligibility( single )
                ._cleanResult( single );

            // purposely omitted third argument
            set.addResult( single, rcontext );
        }, complete );

        // to be called by context when rating is complete for this rater
        function complete()
        {
            context.addResultSet( name, set );
            _self._queueNext.apply( _self, args );
        }
    },


    'private _processSubmits': function(
        rater, single, context, data, rcontext
    )
    {
        // ineligible results cannot submit, as they did not complete rating
        if ( single.ineligible )
        {
            return this;
        }

        // submission processing may be disabled (e.g. via a runtime flag)
        if ( !( context.canSubmit( single, data, rcontext ) ) )
        {
            return this;
        }

        var c = single.__classes;

        if ( !c || !( c.submit ) )
        {
            return this;
        }

        var submits = [];
        for ( cname in c )
        {
            // Process submit classifications if they are *true*.  Classes
            // that are suffixed with a dash represent a generated rule that
            // should _not_ be displayed to the user
            if ( /^submit-.*[^-]$/.test( cname ) && c[ cname ] )
            {
                submits.push( this.getCdesc( cname, rater, data ) );
            }
        }

        single.submit = submits.join( '; ' );
        return this;
    },


    /**
     *
     * @param {Object}          rater   Supplier rater
     * @param {Object}          single  Supplier UI options
     * @param {DslRaterContext} context Rater context
     * @param {Object}          data    Bucket data
     *
     * @return {DslRater}
     */
    'private _processProhibits': function(
        rater, single, context, data
    )
    {
        // Don't process prohibits if rating can naturally terminate
        if ( context.canTerm() )
        {
            return this;
        }

        var classes = single.__classes;

        // An error was thrown during rating
        if ( classes === undefined )
        {
            return this;
        }

        var prohibits = [];
        var regex     =
        {
            prohibit:  /^inelig-.+$/,
            assertion: /^-assert-.+$/
        };

        for ( className in classes )
        {
            var foundProhibit = regex.prohibit.test( className )
                             || regex.assertion.test( className );

            var classValue = classes[ className ];

            if ( foundProhibit && classValue )
            {
                prohibits.push( this.getCdesc( className, rater, data ) );
            }
        }

        // Backup when an error is thrown but no prohibit is found (unlikely)
        if ( this._isIneligible( classes, rater ) && prohibits.length === 0 )
        {
            prohibits.push( 'This supplier is ineligible.' );
        }

        single.ineligible = this._filterProhibits( prohibits ).join( "; " );

        return this;
    },


    /**
     *
     * @param  {Object}  classes Classification data
     * @param {Object}   rater   Supplier rater
     *
     * @return {boolean}         If the data contain an error
     */
    'private _isIneligible': function( classes, rater )
    {
        // XXX: use elig-class when propagated by tameld;
        // this is a generated classification name
        var eligKey = '--elig-suppliers-' + rater.supplier;

        if ( classes[ eligKey ] === undefined )
        {
            throw new Error( 'Missing supplier eligibility field: ' + eligKey );
        }

        return classes[ eligKey ] === false;
    },


    /**
     * Remove generic and duplicated prohibit reasons
     * Generic prohibits take the form of [{supplier-name} prohibit]
     *
     * @param  {string[]} prohibits A list of prohibit reasons
     *
     * @return {string[]}           A filtered list of prohibit reasons
     */
    'private _filterProhibits': function( prohibits )
    {

        var unique = function( value, index, array )
        {
            return array.indexOf( value ) === index;
        }

        var hasSpecificProhibit = function( value, index, array )
        {
            var generic = /^\[.+\sprohibit\]$/.test( value );

            return !generic;
        }

        return prohibits.filter( unique ).filter( hasSpecificProhibit );
    },


    'private _flagEligibility': function( single )
    {
        // from a broker's perspective
        single._unavailable = ( single.submit || single.ineligible )
            ? '1'
            : '0';

        return this;
    },


    'private _cleanResult': function( result )
    {
        return this;
    },


    'virtual public getCdesc': function( cname, rater, data, default_value )
    {
        default_value = ( default_value === undefined )
            ? cname
            : default_value;

        return rater.rater.classify.desc[ cname ] || default_value;
    },


    'private _complete': function( context )
    {
        // let the context know that we're finished rating
        context.complete();
    },
} );

