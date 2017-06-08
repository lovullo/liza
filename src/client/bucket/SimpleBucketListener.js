/**
 * Contains SimpleBucketListener class
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

var Class  = require( 'easejs' ).Class,
    Client = require( '../Client' );


/**
 * Provides a simple API for listening for bucket changes on a given Client
 */
module.exports = Class( 'SimpleBucketListener',
{
    /**
     * Contains callbacks to trigger on update event
     * @type {Object.<function(Object.<Array.<string>>)>}
     */
    'private _updateEvents': {},

    /**
     * Contains callbacks to trigger on updateEach event
     * @type {Object.<function(number,Array.<string>)>}
     */
    'private _updateEachEvents': {},

    /**
     * Quick-n-easy reference to the current step id in context of the given
     * Client instance
     *
     * This is updated automatically by monitoring the Client's quoteChange
     * event; a fast alternative to querying the quote for each event.
     *
     * @type {number}
     */
    'private _curStepId': 0,


    /**
     * Initializes listener with the provided Client
     *
     * @param {Client} client client to monitor
     */
    __construct: function( client )
    {
        if ( !( Class.isA( Client, client ) ) )
        {
            throw TypeError( 'Expected Client object; received ' + client );
        }

        this._hookQuoteChange( client );

        // in the event that we have a quote available, hook it immediately
        var quote;
        if ( quote = client.getQuote() )
        {
            this._hookQuote( quote );
        }
    },


    /**
     * Hook client's quote change event to properly hook the new bucket on quote
     * change
     *
     * @param {Client} client client to hook
     *
     * @return {undefined}
     */
    'private _hookQuoteChange': function( client )
    {
        var _self = this;

        client.on( 'quoteChange', function()
        {
            var quote_client = client.getQuote();
            quote_client && _self._hookQuote( quote_client );
        } );
    },


    /**
     * Hook quote data events
     *
     * @param {ClientQuote} quote_client quote client to hook
     *
     * @return {undefined}
     */
    'private _hookQuote': function( quote_client )
    {
        var _self = this;

        this._quote = quote_client;

        quote_client
            .on( 'dataUpdate', function( data )
            {
                _self._handleUpdate( data );
            } )
            .on( 'stepChange', function( step_id )
            {
                _self._curStepId = step_id;
            } );
    },


    /**
     * Handle a data update event from the quote client
     *
     * @param {Object} data data diff
     *
     * @return {undefined}
     */
    'private _handleUpdate': function( data )
    {
        var hook;

        // we're not going to perform a hasOwnProperty() check because we are to
        // assume that the data provided does not have any other enumerable
        // members
        for ( id in data )
        {
            this._tryUpdateHook( id, data );
            this._tryUpdateEachHook( id, data );
        }
    },


    /**
     * Calls any update hooks for the given id
     *
     * @param {string}                  id   hook id
     * @param {Object.<Array.<string>>} data update diff
     *
     * @return {undefined}
     */
    'private _tryUpdateHook': function( id, data )
    {
        var hooks;

        if ( hooks = this._updateEvents[ id ] )
        {
            this._callHooks( hooks, id, [ data[ id ] ] );
        }
    },


    /**
     * Calls any updateEach hooks for the given id
     *
     * @param {string}                  id   hook id
     * @param {Object.<Array.<string>>} data update diff
     *
     * @return {undefined}
     */
    'private _tryUpdateEachHook': function( id, data )
    {
        var hooks;

        if ( ( hooks = this._updateEachEvents[ id ] ) === undefined )
        {
            return;
        }

        var id_data = data[ id ],
            i   = id_data.length,
            val = null;

        while ( i-- )
        {
            val = id_data[ i ];

            // ignore unchanged indexes or deleted
            if ( ( val === undefined ) || ( val === null ) )
            {
                continue;
            }

            this._callHooks( hooks, id, [ i, val ] );
        }
    },


    /**
     * Calls a set of hooks, so long as the options are valid
     *
     * @param {Array.<Function>} hook hook to call
     * @param {string}           id   id of hook (key)
     * @param {Array}            args arguments to apply
     *
     * @return {undefined}
     */
    'private _callHooks': function( hooks, id, args )
    {
        var i = hooks.length;

        while ( i-- )
        {
            var hook = hooks[ i ];

            if ( hook.step && ( hook.step !== this._curStepId ) )
            {
                continue;
            }

            hook.apply( { id: id }, args );
        }
    },


    /**
     * Attach the given callback(s)
     *
     * @param {Object}                dest     callback store
     * @param {string|Array.<string>} id       id or array of ids to monitor for
     * @param {Function}              callback callback to store
     *
     * @return {undefined}
     */
    'private _attachCallbacks': function( dest, id, opts, callback )
    {
        // options are optional
        if ( callback === undefined )
        {
            callback = opts;
        }

        if ( typeof callback !== 'function' )
        {
            throw TypeError( 'Expected callback; given ' + callback );
        }

        if ( opts.step )
        {
            callback.step = opts.step;
        }

        if ( typeof id === 'string' )
        {
            ( dest[ id ] = dest[ id ] || [] ).push( callback );
        }
        else
        {
            var i = id.length;
            while ( i-- )
            {
                ( dest[ id[ i ] ] = dest[ id[ i ] ] || [] ).push( callback );
            }
        }
    },


    /**
     * Trigger callback when the given id(s) is/are updated
     *
     * @param {string|Array.<string>} id id or array of ids to monitor
     *
     * @param {{step}|function(Object.<Array.<string>>)} opts options or callback
     *
     * @param {function(Object.<Array.<string>>)=} callback to call on id change,
     *                                                      if opts provided
     *
     * @return {SimpleBucketListener} self
     */
    'public onUpdate': function( id, opts, callback )
    {
        this._attachCallbacks( this._updateEvents, id, opts, callback );
        return this;
    },


    /**
     * Trigger callback when the given id(s) is/are updated
     *
     * @param {string|Array.<string>} id id or array of ids to monitor
     *
     * @param {{step}|function(Array.<string>)} opts     options or callback
     * @param {function(Array.<string>)=}       callback to call on id change,
     *                                                   if opts provided
     *
     * @return {SimpleBucketListener} self
     */
    'public onUpdateEach': function( id, opts, callback )
    {
        this._attachCallbacks( this._updateEachEvents, id, opts, callback );
        return this;
    }
} );

