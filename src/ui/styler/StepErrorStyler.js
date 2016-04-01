/**
 * Styles errors on steps
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
    ErrorStyler = require( './ErrorStyler' );


/**
 * Trigger field styling for errors on the parent step itself
 */
module.exports = Class( 'StepErrorStyler' )
    .extend( ErrorStyler,
{
    'private _style': null,


    'override __construct': function( msgs, field_style )
    {
        this._style = field_style;
        this.__super( msgs );
    },


    'override protected onFieldError': function( field, msg )
    {
        field.applyStyle( this._style, msg );
    },


    'override protected onFieldFixed': function( field )
    {
        field.revokeStyle( this._style );
    }
} );
