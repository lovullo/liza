/**
 * Error condition field styler
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

var Class       = require( 'easejs' ).Class,
    FieldStyler = require( './FieldStyler' );


/**
 * Style field to indicate an error and displays an error message
 */
module.exports = Class( 'ErrorFieldStyler' )
    .extend( FieldStyler,
{
    'public getId': function()
    {
        return 'error';
    },


    'public applyStyle': function( field, element, row, msg )
    {
        var _self = this;

        // style the row containing the element
        for ( var i in row )
        {
            this.addClass( row[ i ], 'invalid' );
        }

        // TODO: legacy; remove
        this.addClass( element, 'invalid_field' );

        // display the error message
        this._createMessage( field.getName(), msg, row[ 0 ], row[ 1 ] );

        return this;
    },


    'public revokeStyle': function( field, element, row )
    {
        var _self = this;

        // un-style the row containing the element
        // style the row containing the element
        for ( var i in row )
        {
            this.removeClass( row[ i ], 'invalid' );
        }

        // TODO: legacy; remove
        this.removeClass( element, 'invalid_field' );

        this._destroyMessage( row[ 0 ], row[ 1 ] );

        return this;
    },


    'private _createMessage': function( name, message, dd, dt )
    {
        // we can only generate the message if the parent row is available
        if ( !( dd && dt ) )
        {
            return;
        }

        var msg = document.createElement( 'div' );
        msg.className = 'errmsg';
        msg.innerHTML = message;

        // append to dd
        dd.appendChild( msg );

        var height = ( msg.offsetTop + msg.offsetHeight );

        // element does not have height until added to DOM
        // set a default to ensure it appears to user
        height = ( height === 0 )
            ? 45 + 'px'
            : ( height + 10 ) + 'px';

        dd.style.height = height;
        dt.style.height = height;
    },


    'private _destroyMessage': function( dd, dt )
    {
        if ( !dd )
        {
            return;
        }

        dd.style.height = '';

        // note that dt may not actually exist (in fact, dd may not even be a
        // dd; we should rename these variables)
        dt && ( dt.style.height = '' );

        var node;

        // search for the message node, starting with the last element (since
        // the error message was appended, we're likely to find it on our first
        // try)
        for ( node = dd.lastChild;
            node && node.className !== 'errmsg';
            node = node.previousSibling
        );

        // if we found it, then remove it
        node && dd.removeChild( node );
    }
} );
