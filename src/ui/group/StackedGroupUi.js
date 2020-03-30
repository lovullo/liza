/**
 * Flat UI group with stacked indexes
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


/**
 * Stacks groups of field indexes one atop of another, similar to how groups
 * themselves appear.
 *
 * Does not yet support user adding or removing indexes.
 */
module.exports = Class( 'StackedGroupUi' )
    .extend( GroupUi,
{
    /**
     * Containing group DOM element
     */
    'private _container': null,

    /**
     * Definition list of each stacked item
     */
    'private _dl': null,


    /**
     * Process group before initial display
     *
     * @param {Quote} quote active quote
     *
     * @return {undefined}
     */
    'override protected processContent': function( quote )
    {
        this._container = this.content.querySelector( 'div.stacked-container' );

        this._dl = this._container.querySelector( 'dl' );

        this.fieldContentParent[ 0 ] = this._dl;

        this.initGroupContext();

        this._dl.parentNode.removeChild( this._dl );
    },


    /**
     * Add index (stacked item)
     *
     * @param {number} index index that has been added (0-indexed)
     *
     * @return {StackedGroupUi} self
     */
    'protected override addIndex': function( index )
    {
        this.__super( index );

        const item = this._dl.cloneNode( true );

        // properly name the elements to prevent id conflicts
        this.setElementIdIndexes( item.getElementsByTagName( '*' ), index );

        // Set field content parent for this index
        this.fieldContentParent[ index ] = item;

        // add the index to the row title
        item.querySelector( 'span.item-index' ).textContent = ' ' + ( index + 1 );

        this._container.appendChild( item );

        // Todo: Transitional step to remove jQuery
        var $item = this.jquery( item );

        this.styler.apply( $item );
        this.postAddRow( $item, index );

        return this;
    },


    /**
     * Remove index (stacked item)
     *
     * @param {number} index index that has been removed (0-indexed)
     *
     * @return {StackedGroupUi} self
     */
    'protected override removeIndex': function( index )
    {
        const item = this._container
            .querySelector( 'dl:last-child' );

        this.styler.remove( this.jquery( item ) );

        return this.__super( index );
    },


    /**
     * Hide the header if there are no visible fields
     *
     * @param field
     * @param index
     */
    'public override hideField'( field, index )
    {
        this.__super( field, index );

        if ( !this.hasVisibleField( index ) )
        {
            // This possible effects of ignoring these errors has been
            // deemed less severe than the current effects when it fails
            // (i.e. showing all the questions).
            // This will also eventually be changed to have the elements
            // be hidden by default and show when appropriate. This will
            // likely fix the current issue and reduce the chances of
            // something like this happening.
            try {
                const header = this._container.querySelectorAll( 'dl' )[ index ];

                if ( header !== undefined )
                {
                    header.classList.add( 'hidden' );
                }
            }
            catch( e )
            {
                console.warn( e );
            }
        }
    },


    /**
     * Show the header if there are visible fields
     *
     * @param field
     * @param index
     */
    'public override showField'( field, index )
    {
        this.__super( field, index );

        if ( this.hasVisibleField( index ) )
        {
            const header = this._container.querySelectorAll( 'dl' )[ index ];

            if ( header !== undefined )
            {
                header.classList.remove( 'hidden' );
            }
        }

    }
} );
