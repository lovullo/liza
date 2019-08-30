/**
 * Event handler proxy
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
 */

var Class             = require( 'easejs' ).Class,
    EventHandler      = require( './EventHandler' ),
    UnknownEventError = require( './UnknownEventError' );


/**
 * Delegates events to an apropriate handler
 *
 * Handlers must be registered to recgonize an event.
 */
module.exports = Class( 'DelegateEventHandler' )
    .implement( EventHandler )
    .extend(
{
    /**
     * Hash of event handlers to delegate to for various events
     * @type {Object}
     */
    'private _handlers': {},


    /**
     * Initialize delegate with handlers to delegate requests to for each
     * supported event type
     *
     * @param {Object} handlers events as keys, handlers as values
     */
    __construct: function( handlers )
    {
        // register each provided handler
        for ( var type in handlers )
        {
            this._addHandler( type, handlers[ type ] );
        }
    },


    /**
     * Determines if a handler has been registered for the given type
     *
     * @param {string} type event id
     *
     * @return {boolean} whether a handler exists for the given type
     */
    'public hasHandler': function( type )
    {
        return ( this._handlers[ type ] !== undefined );
    },


    /**
     * Handle an event of the given type
     *
     * An exception will be thrown if the event cannot be handled.
     *
     * The handler should always return itself; if a return value is needed to
     * the caller, then a callback should be provided as an argument to the
     * handler.
     *
     * Additional arguments will be passed to the appropriate handler.
     *
     * @param {string} type event id
     *
     * @return {EventHandler} self
     */
    'public handle': function( type )
    {
        var handler = this._handlers[ type ];

        // fail if we do not have a handler for this particular event
        if ( !handler )
        {
            throw UnknownEventError( "Unsupported event type: " + type );
        }

        // delegate
        handler.handle.apply( handler, arguments );

        return this;
    },


    /**
     * Add an EventHandler for a given event type
     *
     * Warning: this will overwrite existing handlers for this type.
     *
     * @param {string}       type    event id
     * @param {EventHandler} handler handler for event
     *
     * @return {ClientEventHandler} self
     */
    'private _addHandler': function( type, handler )
    {
        if ( !( Class.isA( EventHandler, handler ) ) )
        {
            throw TypeError( "Expected EventHandler for event type " + type );
        }

        this._handlers[ type ] = handler;
        return this;
    }
} );
