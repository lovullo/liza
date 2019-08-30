/**
 * Group tabbed UI
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
 * Represents a tabbed group
 *
 * This class extends from the generic Group class.  It contains logic to
 * support tabbed groups, allowing for the adding and removal of tabs.
 */
module.exports = Class( 'TabbedGroupUi' )
    .extend( GroupUi,
{
    /**
     * Stores the base title for each new tab
     * @type {string}
     */
    $baseTabTitle: '',

    /**
     * Stores the base tab content to be duplicated for tabbed groups
     * @type {jQuery}
     */
    $baseTabContent: null,

    /**
     * Index of the currently selected tab
     * @type {number}
     */
    'private _selectedIndex': 0,


    /**
     * Template method used to process the group content to prepare it for
     * display
     *
     * @return void
     */
    'override protected processContent': function( quote )
    {
        this.__super();

        // determine if we should lock this group down
        if ( this.$content.find( 'div.groupTabs' ).hasClass( 'locked' ) )
        {
            this.group.locked( true );
        }

        this._processTabs();
        this._attachAddTabHandlers();
        this.watchFirstElement( this.$baseTabContent, quote );
    },


    /**
     * Initializes the tabs
     *
     * This method will locate the area of HTML that should be tabbed and
     * initialize it. The content of the first tab will be removed and stored in
     * memory for duplication.
     *
     * @return void
     */
    _processTabs: function()
    {
        var group      = this;
        var $container = this._getTabContainer();

        if ( $container.length == 0 )
        {
            return;
        }

        // grab the title to be used for all the tabs
        this.$baseTabTitle = $container.find( 'li:first' ).remove()
            .find( 'a' ).text();

        // the base content to be used for each of the tabs (detach() not
        // remove() to ensure the data remains)
        this.$baseTabContent = $container.find( 'div:first' ).detach();

        // transform into tabbed div
        $container.tabs( {
            tabTemplate:
                '<li><a href="#{href}">#{label}</a>' +
                ( ( this.group.locked() === false )
                    ? '<span class="ui-icon ui-icon-close">Remove Tab</span>'
                    : ''
                ) + '</li>',

            select: function( _, event )
            {
                group._selectedIndex = event.index;
            },

            add: function()
            {
                var $this = $( this );

                // if this is our max, hide the button
                if ( $this.tabs( 'length' ) == group.group.maxRows() )
                {
                    group._getAddButton().hide();
                }

                // select the new tab
                $this.tabs( 'select', $this.tabs( 'length' ) - 1 );

                // remove tabs when the remove button is clicked (for whatever
                // reason, live() stopped working, so here we are...)
                $container.find( 'span.ui-icon-close:last' ).click( function()
                {
                    var index = $container.find( 'li' )
                        .index( $( this ).parent() );

                    group.destroyIndex( index );
                });
            },

            remove: function()
            {
                // should we re-show the add button?
                if ( $( this ).tabs( 'length' ) ==
                    ( group.group.maxRows() - 1 )
                )
                {
                    group._getAddButton().show();
                }
            }
        } );
    },


    /**
     * Attaches click event handlers to add tab elements
     *
     * @return void
     */
    _attachAddTabHandlers: function()
    {
        // reference to ourself for use in the closure
        var group = this;

        // if we're locked, we won't allow additions
        if ( this.group.locked() )
        {
            this._getAddButton().remove();
            return;
        }

        // any time an .addrow element is clicked, we want to add a row to the
        // group
        this._getAddButton().click( function()
        {
            group.initIndex();
        });
    },


    /**
     * Returns the element containing the tabs
     *
     * @return jQuery element containing the tabs
     */
    _getTabContainer: function()
    {
        return this.$content.find( '.groupTabs' );
    },


    _getAddButton: function()
    {
        return this.$content.find( '.addTab:first' );
    },


    'private _getTabTitleIndex': function()
    {
        return this.getCurrentIndexCount();
    },


    /**
     * Adds a tab
     *
     * @return TabbedGroup self to allow for method chaining
     */
    addTab: function()
    {
        var $container = this._getTabContainer();

        var $content = this.$baseTabContent.clone( true );
        var id       = $content.attr( 'id' );
        var index    = this.getCurrentIndex();

        // generate a new id
        id = ( id + '_' + index );
        $content.attr( 'id', id );

        // properly name the elements to prevent id conflicts
        this.setElementIdIndexes( $content.find( '*' ), index );

        // append the content
        $container.append( $content );

        // create the new tab
        var title = ( this.$baseTabTitle + ' ' + this._getTabTitleIndex() );
        $container.tabs( 'add', ( '#' + id ), title );

        // finally, style our new elements
        this.styler.apply( $content );

        // raise event
        this.postAddRow( $content, index );

        return this;
    },


    /**
     * Removes a tab
     *
     * @return TabbedGroup self to allow for method chaining
     */
    removeTab: function()
    {
        // we can simply remove the last tab since the bucket will re-order
        // itself and update each of the previous tabs
        var index = this.getCurrentIndex();

        var $container = this._getTabContainer(),
            $panel     = this._getTabContent( index );

        // remove the tab
        this.styler.remove( $panel );
        $container.tabs( 'remove', index );

        return this;
    },


    'private _getTabContent': function( index )
    {
        return this._getTabContainer().find(
            'div.ui-tabs-panel:nth(' + index + ')'
        );
    },


    'override protected postPreEmptyBucketFirst': function()
    {
        // select the first tab
        this._getTabContainer().tabs( 'select', 0 );
        return this;
    },


    'override protected addIndex': function( index )
    {
        // increment id before doing our own stuff
        this.__super( index );
        this.addTab();

        return this;
    },


    'override public removeIndex': function( index )
    {
        // decrement after we do our own stuff
        this.removeTab();
        this.__super( index );

        return this;
    },


    /**
     * Display the requested field
     *
     * The field is not given focus; it is simply brought to the foreground.
     *
     * @param {string} field_name name of field to display
     * @param {number} i          index of field
     *
     * @return {TabbedGroupUi} self
     */
    'override public displayField': function( field, i )
    {
        var $element = this.styler.getWidgetByName( field, i );

        // if we were unable to locate it, then don't worry about it
        if ( $element.length == 0 )
        {
            return;
        }

        // get the index of the tab that this element is on
        var id    = $element.parents( 'div.ui-tabs-panel' ).attr( 'id' );
        var index = id.substring( id.lastIndexOf( '_' ) );

        // select that tab
        this._getTabContainer().tabs( 'select', index );

        return this;
    },


    /**
     * Shows/hides add/remove row buttons
     *
     * @param {boolean} value whether to hide (default: true)
     *
     * @return {TabbedGroupUi} self
     */
    hideAddRemove: function( value )
    {
        if ( value === true )
        {
            this._getTabContainer().find( '.ui-icon-close' ).hide();
            this._getAddButton().hide();
        }
        else
        {
            this._getTabContainer().find( '.ui-icon-close' ).show();
            this._getAddButton().show();
        }
    },


    isOnVisibleTab: function( field, index )
    {
        // fast check
        return ( +index === this._selectedIndex );
    },


    'override protected doHideField': function( field, index, force )
    {
        var _self = this;

        // if we're not on the active tab, then we can defer this request until
        // we're not busy
        if ( !force && !this.isOnVisibleTab( field, index ) )
        {
            setTimeout( function()
            {
                _self.doHideField( field, index, true );
            }, 25 );

            return;
        }

        this.__super( field, index );
    },


    'override protected doShowField': function( field, index, force )
    {
        var _self = this;

        // if we're not on the active tab, then we can defer this request until
        // we're not busy
        if ( !force && !this.isOnVisibleTab( field, index ) )
        {
            setTimeout( function()
            {
                _self.doShowField( field, index, true );
            }, 25 );

            return;
        }

        this.__super( field, index );
    },


    'override public getContentByIndex': function( name, index )
    {
        // get the tab that this index should be on and set a property to notify
        // the caller that no index check should be performed (since there is
        // only one)
        var $content = this._getTabContent( index );
        $content.singleIndex = true;

        return $content;
    }
} );
