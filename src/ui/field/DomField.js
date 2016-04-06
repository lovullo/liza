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

var Class                 = require( 'easejs' ).Class,
    Field                 = require( '../../field/Field' ),
    DomFieldNotFoundError = require( './DomFieldNotFoundError' ),
    EventEmitter          = require( 'events' ).EventEmitter;


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

    /**
     * Function used to query for element
     * @type {function(function(HTMLElement))}
     */
    'private _query': null,

    'private _idPrefix': 'q_',

    /**
     * Cached immediate parent
     * @type {HTMLElement}
     */
    'private _parent': null,


    __construct: function( field, element )
    {
        if ( !( Class.isA( Field, field ) ) )
        {
            throw TypeError( "Invalid field provided" );
        }

        this._field = field;
        this._query = element;
    },


    'public proxy getName': '_field',
    'public proxy getIndex': '_field',


    /**
     * Attempt to retrieve element associated with field
     *
     * CALLBACK will be invoked with the element, if found.  The DOM is
     * always queried in case the element associated with this field
     * changes, but if the element is not found, then it is assumed to be
     * detached and the last known element is returned.
     *
     * @param {function(HTMLElement)} callback element callback
     *
     * @return {undefined}
     */
    'private _getElement': function( callback )
    {
        // if the provided root is a function, then it should be lazily laoded
        if ( this._query === null )
        {
            // if the element is null, then we have some serious problems; do
            // not even invoke the callback
            return;
        }

        this.queryElement( callback );
    },


    /**
     * Locate field element on the DOM, or return last known element
     *
     * @todo We used to cache the element in memory, period, but we have no
     * reliable way to clear it from memory in older versions of
     * browsers.  For browsers that support DOM mutator events, we should
     * use them.
     *
     * @param {function(HTMLElement)} callback element callback
     *
     * @return {undefined}
     */
    'protected queryElement': function( callback )
    {
        var _self      = this,
            orig_query = this._query;

        // any further requests for this element should be queued rather
        // than resulting in a thundering herd toward the DOM (imporant: do
        // this *before* invoking the function, since it may be synchronous)
        var queue = [];
        this._query = function( c )
        {
            queue.push( c );
        };

        // attempt to retrieve our element from the DOM
        orig_query( function( element )
        {
            var new_element = element || _self._element;

            if ( !new_element )
            {
                _self._element = null;
                _self.emit( 'error', DomFieldNotFoundError(
                    "Cannot locate DOM element for field " +
                    _self.getName() + "[" + _self.getIndex() + "]"
                ) );

                // do not even finish; this shit is for real.
                return;
            }

            if ( new_element !== _self._element )
            {
                _self.updateElement( new_element );
            }

            // restore original query
            _self._query = orig_query;

            callback( new_element );

            // if we have any queued requests, process them when we're not
            // busy
            var c;
            while ( c = queue.shift() )
            {
                ( function( c )
                {
                    setTimeout( function()
                    {
                        // return the element to the queued callback
                        c( element );
                    }, 25 );
                } )( c );
            }
        } );
    },


    /**
     * Update cached element
     *
     * The parent of NEW_ELEMENT is cached so that it can be reattached to
     * the DOM after a detach.
     *
     * @param {HTMLElement} new_element new field element
     *
     * @return {undefined}
     */
    'protected updateElement': function( new_element )
    {
        this._element = new_element;
        this._parent  = new_element.parentElement;
    },


    'public applyStyle': function( style )
    {
        var _self = this;

        // all remaining arguments should be passed to the style
        var sargs = Array.prototype.slice.call( arguments, 1 );

        // wait for our element to become available on the DOM and perform the
        // styling
        this._getElement( function( root )
        {
            // if we already have this style applied, then ignore this request
            if ( style.isApplied( _self.__inst, root ) )
            {
                return;
            }

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

        this._getElement( function( root )
        {
            // if we already have this style applied, then ignore this request
            if ( !style.isApplied( _self.__inst, root ) )
            {
                return;
            }

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

        var dd = this.getParent( 'dd' ),
            dt = ( dd ) ? this.getPrecedingSibling( dd, 'dt' ) : null;

        return ( dt )
            ? [ dd, dt ]
            : [ this.getParent() ];
    },


    'public getParent': function( type )
    {
        return this.getElementParent( this._element, type );
    },


    'protected getElementParent': function( element, type )
    {
        var parent = element.parentElement;

        if ( element === this._element )
        {
            parent = parent || this._parent;

            // update parent reference if it's since changed
            if ( this._parent !== parent )
            {
                this._parent = parent;
            }
        }

        if ( parent === null )
        {
            return null;
        }
        else if ( !type )
        {
            return parent;
        }

        // nodeName might not be in caps
        if ( type.toUpperCase() === parent.nodeName.toUpperCase() )
        {
            return parent;
        }

        // otherwise, keep looking
        return this.getElementParent( parent, type );
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
