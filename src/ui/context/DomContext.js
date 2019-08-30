/**
 * DOM subset context
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

var Class   = require( 'easejs' ).Class,
    Context = require( './Context' ),

    EventEmitter = require( 'events' ).EventEmitter;


/**
 * A subset of the DOM that can be used to restrict operations for both
 * convenience and (moreso) performance
 */
module.exports = Class( 'DomContext' )
    .implement( Context )
    .extend( EventEmitter,
{
    /**
     * Parent context, if any
     * @type {DomContext}
     */
    'private _pcontext': null,

    /**
     * DOM content for this particular context
     * @type {HTMLElement}
     */
    'private _content': null,

    /**
     * Parent to re-attach to
     * @type {HtmlElement}
     */
    'private _contentParent': null,

    /**
     * Factory used to produce DomFields
     * @type {DomFieldFactory}
     */
    'private _fieldFactory': null,

    /**
     * Cache of fields that have been looked up previously
     * @type {Object}
     */
    'private _fieldCache': {},

    /**
     * Continuations to be invoked once attached to the DOM
     * @type {Array.<function()>}
     */
    'private _attachq': [],

    /**
     * Continuations to be invoked once detached from the DOM
     * @type {Array.<function()>}
     */
    'private _detachq': [],


    __construct: function( content, field_factory, pcontext, cache )
    {
        // older browsers do not support HTMLElement, but we still want the type
        // check for newer ones
        if ( window.HTMLElement && !( content instanceof HTMLElement ) )
        {
            throw TypeError( "Context content must be a valid HTMLElement" );
        }
        else if ( !( this.verifyParentContext( pcontext ) ) )
        {
            throw TypeError( "Invalid parent DomContext" );
        }

        this._content      = content;
        this._fieldFactory = field_factory;
        this._pcontext     = pcontext || null;
        this._fieldCache   = cache || {};
    },


    'virtual protected verifyParentContext': function( context )
    {
        return Class.isA( module.exports, context );
    },


    'public split': function( on_id, c )
    {
        var _self = this,
            inst  = _self.__inst;

        this._getElementById( on_id, function( element )
        {
            // if the element could not be found, just return self
            c( ( element )
                ? module.exports(
                    element,
                    _self._fieldFactory,
                    inst,
                    _self._fieldCache
                ).on( 'error', function( e )
                {
                    // "bubble up" errors
                    _self.emit( 'error', e );
                } )

                : inst
            );
        } );

        return this;
    },


    'public getFieldByName': function( name, index, filter )
    {
        var result = this._fromCache( name, index );

        if ( filter )
        {
            throw Error( "TODO: filter" );
        }

        return result;
    },


    'private _getElementById': function( id, c )
    {
        id = ''+id;

        if ( !id )
        {
            c( null );
            return;
        }

        // we cannot perform the highly performant getElementById() unless we
        // are attached to the DOM
        this.whenAttached( function()
        {
            c( document.getElementById( id ) );
        } );
    },


    'private _fromCache': function( name, index, lookup )
    {
        var data = (
            this._fieldCache[ name ] = this._fieldCache[ name ] || []
        );

        // if already present within the cache, simply return it
        if ( data[ index ] )
        {
            return data[ index ];
        }

        // add to cache and return
        var _self = this;
        return data[ index ] = this._fieldFactory.create(
            name, index,

            // this is intended to defer request of the root element until this
            // context is attached to the DOM; this ensures that the requester
            // can take advantage of features of the attached DOM such as
            // getElementById() and defers initial DOM operations until the
            // element is actually available on the DOM
            function( c )
            {
                // invoke the continuation as soon as we're attached to the DOM
                _self.whenAttached( c );
            }
        ).on( 'error', function( e )
        {
            // forward errors
            _self.emit( 'error', e );
        } );
    },


    /**
     * Determines whether this context is currently attached to the DOM
     *
     * @return {boolean} true if attached to the DOM, otherwise false
     */
    'virtual public isAttached': function()
    {
        // we are attached if (a) our content node has a parent and (b) if our
        // parent context is also attached
        return !!this._content.parentElement && this._pcontext.isAttached();
    },


    /**
     * Schedules a continunation to be invoked once the context becomes attached
     * to the DOM
     *
     * If already attached, the continuation will be executed immediately
     * (synchronously).
     *
     * @param {function()} c continuation to be invoked
     *
     * @return {DomContext} self
     */
    'public whenAttached': function( c )
    {
        // invoke immediately if we're already attached
        if ( this.isAttached() )
        {
            c();
            return this;
        }

        // queue continuation
        var _self = this;
        this._attachq.push( function()
        {
            // ensure that we're still attached to the DOM by the time this
            // continuation is actually invoked
            if ( !( _self.isAttached() ) )
            {
                // tough luck; try again later
                _self.whenAttached( c );
                return;
            }

            c();
        } );

        return this;
    },


    'public whenDetached': function( c )
    {
        // invoke immediately if we're not attached
        if ( this.isAttached() === false )
        {
            c();
            return this;
        }

        // queue the continuation
        var _self = this;
        this._detachc.push( function()
        {
            // ensure that we're still detached from the DOM
            if ( _self.isAttached() )
            {
                // tough luck; try again later
                _self.whenDetached( c );
                return;
            }

            c();
        } );

        return this;
    },


    'virtual public attach': function( to )
    {
        var _self = this;

        // if we are already attached to the DOM, then do nothing (note that we
        // check the parent element of our content node because something could
        // have detached the node from the DOM without us knowing)
        if ( this._content.parentElement )
        {
            return this;
        }

        // default to the stored parent if they did not provide anything
        to = ( to || this._contentParent );
        if ( !( Class.isA( HTMLElement, to ) ) )
        {
            throw TypeError( "Cannot attach context to " + to.toString() );
        }

        // re-attach ourselves to our parent and dequeue the continuations only
        // once our parent is attached (will execute immediately if we are
        // already attached)
        to.appendChild( this._content );
        this._pcontext.whenAttached( function()
        {
            _self._dequeue( _self._attachq );
        } );

        return this;
    },


    'virtual public detach': function()
    {
        // do nothing if we are not attached to the DOM (note that we check the
        // parent element of the content because something else could have
        // re-attached our content node to the DOM without us knowing)
        if ( !( this._content.parentElement ) )
        {
            return this;
        }

        // store the parent so that we know where to re-attach ourselves
        this._contentParent = this._content.parentElement;

        // detach from the DOM and dequeue the conintinuations (we don't care if
        // our parent is detached since we're still detached regardless)
        this._contentParent.removeChild( this._content );
        this._dequeue( this._detachq );

        return this;
    },


    /**
     * @todo: rename me to unqueue; dequeue is a data structure
     */
    'private _dequeue': function( q )
    {
        // transfer continuation queue onto the JS timeout stack
        var c, _self = this;
        while ( c = q.shift() )
        {
            // ensures that the continuations will be executed without locking
            // up the browser; this is important, since these are DOM
            // manipulations and therefore may be intensive!
            setTimeout( c, 25 );
        }
    }
} );
