/**
 * Grid Cell Group UI
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

module.exports = Class( 'GridcellGroupUi' ).extend( GroupUi,
{
    /**
     * Target parent element
     *
     * @prop {HTMLElement} _box
     */
    'private _box': null,

    /**
     * Reference to the cell's marker on the x-axis
     *
     * @prop {string} _x_type
     */
    'private _x_type': null,

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
     * Set the width of this cell
     *
     * @param {string} width
     */
    'public setColumnWidth': function ( width )
    {
        this._box.style.width = width;
    },


    /**
     * Called when the group is visited
     */
    'override public visit': function()
    {
        this.__super();

        this._processDataAttributes();
        this._processClasses();
    },


    /**
     * Performs any necessary processing on the content before it's displayed
     *
     * @param {object} quote Quote
     */
    'override protected processContent': function( quote )
    {
        this._box = this._getBox();
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
        this._cell_visible = this._box.classList.contains( 'cell-visible' );

        const operation = this._cell_visible ? "remove" : "add";
        this._box.classList[ operation ]( 'hidden' );
    },


    /**
     * Get the target parent element from the DOM
     *
     * @return {HTMLElement}
     */
    'private _getBox': function()
    {
        return this.$content[ 0 ];
    }
} );
