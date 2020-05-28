/**
 *  Grid Group UI
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
 *
 */

var Class   = require( 'easejs' ).Class,
    GroupUi = require( './GroupUi' );

module.exports = Class( 'GridGroupUi' ).extend( GroupUi,
{
    /**
     * Target parent element
     *
     * @prop {HTMLElement} _grid
     */
    'private _grid': null,


    /**
     * Called when the group is visited
     */
    'override public visit': function()
    {
        // Force-visit the children before the parent due to race condition
        this._children.forEach( child => child.visit() );

        const column_count = this._getColumnCount();

        this._setColumnClass( column_count );
    },


    /**
     * Performs any necessary processing on the content before it's displayed
     *
     * @param {object} quote Quote
     */
    'override protected processContent': function( quote )
    {
        // Sets the parent element
        this.fieldContentParent[ 0 ] = this.content.querySelector( 'dl' );

        this.context.createFieldCache();

        this._grid = this._getGrid();

        if ( this._grid !== null && this._grid.classList.contains( 'locked' ) )
        {
            this.group.locked( true );
        }
    },


    /**
     * Get the count of columns in the grid
     *
     * @return {number} The number of columns
     */
    'private _getColumnCount': function()
    {
        const unique = ( type, i, children ) => children.indexOf( type ) === i;

        let child_count = this._children
            .filter( child => child.cellIsVisible() )
            .map( child => child.getXType() )
            .filter( unique )
            .length;

        return child_count;
    },


    /**
     * This group does not support multiple indexes
     *
     * @return {boolean}
     */
    'protected override supportsMultipleIndex': function()
    {
        return false;
    },


    /**
     * Set a column class on the group
     * Remove existing column classes
     *
     * @param {number} The number of columns
     */
    'private _setColumnClass': function( number )
    {
        const class_class = /col-\d+/;
        const classes = this._grid.classList;

        for ( let index = 0; index < classes.length; index++ )
        {
            const value = classes[ index ];

            if ( class_class.test( value ) )
            {
                this._grid.classList.remove( value );
            }
        }

        this._grid.classList.add( 'col-' + number );
    },


    /**
     * Permit adding only a single index
     *
     * @param {number} index index that has been added
     *
     * @return {GroupUi} self
     */
    'protected override addIndex': function( index )
    {
        if ( index > 0 )
        {
            return this;
        }

        return this.__super( index );
    },

    /**
     * Permit removing only the first index
     *
     * This follows from #addIndex, since only one will ever exist.
     *
     * @param {number} index index that has been removed
     *
     * @return {GroupUi} self
     */
    'protected override removeIndex': function( index )
    {
        if ( index > 0 )
        {
            return this;
        }

        return this.__super( index );
    },


    /**
     * Get the target parent element from the DOM
     *
     * @return {HTMLElement}
     */
    'private _getGrid': function()
    {
        return this.content.querySelector( '.groupGrid' );
    }
} );