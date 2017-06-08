/**
 * Dynamic field context
 *
 *  Copyright (C) 2016 R-T Specialty, LLC.
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
    Context = require( './Context' );


/**
 * Mutable Context
 *
 * This exists primarily to ease refactoring of old parts of the framework;
 * it should not be preferred going forward.
 */
module.exports = Class( 'DynamicContext' )
    .implement( Context )
    .extend(
{
    /**
     * Current context
     * @type {Context}
     */
    'private _context': null,


    __construct: function( initial )
    {
        this.assign( initial );
    },


    'public assign': function( context )
    {
        if ( !( Class.isA( Context, context ) ) )
        {
            throw TypeError( "Invalid context" );
        }

        this._context = context;
        return this;
    },


    'public proxy getFieldByName': '_context',

    'public proxy split': '_context'
} );
