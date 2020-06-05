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
 */

var Class   = require( 'easejs' ).Class,
    GroupUi = require( './GroupUi' );

module.exports = Class( 'GridGroupUi' ).extend( GroupUi,
{
    /**
     * Reference to the bucket
     *
     * @prop {Bucket}
     */
    'private _bucket': null,

    /**
     * Categories pertaining to the group
     *
     * @prop {string[]}
     */
    'private _categories': [],

    /**
     * Inner container
     *
     * @prop {HTMLElement}
     */
    'private _box': null,

    /**
     * Reference to the group's marker on the x-axis
     *
     * @prop {string}
     */
    'private _x_type': null,

    /**
     * If the group is visible
     *
     * @prop {boolean}
     */
    'private _is_visible': false,


    /**
     * Get the group's visibility
     *
     * @return {boolean} if the group is visibile
     */
    'public isVisible': function()
    {
        return this._is_visible;
    },


    /**
     * Read the x-type of this group
     *
     * The x-type is an identifier for the column that this group belongs to.
     *
     * @return {string} the x-type of the group
     */
    'public getXType': function()
    {
        return this._x_type;
    },


    /**
     * Read the categories of this group
     *
     * Categories are tags on a group that imply behavior.
     *
     * @return {string[]} the categories of the group
     */
    'public getCategories': function()
    {
        return this._categories;
    },


    /**
     * Called when the group is visited
     */
    'override public visit': function()
    {
        this._processDataAttributes();
        this._processClasses();
        this._setState();
    },


    /**
     * Determine if the group is selected
     *
     * @return {boolean} if the group is selected
     */
    'public isSelected': function()
    {
        return this.content.classList.contains( "selected" );
    },


    /**
     * Select the group
     */
    'public select': function()
    {
        this.content.classList.remove( "deselected" );
        this.content.classList.add( "selected" );
    },


    /**
     * Deselect the group
     */
    'public deselect': function()
    {
        if ( this.isSelected() )
        {
            this.content.classList.remove( "selected" );
            this.content.classList.add( "deselected" );
        }
    },


    /**
     * Process content of the group
     *
     * @param {ClientQuote} quote target quote
     */
    'override protected processContent': function( quote )
    {
        this._box = this._getBox();

        quote.visitData( bucket =>
        {
            this._bucket = bucket;

            this._bucket.on( 'stagingUpdate', () => this._setState() );
        } );
    },


    /**
     * Get the targeted inner div
     *
     * @return {HTMLElement} inner div
     */
    'private _getBox': function()
    {
        return this.content.querySelector( "div" );
    },


    /**
     * Set the current state of the group
     */
    'private _setState': function() {
        this._setPending( this._state_manager.is( "pending", this._bucket ) );

        if ( this._state_manager.observes( "disabled" ) )
        {
            this._setDisabled(
                this._state_manager.is( "disabled", this._bucket )
            );
        }
    },


    /**
     * Read all data attributes
     */
    'private _processDataAttributes': function()
    {
        this._x_type = this._box.getAttribute( 'data-x-type' );

        this._state_manager.processDataAttributes( this._box );

        const categories = this._box.getAttribute( 'data-categories' );

        if ( categories )
        {
            this._categories = categories.split( /\s+/ );
        }

        this._state_manager.processDataAttributes( this._box );
    },


    /**
     * Process class-related data
     */
    'private _processClasses': function()
    {
        this._is_visible = this.content.classList.contains( 'is-visible' );

        const operation = this._is_visible ? "remove" : "add";

        this.content.classList[ operation ]( 'hidden' );
    },


    /**
     * Apply the pending state to this group
     *
     * @param {boolean} isPending if the group is pending
     */
    'private _setPending': function( isPending )
    {
        const operation = isPending ? "add" : "remove";

        this.content.classList[ operation ]( "pending" );
    },


    /**
     * Apply the disabled state to this group
     *
     * @param {boolean} isDisabled if the group is disabled
     */
    'private _setDisabled': function( isDisabled )
    {
        const operation = isDisabled ? "add" : "remove";

        this.content.classList[ operation ]( "disabled" );
    },
} );
