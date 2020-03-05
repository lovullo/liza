/**
 * Liza classification match (cmatch) handling
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
 *
 * TODO: This is code directly extracted from Client, modified to maintain
 * references to necessary objects.  It is coupled with far too many things,
 * and the code is a mess.  Getting this clean and well-tested is important,
 * as this is one of the core systems and is both complicated and complex.
 */

"use strict";

const { Class } = require( 'easejs' );


module.exports = Class( 'Cmatch',
{
    /**
     * Contains classification match data per field
     *
     * @type {Object}
     */
    'private _cmatch': {},

    /**
     * Fields that were hidden (including indexes) since the last cmatch
     * clear
     *
     * @type {Object}
     */
    'private _cmatchHidden': {},

    /**
     * Performs classification matching on fields
     *
     * A field will have a positive match for a given index if all of its
     * classes match
     *
     * @type {FieldClassMatcher}
     */
    'private _classMatcher': null,

    /**
     * Program client
     * @type {Client}
     */
    'private _client': null,


    /**
     * Initialize match handler
     *
     * This relies on too many objects; see header.
     *
     * @param {FieldClassMatcher} class_matcher class/field matcher
     * @param {Program}           program       active program
     * @param {Client}            client        active client
     */
    constructor( class_matcher, program, client )
    {
        this._classMatcher = class_matcher;
        this._program      = program;
        this._client       = client;
    },


    'private _cmatchVisFromUi': function( field, all )
    {
        var step = this._client.getUi().getCurrentStep();

        if ( !step )
        {
            return [];
        }

        var group = step.getElementGroup( field );
        if ( !group )
        {
            return [];
        }

        var i   = group.getCurrentIndexCount(),
            ret = [];

        while ( i-- )
        {
            ret.push( all );
        }

        return ret;
    },


    'public hookClassifier': function( data_validator )
    {
        var _self   = this,
            program = this._program;

        // clear/initialize cmatches
        this._cmatch = {};

        var cmatchprot = false;

        // set classifier
        this._client.getQuote()
            .setClassifier( program.getClassifierKnownFields(), function()
            {
                return program.classify.apply( program, arguments );
            } )
            .on( 'classify', function( classes )
            {
                if ( cmatchprot === true )
                {
                    _self._client.handleError( Error( 'cmatch recursion' ) );
                }

                cmatchprot = true;

                // handle field fixes
                data_validator.validate( undefined, classes )
                    .catch( e => _self.client._handleError( e ) );

                _self._classMatcher.match( classes, function( cmatch )
                {
                    // it's important that we do this here so that everything
                    // that uses the cmatch data will consistently benefit
                    _self._postProcessCmatch( cmatch );

                    // if we're not on a current step, defer
                    if ( !( _self._client.getUi().getCurrentStep() ) )
                    {
                        _self._cmatch = cmatch;
                        cmatchprot = false;
                        return;
                    }

                    _self.handleClassMatch( cmatch );
                    cmatchprot = false;
                } );
            } );
    },


    'private _postProcessCmatch': function( cmatch )
    {
        // for any matches that are scalars (they will have no indexes), loop
        // through each field and set the index to the value of 'all'
        for ( var field in cmatch )
        {
            if ( field === '__classes' )
            {
                continue;
            }

            var cfield = cmatch[ field ];

            if ( cfield.indexes.length === 0 )
            {
                var data = this._client.getQuote().getDataByName( field  ),
                    i    = data.length;

                // this will do nothing if there is no data found
                while ( i-- )
                {
                    cfield.indexes[ i ] = cfield.all;
                }
            }
        }

        return cmatch;
    },


    'private _mergeCmatchHidden': function( name, indexes, hidden )
    {
        if ( !( this._cmatchHidden[ name ] ) )
        {
            this._cmatchHidden[ name ] = {};
        }

        var cindexes = this._cmatchHidden[ name ];

        for ( i in indexes )
        {
            if ( hidden )
            {
                cindexes[ indexes[ i ] ] = i;
            }
            else
            {
                delete cindexes[ indexes[ i ] ];
            }
        }

        var some = false;
        for ( var i in cindexes )
        {
            some = true;
            break;
        }

        if ( !some )
        {
            // v8 devs do not recomment delete as it progressively slows down
            // property access on the object
            this._cmatchHidden[ name ] = undefined;
        }
    },


    'virtual protected handleClassMatch': function( cmatch, force )
    {
        force = !!force;

        this._client.getUi().setCmatch( cmatch );

        var _self = this,
            quote = this._client.getQuote(),

            // oh dear god...(Demeter, specifically..)
            fields = this._client.getUi().getCurrentStep().getStep()
                .getExclusiveFieldNames();


        var visq = {};
        for ( var field in cmatch )
        {
            // ignore fields that are not on the current step
            if ( !( fields[ field ] ) )
            {
                continue;
            }

            // if the match is still false, then we can rest assured
            // that nothing has changed (and skip the overhead)
            if ( !force
                && ( cmatch[ field ] === false )
                && ( _self._cmatch[ field ] === false )
            )
            {
                continue;
            }

            var show = [],
                hide = [],

                cfield = cmatch[ field ],

                vis = cfield.indexes,
                cur = (
                    ( _self._cmatch[ field ] || {} ).indexes
                    || []
                );

            // this should really only ever be the case for __classes
            if ( !vis )
            {
                continue;
            }

            // TODO: Figure out something better here.  This is currently
            // needed for hiding statics---they are registered as exclusive
            // fields (`fields', above), but aren't actually fields (they're
            // not in the bucket).  But we must show/hide them appropriately.
            if ( vis.length === 0 )
            {
                vis = this._cmatchVisFromUi( field, cfield.all );
            }

            // consider the number of indexes in the bucket first;
            // otherwise, we might try to operate on fields that don't
            // exist (bucket/class indexes not the same).  the check for
            // undefined in the first index is a workaround for the explicit
            // setting of the length property of the bucket value when
            // indexes are removed
            var curdata = quote.getDataByName( field ),
                fieldn  = ( curdata.length > 0 && ( curdata[ 0 ] !== undefined ) )
                    ? curdata.length
                    : vis.length;

            for ( var i = 0; i < fieldn; i++ )
            {
                // do not record unchanged indexes as changed
                // (avoiding the event overhead)
                if ( !force && ( vis[ i ] === cur[ i ] ) )
                {
                    continue;
                }

                ( ( vis[ i ] ) ? show : hide ).push( i );
            }

            this.markShowHide( field, visq, show, hide );
        }

        // it's important to do this before showing/hiding fields, since
        // those might trigger events that check the current cmatches
        this._cmatch = cmatch;


        // allow DOM operations to complete before we trigger
        // manipulations on it (TODO: this is a workaround for group
        // show/hide issues; we need a better solution to guarantee
        // order
        setTimeout( () =>
        {
            Object.keys( visq ).forEach( field =>
            {
                const field_vis = visq[ field ];

                Object.keys( field_vis ).forEach( event_id =>
                {
                    const indexes = field_vis[ event_id ];

                    this._client.handleEvent( event_id, {
                        elementName: field,
                        indexes:     indexes,
                    } );
                } );

                this._dapiTrigger( name );
            } );
        }, 25 );
    },


    /**
     * Mark fields to be shown/hidden
     *
     * This also updates the cached visibility of field FIELD.
     *
     * @param {string} field field name
     * @param {Array}  show  indexes to show
     * @param {Array}  hide  indexes to hide
     *
     * @return {undefined}
     */
    'virtual protected markShowHide'( field, visq, show, hide )
    {
        if ( !( show.length || hide.length ) )
        {
            return visq;
        }

        const { [field]: result = {} } = visq;

        if ( show.length )
        {
            this._mergeCmatchHidden( field, show, false );
            result.show = show;
        }

        if ( hide.length )
        {
            this._mergeCmatchHidden( field, hide, true );
            result.hide = hide;
        }

        visq[ field ] = result;

        return visq;
    },


    /**
     * Trigger DataApi event for field FIELD
     *
     * @param {string} field field name
     *
     * @return {undefined}
     */
    'private _dapiTrigger': function( field )
    {
        const current_step_id = this._client.nav.getCurrentStepId();

        this._client.getQuote().visitData( bucket =>
        {
            this._program.dapi(
                current_step_id,
                field,
                bucket,
                {},
                this._cmatch,
                null
            );
        } );
    },


    'public clearCmatchFields': function()
    {
        var step    = this._client.getUi().getCurrentStep(),
            program = this._program;

        // don't bother if we're not yet on a step
        if ( !step )
        {
            return;
        }

        var reset = {};
        for ( var name in step.getStep().getExclusiveFieldNames() )
        {
            var data = this._cmatchHidden[ name ];

            // if there is no data or we have been asked to retain this field's
            // value, then do not clear
            if ( !data || program.cretain[ name ] )
            {
                continue;
            }

            // what state is the current data in?
            var cur = this._client.getQuote().getDataByName( name );

            // we could have done Array.join(',').split(','), but we're trying
            // to keep performance sane here
            var indexes = [];
            for ( var i in data )
            {
                // we do *not* want to reset fields that have been removed
                if ( cur[ i ] === undefined )
                {
                    break;
                }

                indexes.push( i );
            }

            reset[ name ] = indexes;
        }

        // batch reset (limit the number of times events are kicked off)
        this._resetFields( reset );

        // we've done our deed; reset it for the next time around
        this._cmatchHidden = {};
    },


    'private _resetFields': function( fields )
    {
        const quote  = this._client.getQuote();
        const update = {};

        for ( var field in fields )
        {
            var cur   = fields[ field ],
                cdata = quote.getDataByName( field ),
                val   = this._client.elementStyler.getDefault( field );

            var data = [];
            for ( var i in cur )
            {
                var index = cur[ i ];

                if ( cdata[ index ] === val )
                {
                    continue;
                }

                data[ index ] = val;
            }

            update[ field ] = data;
        }

        quote.setData( update );
    },


    /**
     * Return filtered array of fields that have cmatch data
     *
     * This can be used to filter elements in a group
     * by all the fields with cmatch data
     *
     * @param {Array.<string>} fields array of fields
     *
     * @return {Array.<string>} filtered fields
     */
    'public getCmatchFields': function( fields )
    {
        if ( !( this._cmatch ) )
        {
            return [];
        }

        return fields.filter( field => this._cmatch[ field ] !== undefined );
    },


    /**
     * Force handling of the most recent cmatch data
     *
     * This can be used to refresh the UI to ensure that it is consistent with
     * the cmatch data.
     *
     * @return {Client} self
     */
    'public forceCmatchAction': function()
    {
        if ( !( this._cmatch ) )
        {
            return this;
        }

        this.handleClassMatch( this._cmatch, true );

        return this;
    },


    /**
     * Get matches from last classifier application
     *
     * TODO: Remove me; breaks encapsulation.  Intended for transition from
     * mammoth Client.
     *
     * @return {Object} classification matches
     */
    'public getMatches': function()
    {
        return this._cmatch;
    },
} );
