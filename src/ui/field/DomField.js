/**
 * Field represented by DOM element
 *
 *  Copyright (C) 2015 LoVullo Associates, Inc.
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

var Class = require( 'easejs' ).Class,
    Field = require( '../../field/Field' ),

    EventEmitter = require( 'events' ).EventEmitter;


module.exports = Class( 'DomField' )
    .implement( Field )
    .extend( EventEmitter,
{
    /**
     * Wrapped field
     * @type {Field}
     */
    'private _field': null,

    'private _element': null,

    'private _idPrefix': 'q_',

    /**
     * Currently active styles
     * @type {Object}
     */
    'private _styles': {},


    __construct: function( field, element )
    {
        if ( !( Class.isA( Field, field ) ) )
        {
            throw TypeError( "Invalid field provided" );
        }

        this._field   = field;
        this._element = element;
    },


    'public proxy getName': '_field',
    'public proxy getIndex': '_field',


    'private _getElement': function( callback )
    {
        // if the provided root is a function, then it should be lazily laoded
        if ( this._element === null )
        {
            // if the element is null, then we have some serious problems; do
            // not even invoke the callback
            return;
        }
        else if ( typeof this._element === 'function' )
        {
            var _self = this,
                f     = this._element;

            // any further requests for this element should be queued rather
            // than resulting in a thundering herd toward the DOM (imporant: do
            // this *before* invoking the function, since it may be synchronous)
            var queue = [];
            this._element = function( c )
            {
                queue.push( c );
            };

            // attempt to retrieve our element from the DOM
            f( function( element )
            {
                if ( !element )
                {
                    _self._element = null;
                    _self.emit( 'error', Error(
                        "Cannot locate DOM element for field " +
                        _self.getName() + "[" + _self.getIndex() + "]"
                    ) );

                    // do not even finish; this shit is for real.
                    return;
                }

                _self._element = element;
                callback( element );

                // if we have any queued requests, process them when we're not
                // busy
                var c;
                while ( c = queue.shift() )
                {
                    setTimeout( function()
                    {
                        // return the element to the queued callback
                        c( element );
                    }, 25 );
                }
            } );

            return;
        }

        // we already have the element; immediately return it
        callback( this._element );
    },


    'private _hasStyle': function( style )
    {
        return !!this._styles[ style.getId() ];
    },


    'private _flagStyle': function( style, flag )
    {
        this._styles[ style.getId() ] = !!flag;
    },


    'public applyStyle': function( style )
    {
        var _self = this;

        // if we already have this style applied, then ignore this request
        if ( this._hasStyle( style ) )
        {
            return this;
        }

        // all remaining arguments should be passed to the style
        var sargs = Array.prototype.slice.call( arguments, 1 );

        // flag style immediately to ensure we do not queue multiple application
        // requests
        this._flagStyle( style, true );

        // wait for our element to become available on the DOM and perform the
        // styling
        this._getElement( function( root )
        {
            style.applyStyle.apply(
                style,
                [ _self.__inst, root, _self.getContainingRow() ].concat( sargs )
            );
        } );

        return this;
    },


    'public revokeStyle': function( style )
    {
        var _self = this;

        // if this style is not applied, then do nothing
        if ( !( this._hasStyle( style ) ) )
        {
            return this;
        }

        // immediately flag style to ensure that we do not queue multiple
        // revocation requests
        this._flagStyle( style, false );

        this._getElement( function( root )
        {
            style.revokeStyle( _self.__inst, root, _self.getContainingRow() );
        } );

        return this;
    },


    /**
     * Resolves a field into an id that may be used to query the DOM
     *
     * @return {string} expected id of element on the DOM
     */
    'protected resolveId': function()
    {
        return this.doResolveId(
            this._field.getName(),
            this._field.getIndex()
        );
    },


    /**
     * Resolves a field into an id that may be used to query the DOM
     *
     * This may be overridden by a subtype to alter the resolution logic. The
     * name and index are passed to the method to ensure that the field itself
     * remains encapsulated.
     *
     * @param {string} name  field name
     * @param {number} index field index
     *
     * @return {string} expected id of element on the DOM
     */
    'virtual protected doResolveId': function( name, index )
    {
        return ( this._idPrefix + name + '_' + index );
    },


    // TODO: move me; too many odd exceptions; standardize
    'protected getContainingRow': function()
    {
        var node_name = this._element.nodeName.toUpperCase();

        if ( ( node_name === 'DT' ) || ( node_name === 'DD' ) )
        {
            return [ this._element ];
        }

        var dd = this.getParent( this._element, 'dd' ),
            dt = ( dd ) ? this.getPrecedingSibling( dd, 'dt' ) : null;

        return ( dt )
            ? [ dd, dt ]
            : [ this.getParent( this._element ) ];
    },


    'protected getParent': function( element, type )
    {
        var parent = element.parentElement;

        if ( parent === null )
        {
            return null;
        }
        else if ( !type )
        {
            return parent;
        }

        // nodeName is in caps
        if ( type.toUpperCase() === parent.nodeName )
        {
            return parent;
        }

        // otherwise, keep looking
        return this.getParent( parent, type );
    },


    'protected getPrecedingSibling': function( element, type )
    {
        return this.getSibling( element, type, -1 );
    },


    'protected getFollowingSibling': function( element, type )
    {
        return this.getSibling( element, type, 1 );
    },


    'protected getSibling': function( element, type, direction )
    {
        // if no direction was provided, then search in both
        if ( !direction )
        {
            return ( this.getSibling( element, type, -1 )
                || this.getSibling( element, type, 1 )
            );
        }

        // get the next node relative to the direction
        var next = element[
            ( direction === -1 ) ? 'previousSibling' : 'nextSibling'
        ];
        if ( next === null )
        {
            return null;
        }

        // if we found our sibling, return it
        if ( type.toUpperCase() === next.nodeName )
        {
            return next;
        }

        return this.getSibling( next, type, direction );
    }
} );
