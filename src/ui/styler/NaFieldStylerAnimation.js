/**
 * Animated N/A field styler
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

var Trait         = require( 'easejs' ).Trait,
    NaFieldStyler = require( './NaFieldStyler' );


/**
 * Sliding animations for field show/hide
 *
 * @todo Use CSS3 once we can drop support for IE<10
 */
module.exports = Trait.extend( NaFieldStyler,
{
    /**
     * jQuery instance
     * @type {jQuery}
     */
    'private _jquery': null,


    /**
     * Prepare mixin with jQuery instance
     *
     * @param {jQuery} jquery jQuery instance
     */
    __mixin: function( jquery )
    {
        this._jquery = jquery;
    },


    /**
     * Animate field display
     *
     * When a field becomes applicable, progressively increase its height
     * ("slide down").
     *
     * @param {HTMLElement}        element field DOM element
     * @param {Array.<HTMLElement} row     parent row elements
     *
     * @return {undefined}
     */
    'override protected showField': function( element, row )
    {
        var $row = this._jquery( row );

        $row.stop( true, true );
        this.__super( element, row );
        $row
            .hide()
            .slideDown( 500 );
    },


    /**
     * Animate field hiding
     *
     * When a field becomes non-applicable, progressively decrease its
     * height ("slide up").
     *
     * @param {HTMLElement}        element field DOM element
     * @param {Array.<HTMLElement} row     parent row elements
     *
     * @return {undefined}
     */
    'override protected hideField': function( element, row )
    {
        var _self     = this,
            all       = [ element ].concat( row ),
            $elements = this._jquery( all );

        $elements.stop( true, true )
            .slideUp( 500, function()
            {
                _self.hideField['super'].call( _self, element, row );
            } );
    }
} );
