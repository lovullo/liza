/**
 * Grid Group UI
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
 *
 */

var Class   = require( 'easejs' ).Class,
    GroupUi = require( './GroupUi' );

module.exports = Class( 'GridGroupUi' ).extend( GroupUi,
{

    /**
     * Called when the group is visited
     */
    'override public visit': function()
    {
        this.__super();

        this._children.forEach( child => child.visit() );

        const COLUMN_WIDTH = ( 100 / this._getColumnCount() ) + "%";

        this._children.forEach( child => child.setColumnWidth( COLUMN_WIDTH ) );
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

        let selector = this.$content[ 0 ].querySelector( '.groupGrid' );

        if ( selector !== null && selector.classList.contains( 'locked' ) )
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

        return Math.max(child_count, 1);
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
    }
} );