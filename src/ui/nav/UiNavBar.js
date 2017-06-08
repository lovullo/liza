/**
 * UiNavBar class
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

var Class        = require( 'easejs' ).Class,
    EventEmitter = require( 'events' ).EventEmitter;


/**
 * Hooks navigation bar
 *
 * In the future, the navigation bar will be generated on the fly rather than
 * being passed into this class.  (written ~2010; 2017: nope, not yet!)
 *
 * Supported events:
 *   click - when a navigation item is clicked
 */
module.exports = Class( 'UiNavBar' )
    .extend( EventEmitter,
{
    /**
     * jQuery object
     * @type {jQuery}
     */
    'private _jquery': null,

    /**
     * DOM element representing the navigation bar (to hook)
     * @type {jQuery}
     */
    'private _$bar': null,


    /**
     * Initializes nav bar
     *
     * @param {jQuery} jquery jQuery object
     * @param {jQuery} $bar   HTML element representing navigation bar
     *
     * @return {undefined}
     */
    'public __construct': function( jquery, $bar )
    {
        this._jquery = jquery;
        this._$bar   = $bar;

        this._initNavBar();
    },


    /**
     * Hooks the navigation bar to permit navigation
     *
     * @return {undefined}
     */
    'private _initNavBar': function()
    {
        var _self   = this,
            step_id = 0;

        this._$bar.find( 'li' ).each( function( i )
        {
            ( function( step_id )
            {
                _self._jquery( this ).click( function( event )
                {
                    // prevent the URL from changing
                    event.preventDefault();

                    _self.emit( 'click', step_id );
                });
            } ).call( this, ( i + 1 ) );
        });
    }
} );

