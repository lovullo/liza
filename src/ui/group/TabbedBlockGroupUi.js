/**
 * Group tabbed block UI
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

/**
 * Represents a tabbed block group
 *
 * Does not currently support removing individual tabs (it will only clear
 * out all tabs)
 */
module.exports = Class( 'TabbedGroupUi' ).extend( GroupUi,
{
    /**
     * The parent element boxy thingy that contains all other elements
     * @type {jQuery}
     */
    'private _$box': null,

    /**
     * The list containing all clickable tabs
     * @type {jQuery}
     */
    'private _$tabList': null,

    /**
     * Element representing a tab itself
     * @type {jQuery}
     */
    'private _$tabItem': null,

    /**
     * Base tab content element
     * @type {jQuery}
     */
    'private _$contentItem': null,

    /**
     * Index of the currently selected tab
     * @type {number}
     */
    'private _curIndex': 0,

    /**
     * Index of the default selected tab
     * @type {number}
     */
    'private _defaultSelectionField': null,

    /**
     * Disable flags
     * @type {string}
     */
    'private _disableFlags': [],

    /**
     * Bucket prefix for "tab extraction" source data
     * @type {string}
     */
    'private _tabExtractSrc': '',

    /**
     * Bucket prefix for "tab extraction" result data
     * @type {string}
     */
    'private _tabExtractDest': '',

    'private _bucket': null,

    /**
     * Field to check for length (number of tabs); will default to first field
     * @type {string}
     */
    'private _lengthField': '',


    'override protected processContent': function( quote )
    {
        this.__super();

        // determine if we should lock this group down
        if ( this.$content.find( '.groupTabbedBlock' ).hasClass( 'locked' ) )
        {
            this.group.locked( true );
        }

        this._processNonInternalHides( quote );
        this._processTabExtract();
        this._processElements();
        this._processAddButton();
        this._processLengthField();
    },


    'private _processNonInternalHides': function( quote )
    {
        var _self = this;

        // hide flags
        this._disableFlags = this._getBox()
            .attr( 'data-disable-flags' )
            .split( ';' );

        quote.visitData( function( bucket )
        {
            _self._bucket = bucket;
        } );
    },


    'private _processTabExtract': function()
    {
        var $box = this._getBox();

        this._tabExtractSrc         = $box.attr( 'data-tabextract-src' );
        this._tabExtractDest        = $box.attr( 'data-tabextract-dest' );
        this._defaultSelectionField = $box.attr( 'data-default-selected-field' ) || '';
    },


    'private _processElements': function()
    {
        this._$box     = this.$content.find( '.groupTabbedBlock' );
        this._$tabList = this._$box.find( 'ul.tabs' );

        this._$tabItem     = this._$box.find( 'li' ).detach();
        this._$contentItem = this._$box.find( '.tab-content' ).detach();
    },


    'private _processAddButton': function()
    {
        var _self = this,
            $btn  = this._getAddButton();

        if ( this.group.locked() )
        {
            $btn.hide();
            return;
        }

        $btn.click( function()
        {
            _self.initTab();
        } );
    },


    'private _processLengthField': function()
    {
        this._lengthField = this._getBox().attr( 'data-length-field' ) || '';
    },


    'private _processHideFlags': function( data )
    {
        var n = 0;

        var disables = [];
        for ( var i in this._disableFlags )
        {
            var flag = this._disableFlags[ i ];

            for ( var tabi in ( data[ flag ] || {} ) )
            {
                var val  = data[ flag ][ tabi ],
                    hide = !( ( val === '' ) || ( +val === 0 ) );

                // hides should be preserved for multiple criteria
                disables[ tabi ] = ( disables[ tabi ] || false ) || hide;
            }
        }

        // perform the show/hide
        for ( var tabi in disables )
        {
            var hide = disables[ tabi ];
            this._disableTab( tabi, hide );

            // count the number of hidden
            n += +hide;
        }

        this._getBox().toggleClass(
            'disabled',
            ( n >= this._getTabCount() )
        );
    },


    'private _disableTab': function( i, disable )
    {
        this._getTab( i ).toggleClass( 'disabled', disable );
        //this._getTabContent( i ).addClass( 'hidden', disable );
    },


    'private _removeTab': function( index )
    {
        this._getTab( index ).remove();
        this._getTabContent( index ).remove();
    },


    'override public getFirstElementName': function( _ )
    {
        return this._lengthField || this.__super();
    },


    'override protected postPreEmptyBucketFirst': function()
    {
        // select the first tab
        this._selectTab( 0 );
        return this;
    },


    'override protected addIndex': function( index )
    {
        this.addTab();
        this.__super( index );
        return this;
    },


    'override public removeIndex': function( index )
    {
        this._removeTab( this.getCurrentIndexCount() - 1 );
        this.__super( index );
        return this;
    },


    'private _getAddButton': function()
    {
        return this.$content.find( '.addTab:first' );
    },


    'private _showAddButton': function()
    {
        // only show if we're not locked
        if ( this.group.locked() )
        {
            return;
        }

        this._getAddButton().show();
    },


    'private _hideAddButton': function()
    {
        this._getAddButton().hide();
    },


    'private _checkAddButton': function()
    {
        // max rows reached
        if ( this.group.maxRows()
            && ( this.getCurrentIndexCount() === this.group.maxRows() )
        )
        {
            this._hideAddButton();
        }
        else
        {
            this._showAddButton();
        }
    },


    'private _getNextIndex': function()
    {
        var index = this.getCurrentIndexCount();

        if ( this.group.maxRows()
            && ( index === this.group.maxRows() )
        )
        {
            throw Error( 'Max rows reached' );
        }

        return index;
    },


    'private _getTabCount': function()
    {
        return this.getCurrentIndexCount();
    },


    'public addTab': function()
    {
        try
        {
            var index = this._getNextIndex();
        }
        catch ( e )
        {
            this._checkAddButton();
            return false;
        }

        // append the tab itself
        this._$tabList.append( this._createTab( index ) );

        // append the tab content
        this._$box
            .find( '.tabClear:last' )
            .before( this._createTabContent( index ) );

        // hide the add button if needed
        this._checkAddButton();

        this._hideTab( index );

        return true;
    },


    'private _createTab': function( index )
    {
        var _self = this;

        return this._finalizeContent( index,
            this._$tabItem.clone( true )
                .click( function()
                {
                    _self._selectTab( index );
                } )
                .find( 'a' )
                    // prevent anchor clicks from updating the URL
                    .click( function( event )
                    {
                        event.preventDefault();
                    } )
                .end()
        );
    },


    'private _createTabContent': function( index )
    {
        return this._finalizeContent( index,
            this._$contentItem.clone( true )
        );
    },


    'private _finalizeContent': function( index, $content )
    {
        // apply styling and id safeguards
        this.setElementIdIndexes( $content.find( '*' ), index );
        this.styler.apply( $content );

        // allow hooks to perform their magic on our content
        this.postAddRow( $content, index );

        return $content;
    },


    'private _selectTab': function( index )
    {
        this._hideTab( this._curIndex );
        this._showTab( this._curIndex = +index );

        this._tabExtract( index );
    },


    'private _tabExtract': function( index )
    {
        var _self = this;

        function pred( name )
        {
            // determine if the name matches the expected prefix (previously,
            // this was a regex, but profiling showed that performance was very
            // negatively impacted, so this is the faster solution)
            return ( name.substr( 0, _self._tabExtractSrc.length ) ===
                _self._tabExtractSrc
            );
        }

        // wait for a repaint so that we don't slow down the tab selection
        setTimeout( function()
        {
            var cur = {};
            _self._bucket.filter( pred, function( data, name )
            {
                var curdata = data[ index ];

                // ignore bogus data
                if ( ( curdata === undefined ) || ( curdata === null ) )
                {
                    return;
                }

                // guess if this is an array (if not, then it needs to be, since
                // we'll be storing it in the bucket)
                if ( ( typeof curdata === 'string' )
                    || ( curdata.length === undefined )
                )
                {
                    curdata = [ curdata ];
                }

                cur[ _self._tabExtractDest + name ] = curdata;
            } );

            _self._bucket.setValues( cur );
        }, 25 );
    },


    'private _getBox': function()
    {
        // avoiding use of jQuery selector because it caches DOM elements, which
        // causes problems in other parts of the framework
        return $( this.$content[ 0 ].getElementsByTagName( 'div' )[ 0 ] );
    },


    'private _getTabContent': function( index )
    {
        return this._$box.find( '.tab-content:nth(' + index + ')' );
    },


    'private _getTab': function( index )
    {
        return this._$tabList.find( 'li:nth(' + index + ')' );
    },


    'private _showTab': function( index )
    {
        this._getTab( index ).removeClass( 'inactive' );
        this._getTabContent( index ).removeClass( 'inactive' );
    },


    'private _hideTab': function( index )
    {
        this._getTab( index ).addClass( 'inactive' );
        this._getTabContent( index ).addClass( 'inactive' );
    },


    'private _getLastEligibleTab': function()
    {
        var tab_index = this._$tabList.find( 'li' ).not( '.disabled' ).last().index();
        return ( tab_index === -1 )
            ? 0
            : tab_index;
    },


    'private _isEligibleTab': function( index )
    {
        return !this._$tabList.find( 'li' ).get( index ).classList.contains( 'disabled' );
    },


    'override public visit': function()
    {
        // let supertype do its own thing
        this.__super();

        // we will have already rated once by the time this is called
        this._processHideFlags( this._bucket.getData() );

        if ( this._defaultSelectionField === '' )
        {
            // select first tab that is eligible and
            // perform tab extraction (to reflect first eligible tab)
            this._selectTab( this._getLastEligibleTab() );
        }
        else
        {
            // select the tab based on selection index
            var index = this._bucket.getDataByName( this._defaultSelectionField )[0];

            if ( ( index !== undefined ) && this._isEligibleTab( index ) )
            {
                this._selectTab( index || 0 );
            }
            else
            {
                this._selectTab( this._getLastEligibleTab() );
            }
        }

        return this;
    }
} );
