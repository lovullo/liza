/**
 * Group table UI
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
 * @needsLove
 *   - Remove reliance on jQuery.
 *   - Dependencies need to be liberated: Styler; Group.
 * @end needsLove
 */

var Class   = require( 'easejs' ).Class,
    GroupUi = require( './GroupUi' );


/**
 * Represents a table group
 *
 * This class extends from the generic Group class.  It contains logic to
 * support table groups, allowing for the adding and removal of rows.
 */
module.exports = Class( 'TableGroupUi' )
    .extend( GroupUi,
{
    /**
     * Stores the base row to be duplicated for table groups
     * @type {jQuery}
     */
    $baseRow: null,


    /**
     * Template method used to process the group content to prepare it for
     * display and retrieve common data
     *
     * @return void
     */
    'override protected processContent': function( quote )
    {
        // determine if we should lock this group down
        if ( this.$content.find( 'table' ).hasClass( 'locked' ) )
        {
            this.group.locked( true );
        }

        this._processTables();
        this._attachAddRowHandlers();
        this.watchFirstElement( this.$baseRow, quote );
    },


    /**
     * Attaches the add row event handlers so new rows are added on click
     *
     * @return void
     */
    _attachAddRowHandlers: function()
    {
        // reference to ourself for use in the closure
        var _self = this;

        // if we're locked, then there'll be no row adding
        if ( this.group.locked() )
        {
            this._getAddRowButton().remove();
            return;
        }

        // any time an .addrow element is clicked, we want to add a row to the
        // group
        this._getAddRowButton().click( function()
        {
            // initialize a new index
            _self.initIndex();
        });
    },


    /**
     * Processes tables, preparing them for row duplication
     *
     * The first row is used as the model for duplication. It is removed from
     * the DOM and stored in memory, which will be later cloned. It is stored
     * unstyled to make manipulation easier and limit problems with restyling.
     *
     * This was chosen over simply duplicating and clearing out the first row
     * because we (a) have a clean slate and (b) Dojo does not work well if you
     * duplicate dijit HTML.
     *
     * @return void
     */
    _processTables: function()
    {
        // reference to ourself for use in the closure
        var groupui = this;

        // if we're locked down, we won't be removing any rows
        if ( this.group.locked() )
        {
            this.$content.find( '.delrow' ).remove();
        }

        // remove the first row of the group tables
        this.$content.find( '.groupTable > tbody > tr:first' )
            .each( function( i )
            {
                // remove the row and store it in memory as the base row, which
                // will be used for duplication (adding new rows)
                //
                // NOTE: detach() must be used rather than remove(), because
                // remove() also removes any data attached to the element
                groupui.$baseRow = $( this ).detach();
            }
        );
    },


    /**
     * Returns the table associated with the given group id
     *
     * @return jQuery group table
     */
    _getTable: function()
    {
        return this.$content.find( 'table.groupTable' );
    },


    /**
     * Returns the row of the group table for the specified group and row id
     *
     * @param Integer row_id id of the row to retrieve
     *
     * @return jQuery group table row
     */
    _getTableRow: function( row_id )
    {
        row_id = +row_id;

        return this._getTable().find(
            'tbody > tr[id=' + this._genTableRowId( row_id ) + ']'
        );
    },


    'private _getLastTableRow': function()
    {
        return this._getTableRow( this.getCurrentIndex() );
    },


    /**
     * Generates the id to be used for the group table row
     *
     * This id lets us find the row for styling and removal.
     *
     * @param Integer row_id id of the row
     *
     * @return String row id for the table row
     */
    _genTableRowId: function( row_id )
    {
        row_id = +row_id;
        return ( this.getGroupId() + '_row_' + row_id );
    },


    /**
     * Returns the element used to add rows to the table
     *
     * @return jQuery add row element
     */
    _getAddRowButton: function()
    {
        return this.$content.find( '.addrow:first' );
    },


    /**
     * Adds a row to a group that supports rows
     *
     * @return Step self to allow for method chaining
     */
    addRow: function()
    {
        var $group_table = this._getTable();
        var row_count    = $group_table.find( 'tbody > tr' ).length;
        var max          = this.group.maxRows();
        var _self        = this;

        // hide the add row button if we've reached the max
        if ( max && ( row_count == ( max - 1 ) ) )
        {
            this._getAddRowButton().hide();
        }

        // html of first group_row
        var $row_base = this.$baseRow;
        if ( $row_base === undefined )
        {
            throw "NoBaseRow " + this.getGroupId();
        }

        // duplicate the base row
        $row_new = $row_base.clone( true );

        // increment row ids
        var new_index = this._incRow( $row_new );

        // Set field content parent for this index
        this.fieldContentParent[ new_index ] = $row_new[ 0 ];

        // attach remove event
        var $del = $row_new.find( 'td.delrow' );
        $del.click( function()
        {
            _self.destroyIndex( new_index );
        } );

        // append it to the group
        $group_table.find( 'tbody' ).append( $row_new );

        // aplying styling
        this._applyStyle( new_index );

        // raise event
        this.postAddRow( $row_new, $row_new.index() );

        return this;
    },


    /**
     * Increments the index of the elements in the row
     *
     * This generates both a new name and a new id. The formats expected are:
     *   - name: foo[i]
     *   - id:   foo_i
     *
     * @param jQuery $row  row to increment
     *
     * @return Integer the new index
     */
    _incRow: function( $row )
    {
        var new_index = this.getCurrentIndex();
        var row       = $row[ 0 ];

        // update the row id
        $row.attr( 'id', this._genTableRowId( new_index ) );

        // properly name the elements to prevent id conflicts
        this.setElementIdIndexes( row.getElementsByTagName( '*' ), new_index );

        return new_index;
    },


    /**
     * Applies UI transformations to a row
     *
     * @param Integer row_id id of the row to be styled
     *
     * @return Step self to allow for method chaining
     */
    'private _applyStyle': function( row_id )
    {
        // style only the specified row
        this.styler.apply( this._getTableRow( row_id ), true );

        return this;
    },


    /**
     * Removes the specified row from a group
     *
     * @return Step self to allow for method chaining
     */
    removeRow: function()
    {
        // get parent table and row count
        var $group_table = this._getTable(),
            $row         = this._getLastTableRow(),
            row_index    = $row.index(),
            row_count    = $group_table.find( 'tbody > tr' ).length,
            group        = this;

        // cleared so they can be restyled later)
        this.styler.remove( $row );
        $row.remove();

        // re-add the add row button
        this._getAddRowButton().show();

        return this;
    },


    'override protected addIndex': function( index )
    {
        // increment id before doing our own stuff
        this.__super( index );
        this.addRow();

        return this;
    },


    'override public removeIndex': function( index )
    {
        // remove our stuff before decrementing our id
        this.removeRow();
        this.__super( index );

        return this;
    },


    /**
     * Returns all elements that are a part of the column at the given index
     *
     * @param Integer index column position (0-based)
     *
     * @return jQuery collection of matched elements
     */
    _getColumnElements: function( index )
    {
        index = +index;

        return this._getTable().find(
            'thead th:nth(' + index + '), ' +
            'tr > td:nth-child(' + ( index + 1 ) + ')'
        );
    },


    'override protected doHideField': function( field, index )
    {
        var $element = this.getElementByName( field, index ),
            $parent  = $element.parents( 'td' ),
            cindex   = $parent.index();

        $parent.append( $( '<div>' )
            .addClass( 'na' )
            .text( 'N/A' )
        );
        $element.hide();

        this._checkColumnVis( field, cindex );
    },


    'override protected doShowField': function( field, index )
    {
        var $element = this.getElementByName( field, index ),
            $parent  = $element.parents( 'td' ),
            cindex   = $parent.index();

        $parent.find( '.na' ).remove();
        $element.show();

        this._checkColumnVis( field, cindex );
    },


    'private _checkColumnVis': function( field, cindex )
    {
        var $e = this._getColumnElements( cindex );

        if ( this.isFieldVisible( field ) )
        {
            $e.stop( true, true ).slideDown( 500 );
        }
        else
        {
            $e.stop( true, true ).slideUp( 500 );
        }
    },


    /**
     * Shows/hides add/remove row buttons
     *
     * @param {boolean} value whether to hide (default: true)
     *
     * @return {TableGroupUi} self
     */
    hideAddRemove: function( value )
    {
        if ( value === true )
        {
            this._getAddRowButton().hide();
            this.$content.find( '.delrow' ).hide();
        }
        else
        {
            this._getAddRowButton().show();
            this.$content.find( '.delrow' ).show();
        }

        return this;
    },


    /**
     * Returns the number of rows currently in the table
     *
     * @return {number}
     */
    'public getRowCount': function()
    {
        return this.getCurrentIndexCount();
    }
} );
