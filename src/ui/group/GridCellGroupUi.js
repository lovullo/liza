/**
 *  Grid Cell Group UI
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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
    GroupUi = require( './GroupUi' );

module.exports = Class( 'GridCellGroupUi' ).extend( GroupUi,
{
    /**
     * Reference to the cell's marker on the x-axis
     *
     * @prop {string} _x_type
     */
    'private _x_type': null,

    /**
     * Target inner div
     *
     * @prop {HTMLElement} _box
     */
    'private _box': null,

    /**
     * If the cell is visible
     *
     * @prop {boolean} _cell_visible
     */
    'private _cell_visible': false,


    /**
     * Get the cell's visibility
     *
     * @return {boolean}
     */
    'public cellIsVisible': function()
    {
        return this._cell_visible;
    },


    /**
     * Read the x-type of this cell. The x-type is an identifier for the column
     * that this cell belongs to.
     *
     * @return {string}
     */
    'public getXType': function()
    {
        return this._x_type;
    },


    /**
     * Called when the group is visited
     */
    'override public visit': function()
    {

        this._processDataAttributes();
        this._processClasses();
        this._addEventListeners();
    },


    /**
     * Process content of the group
     *
     * @param {ClientQuote} quote Quote
     */
    'override protected processContent': function( quote )
    {
        this._box = this._getBox();
    },


    /**
     * Get the targeted inner div
     *
     * @return {HTMLElement} Inner div
     */
    'private _getBox': function()
    {
        return this.content.querySelector( "div" );
    },


    /**
     * Read all data attributes
     */
    'private _processDataAttributes': function()
    {
        this._x_type = this._box.getAttribute( 'data-x-type' );
    },


    /**
     * Process class-related data
     */
    'private _processClasses': function()
    {
        this._cell_visible = this.content.classList.contains( 'cell-visible' );

        const operation = this._cell_visible ? "remove" : "add";
        this.content.classList[ operation ]( 'hidden' );
    },


    /**
     * Add event listeners to the cell
     */
    'private _addEventListeners': function()
    {
        const content = this.content.querySelector( ".content" );

        if ( content )
        {
            content.addEventListener( "click", this._onContentClick );
        }

        const actions = this.content.querySelector( ".actions" );

        if ( actions )
        {
            actions.addEventListener( "click", this._onActionsClick );
        }
    },


    /**
     * Handle event when content section is clicked
     *
     * @param {MouseEvent} e Click event
     */
    'private _onContentClick': function ( e )
    {
    },


     /**
     * Handle event when actions section is clicked
     *
     * @param {MouseEvent} e Click event
     */
    'private _onActionsClick': function ( e )
    {
    }
} );
