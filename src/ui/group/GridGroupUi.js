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
     * Reference to quote object
     *
     * @prop {ClientQuote}
     */
    'private _quote': null,

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
     * Details pane
     *
     * @prop {HTMLElement}
     */
    'private _details': null,

    /**
     * Reference to the group's marker on the x-axis
     *
     * @prop {string}
     */
    'private _x_type': null,

    /**
     * If group is selected
     *
     * @prop {boolean}
     */
    'private _is_selected': false,

    /**
     * Bucket key for currently selected group
     *
     * @prop {string}
     */
    'private _selected_current_key': null,

    /**
     * Bucket key for list of selected group
     *
     * @prop {string}
     */
    'private _selected_list_key': null,

    /**
     * Selectd bucket value of group
     *
     * @prop {string}
     */
    'private _selected_value': null,

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
        return this._is_selected;
    },


    /**
     * Select the group
     */
    'public select': function()
    {
        this._is_selected = true;

        this.content.classList.remove( "deselected" );
        this.content.classList.add( "selected" );

        this._setSelectedData();
    },


    /**
     * Deselect the group
     */
    'public deselect': function()
    {
        if ( this.isSelected() )
        {
            this._is_selected = false;

            this.content.classList.remove( "selected" );
            this.content.classList.add( "deselected" );

            this._setSelectedData();
        }
    },


    /**
     * Set selected if selected value
     * is already set in the bucket
     */
    'private _setSelectedStatus': function()
    {
        if ( this._selected_list_key === null
            || this._selected_value === null )
        {
            return;
        }

        const list_values = this._quote.getDataByName( this._selected_list_key );

        if ( Array.isArray( list_values )
            && list_values.indexOf( this._selected_value ) > -1 )
        {
            this.select();
        }
    },


    /**
     * Update the selected value in the bucket
     */
    'private _setSelectedData': function()
    {
        // Do not continue if any data attributes are missing
        if ( this._selected_current_key === null
            || this._selected_list_key === null
            || this._selected_value === null )
        {
            return;
        }

        var list_values = this._quote.getDataByName( this._selected_list_key );
        var update_data = false;

        if ( Array.isArray( list_values ) )
        {
            const value_index = list_values.indexOf( this._selected_value );
            var set_current = [];

            // If selected and value not found in array
            if ( this.isSelected() === true && value_index === -1 )
            {
                update_data = true;

                // Add the group value
                list_values.push( this._selected_value );

                // Remove empty values
                list_values = list_values.filter( item => item !== "" );

                set_current = [ this._selected_value ];
            }
            // If deselected and value is found in array
            else if ( this.isSelected() === false && value_index > -1 )
            {
                update_data = true;

                // Remove the group value
                list_values = list_values.filter( item => item !== this._selected_value );

                // Force data to be overwritten
                list_values.push( null );

                const current_select = this._quote.getDataByName( this._selected_current_key );

                if ( Array.isArray( current_select )
                    && current_select.indexOf( this._selected_value ) > -1 )
                {
                    // clear current selected value
                    set_current = [];
                }
                else
                {
                    // If selected value not set, keep current value
                    set_current = current_select;
                }
            }

            if ( update_data )
            {
                this._quote.setData( {
                    [ this._selected_list_key ]:    list_values,
                    [ this._selected_current_key ]: set_current
                } );
            }
        }
    },


    /**
     * Determine if the details pane is open
     *
     * @return {boolean} if the details pane is open
     */
    'public areDetailsOpen': function()
    {
        if ( this._details === null )
        {
            return false;
        }

        return this.content.classList.contains( "details-open" );
    },


    /**
     * Open the details pane
     *
     * @param {AncestorAwareStyler[]} stylers
     */
    'public openDetails': function( stylers )
    {
        if ( this._details !== null )
        {
            this.content.classList.add( "details-open" );

            const ancestor = 3;

            stylers.forEach( styler => styler.style( this._details, ancestor ) );
        }
    },


    /**
     * Close the details pane
     *
     * @param {AncestorAwareStyler[]} stylers
     */
    'public closeDetails': function( stylers )
    {
        if ( this.areDetailsOpen() )
        {
            this.content.classList.remove( "details-open" );

            const ancestor = 3;

            stylers.forEach( styler => styler.style( this._details, ancestor ) );
        }
    },


    /**
     * Process content of the group
     *
     * @param {ClientQuote} quote target quote
     */
    'override protected processContent': function( quote )
    {
        this._box     = this._getBox();
        this._details = this._getDetails();
        this._quote   = quote;

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
     * Get the targeted div of the details pane
     *
     * @return {HTMLElement} details pane div
     */
    'private _getDetails': function()
    {
        return this.content.querySelector( ".details-pane" );
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

        this._selected_current_key = this._box.getAttribute( 'data-selected-current-key' ) || null;
        this._selected_list_key    = this._box.getAttribute( 'data-selected-list-key' ) || null;
        this._selected_value       = this._box.getAttribute( 'data-selected-value' ) || null;

        this._setSelectedStatus();

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

        if ( isDisabled )
        {
            // Ensure the group is deselected
            this.deselect();
        }
    },
} );
