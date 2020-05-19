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

module.exports = Class( 'GridcellGroupUi' ).extend( GroupUi,
{
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
        this.content.style.width = width;
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
     * Read all data attributes
     */
    'private _processDataAttributes': function()
    {
        this._x_type = this.content.getAttribute( 'data-x-type' );
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
} );
