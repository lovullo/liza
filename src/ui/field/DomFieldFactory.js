/**
 * Creates DomField
 *
 *  Copyright (C) 2015, 2016 R-T Specialty, LLC.
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

    BucketField = require( '../../field/BucketField' ),
    DomField    = require( './DomField' );


module.exports = Class( 'DomFieldFactory',
{
    'private _elementStyler': null,


    __construct: function( element_styler )
    {
        this._elementStyler = element_styler;
    },


    /**
     * Create a DomField from the given field description
     *
     * The provided DomField will wait to access the DOM until an operation
     * requires it.
     *
     * @param {string} name  field name
     * @param {number} index field index
     *
     * @param {function(HtmlElement)|HtmlElement} root root element containing
     *                                                 the field (optionally
     *                                                 lazy)
     *
     * @return {DomField} generated field
     */
    'public create': function( name, index, root )
    {
        var _self = this;

        return DomField(
            BucketField( name, index ),

            // lazy load on first access
            function( callback )
            {
                // are we lazy?
                if ( typeof root === 'function' )
                {
                    // wait to fulfill this request until after the element
                    // becomes available
                    root( function( result )
                    {
                        root = result;
                        c();
                    } );

                    return;
                }

                // not lazy; continue immediately
                c();

                function c()
                {
                    callback( _self._elementStyler.getElementByNameLax(
                        name, index, null, root
                    )[0] );
                }
            }
        );
    }
} );
