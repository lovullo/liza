/**
 * N/A field styler
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
 * Style fields that are not applicable (and so do not need to collect data
 * from the user)
 */
module.exports = Class( 'NaFieldStyler' )
    .extend( FieldStyler,
{
    /**
     * Retrieve unique identifier
     *
     * @return {string} unique identifier
     */
    'public getId': function()
    {
        return 'na';
    },


    /**
     * Apply style to field
     *
     * @param {DomField}            field   field to style
     * @param {HTMLElement}         element DOM element to style
     * @param {Array.<HTMLElement>} row     DOM elements of containing row
     *
     * @return {FieldStyler} self
     */
    'public applyStyle': function( field, element, row )
    {
        this.addClass( element, 'hidden' );

        // this is a workaround from the old days where jQuery would add
        // styles to hide elements, which we wanted to override; this can be
        // removed once jQuery is eradicated from the framework
        element.style = '';

        for ( var i in row )
        {
            this.addClass( row[ i ], 'hidden' );
            row[ i ].style = '';
        }
    },


    /**
     * Remove style from field
     *
     * @param {DomField}            field   field to unstyle
     * @param {HTMLElement}         element DOM element to unstyle
     * @param {Array.<HTMLElement>} row     DOM elements of containing row
     *
     * @return {FieldStyler} self
     */
    'public revokeStyle': function( field, element, row )
    {
        this.removeClass( element, 'hidden' );
        this.removeClass( row, 'hidden' );
    }
} );
