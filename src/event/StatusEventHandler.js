/**
 * Field status event handler
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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

var Class        = require( 'easejs' ).Class,
    EventHandler = require( './EventHandler' );


/**
 * Performs rate requests
 */
module.exports = Class( 'StatusEventHandler' )
    .implement( EventHandler )
    .extend(
{
    /**
     * Styler used to manipulate the DOM
     *
     * TODO: deprecate
     *
     * @type {ElementStyler}
     */
    'private _styler': null,


    /**
     * Initializes with client that will delegate the event
     *
     * @param {ElementStyler} styler element styler
     */
    __construct: function( styler )
    {
        this._styler = styler;
    },


    /**
     * Handles kick-back
     *
     * @param {string} type event id; ignored
     *
     * @param {function(*,Object)} continuation to invoke on completion
     *
     * @return {StatusEventHandler} self
     */
    'public handle': function( type, c, data )
    {
        var indexes = data.indexes || [],
            value   = data.value || '',
            name    = data.elementName;

        for ( var i in indexes )
        {
            // string means a static value; otherwise, an array
            // represents bucket values, of which we should take the
            // associated index
            var value = ( typeof value === 'string' )
                ? value
                : value[ i ];

            this._styler.setStatus( name, indexes[ i ], value );
        }
    }
} );
