/**
 * Group collapsable table UI
 *
 *  Copyright (C) 2015 R-T Specialty, LLC.
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


module.exports = Class( 'CollapseTableGroupUi' )
    .extend( GroupUi,
{
    /**
     * Percentage width of the left column
     * @type {number}
     */
    'private const WIDTH_COL_LEFT_PERCENT': 30,

    /**
     * Base rows for each unit
     * @type {jQuery}
     */
    'private _$baseRows': null,

    /**
     * Number of rows in the unit
     * @type {number}
     */
    'private _rowCount': 0,

    /**
     * Indexes to use for styled elements
     * @type {number}
     */
    'private _elementIndex': 1,

    /**
     * Flags that, when true in the bucket, will replace each individual row
     * with a single cell (used for ineligibility, for example
     *
     * @type {Array.<string>}
     */
    'private _blockFlags': [],

    /**
     * Contains true/false values of each of the block flags
     * @var {Object}
     */
    'private _blockFlagValues': {},

    /**
     * Summary to display on unit row if block flag is set
     * @var {string}
     */
    'private _blockFlagSummary': '',

    'private _blockDisplays': null,



    'override protected processContent': function()
    {
        this._processTableRows();

        // determine if we should lock this group down
        if ( this.$content.find( '.groupTable' ).hasClass( 'locked' ) )
        {
            this.group.locked( true );
        }

        // if the group is locked, there will be no adding of rows
        if ( this.group.locked() )
        {
            this.$content.find( '.addrow' ).remove();
        }

        var $tbody = this.$content.find( 'tbody' );

        // block flags are comma-separated (derived from the XML, which has
        // comma-separated values for consistency with the other properties)
        this._blockFlags       = $tbody.attr( 'blockFlags' ).split( ',' );
        this._blockFlagSummary = $tbody.attr( 'blockFlagSummary' ) || '';

        this._blockDisplays = this._getBlockDisplays();
    },


    'private _processTableRows': function()
    {
        this._$baseRows = this.$content
            .find( 'tbody > tr:not(.footer)' )
            .detach();

        this._calcColumnWidths();

        this._rowCount  = this._$baseRows.length;
    },


    /**
     * Retrieve and detach block-mode displays for each column
     *
     * @return {jQuery} block-mode display elements
     */
    'private _getBlockDisplays': function()
    {
        return this.$content
            .find( 'div.block-display' )
            .detach();
    },


    /**
     * Calculates column widths
     *
     * Ensures that the left column takes up a consistent amount of space and
     * that each of the remaining columns are distributed evenly across the
     * remaining width of the table.
     *
     * As a consequence of this operation, any table with N columns will be
     * perfectly aligned with any other table of N columns.
     *
     * See FS#7916 and FS#7917.
     *
     * @return {undefined}
     */
    'private _calcColumnWidths': function()
    {
        // the left column will take up a consistent amount of width and the
        // remainder of the width (in percent) will be allocated to the
        // remaining columns
        var left   = this.__self.$( 'WIDTH_COL_LEFT_PERCENT' ),
            remain = 100 - left,

            // we will calculate and apply the width to the parent columns (this
            // allows subcols to vary, which we may not want, but ensures that
            // tables of N columns will always be aligned even if they have no
            // subcolumns)
            $cols = this.$content.find( 'tr:nth(0) > th:not(:first)' ),
            count = $cols.length,

            width = Math.floor( remain / count );

        // set the widths of the left column and each of the remaining columns
        this.$content.find( 'tr:first > th:first' )
            .attr( 'width', ( left + '%' ) );

        $cols.attr( 'width', ( width + '%' ) );
    },


    /**
     * Collapses all units
     *
     * @param {jQuery} $unit unit to collapse
     *
     * @return {undefined}
     */
    'private _collapse': function( $unit )
    {
        $unit.filter( ':not(.unit)' ).hide();

        $unit.filter( '.unit' )
            .addClass( 'collapsed' )
            .find( 'td:first' )
                .addClass( 'first' )
                .addClass( 'collapsed' );
    },


    /**
     * Initializes unit toggle on click
     *
     * @param {jQuery} $unit unit to initialize toggle on
     *
     * @return {undefined}
     */
    'private _initToggle': function( $unit )
    {
        $unit.filter( 'tr.unit' )
            // we set the CSS here because IE doesn't like :first-child
            .css( 'cursor', 'pointer' )
            .click( function()
            {
                var $node = $( this );

                $node.filter( '.unit' )
                    .toggleClass( 'collapsed' )
                        .find( 'td:first' )
                        .toggleClass( 'collapsed' );

                $node.nextUntil( '.unit, .footer' ).toggle();
            } )
            .find( 'td:first' )
                .addClass( 'first' );
    },


    'private _getTableBody': function()
    {
        return this.$content.find( 'tbody' );
    },


    /**
     * Determines if the block flag is set for any column and converts it to a
     * block as necessary
     *
     * This looks more complicated than it really is. Here's what we're doing:
     *  - For the unit row:
     *    - Remove all cells except the first and span first across area
     *  - For all other rows:
     *    - Remove all but the first cell
     *    - Expand first cell to fit the area occupied by all of the removed
     *      cells
     *    - Replace content with text content of the flag
     *    - Adjust width slightly so it doesn't take up too much room
     *
     * @param {jQuery} $unit generated unit nodes
     *
     * @return {undefined}
     */
    'private _initBlocks': function( $unit )
    {
        for ( var i = 0, len = this._blockFlags.length; i < len; i++ )
        {
            var flag  = this._blockFlags[ i ];

            // ignore if the flag is not set
            if ( this._blockFlagValues[ flag ] === false )
            {
                continue;
            }

            var $rows = $unit.filter( 'tr:not(.unit)' ),
                $cols = $rows.find( 'td[columnIndex="' + i + '"]' ),

                col_len = $rows
                    .first()
                    .find( 'td[columnIndex="' + i + '"]' )
                    .length
            ;

            // combine cells in unit row and remove content
            $unit.filter( '.unit' )
                .find( 'td[columnIndex="' + i + '"]' )
                    .filter( ':not(:first)' )
                        .remove()
                    .end()
                    .attr( 'colspan', col_len )
                    .addClass( 'blockSummary' )

                    // TODO: this doesn't really belong here; dynamic block flag
                    // summaries would be better
                    .text( ( /Please wait.../.test( '' ) )
                        ? 'Please wait...'
                        : this._blockFlagSummary
                    );


            // remove all cells associated with this unit except for the first,
            // which we will expand to fill the area previously occupied by all
            // the cells and replace with the content of the block flag (so it's
            // not really a flag; I know)
            $cols
                .filter( ':not(:first)' )
                    .remove()
                .end()
                .addClass( 'block' )
                .attr( {
                    colspan: col_len,
                    rowspan: $rows.length
                } )
                .html( '' )
                .append( this._blockDisplays[ i ] );
        }
    },


    /**
     * Returns all rows associated with a unit index
     *
     * The provided index is expected to be 1-based.
     *
     * @param {number} index 1-based index of unit
     *
     * @return {jQuery} unit rows
     */
    'private _getUnitByIndex': function( index )
    {
        return this._getTableBody()
            .find( 'tr.unit:not(.footer):nth(' + index + ')' )
            .nextUntil( '.unit, .footer' )
            .andSelf();
    },


    'public addRow': function()
    {
        var $unit = this._$baseRows.clone( true ),
            index = this.getCurrentIndex();

        // properly name the elements to prevent id conflicts
        this.setElementIdIndexes( $unit.find( '*' ), index );

        // add the index to the row title
        $unit.find( 'span.rowindex' ).text( ' ' + ( index + 1 ) );

        // add to the table (before the footer, if one has been provided)
        var footer = this._getTableBody().find( 'tr.footer' );
        if ( footer.length > 0 )
        {
            footer.before( $unit );
        }
        else
        {
            this._getTableBody().append( $unit );
        }

        // finally, style our new elements
        this.styler.apply( $unit );

        // the unit should be hidden by default and must be toggle-able (fun
        // word)
        this._initBlocks( $unit );
        this._initToggle( $unit );

        // this will handle post-add processing, such as answer hooking
        this.postAddRow( $unit, index );
    },


    'public removeRow': function()
    {
        var $rows = this._getUnit( this.getCurrentIndex() );

        // remove rows
        this.styler.remove( $rows );
        $rows.remove();

        return this;

    },


    'private _getUnit': function( index )
    {
        var start = this._rowCount * index;

        return this._getTableBody()
            .find( 'tr:nth(' + start + '):not( .footer )' )
            .nextUntil( '.unit, .footer' )
            .andSelf();
    },


    'override public preEmptyBucket': function( bucket, updated )
    {
        // retrieve values for each of the block flags
        for ( var i = 0, len = this._blockFlags.length; i < len; i++ )
        {
            var flag = this._blockFlags[ i ];

            this._blockFlagValues[ flag ] =
                bucket.getDataByName( flag )[ 0 ] || false;
        }

        var _super = this.__super;

        // remove and then re-add each index (the super method will re-add)
        // TODO: this is until we can properly get ourselves out of block mode
        while ( this.getCurrentIndexCount() )
        {
            this.removeIndex();
        }

        _super.call( this, bucket );
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
    }
} );
