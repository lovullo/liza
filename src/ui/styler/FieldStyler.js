/**
 * Style fields using CSS
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

var AbstractClass = require( 'easejs' ).AbstractClass;


/**
 * Style fields using CSS
 */
module.exports = AbstractClass( 'FieldStyler',
{
    'abstract public getId': [],

    'abstract public applyStyle': [ 'field', 'element', 'row' ],

    'abstract public revokeStyle': [ 'field', 'element', 'row' ],


    'protected addClass': function( element, cls )
    {
        if ( !element )
        {
            return this;
        }

        // if we are given an array, then recurse
        if ( Array.isArray( element ) )
        {
            for ( var i in element )
            {
                this.addClass( element[ i ], cls );
            }

            return;
        }
        else if ( typeof element.className === 'string' )
        {
            element.className += ' ' + cls;
        }

        return this;
    },


    'protected removeClass': function( element, cls )
    {
        if ( !element )
        {
            return this;
        }

        // if we are given an array, then recurse
        if ( Array.isArray( element ) )
        {
            for ( var i in element )
            {
                this.removeClass( element[ i ], cls );
            }

            return;
        }
        else if ( typeof element.className === 'string' )
        {
            // note that we use a space instead of a boundary for the character
            // preceding the match due to the implementation of addClass()
            element.className = element.className.replace(
                new RegExp( ( ' ' + cls + '\\b' ), 'g' ), ''
            );
        }

        return this;
    }
} );
