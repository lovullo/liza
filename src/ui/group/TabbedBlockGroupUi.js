/**
 * Group tabbed block UI
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
 * Represents a tabbed block group
 *
 * Does not currently support removing individual tabs (it will only clear
 * out all tabs)
 */
module.exports = Class( 'TabbedGroupUi' ).extend( GroupUi,
{
    /**
     * The parent element boxy thingy that contains all other elements
     * @type {DomElement}
     */
    'private _box': null,

    /**
     * The list containing all clickable tabs
     * @type {DomElement}
     */
    'private _tabList': null,

    /**
     * Element representing a tab itself
     * @type {DomElement}
     */
    'private _tabItem': null,

    /**
     * Base tab content element
     * @type {DomElement}
     */
    'private _contentItem': null,

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
     * @type {array}
     */
    'private _disableFlags': [],

    /**
     * Message to display when group is disabled after a blocking state resolves
     * @type {string}
     */
    'private _disableMessage': '',

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
        this._box = this.$content.find( '.groupTabbedBlock' )[ 0 ];

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

        var disable_attr     = this._box.getAttribute( 'data-disable-flags' );
        var disable_msg_attr = this._box.getAttribute( 'data-disable-message' );

        this._disableFlags = ( disable_attr ) ? disable_attr.split( ';' ) : [];

        this._disableMessage = ( disable_msg_attr )
            ? disable_msg_attr
            : 'Unable to provide a rate at this time';

        this._state_manager.processDataAttributes( this._box );

        quote.visitData( function( bucket )
        {
            _self._bucket = bucket;
        } );
    },


    'private _processTabExtract': function()
    {
        this._tabExtractSrc         = this._box.getAttribute( 'data-tabextract-src' );
        this._tabExtractDest        = this._box.getAttribute( 'data-tabextract-dest' );
        this._defaultSelectionField = this._box.getAttribute( 'data-default-selected-field' ) || '';
    },


    'private _processElements': function()
    {
        this._tabList = this._box.querySelector( 'ul.tabs' );

        var tab     = this._box.querySelector( 'li' );
        var content = this._box.querySelector( '.tab-content' );

        this._tabItem     = tab.parentElement.removeChild( tab );
        this._contentItem = content.parentElement.removeChild( content );

        this._box.appendChild(
            this._createElement( 'div',
                {
                    classList: [ 'group-pending', 'hidden' ],
                    elems: [
                        this._createElement( 'div', { classList: [ 'spinny' ] } ),
                        this._createElement( 'p', { innerText: 'Please wait...' } )
                    ]
                }
            )
        );

        this._box.appendChild(
            this._createElement( 'div',
                {
                    classList: [ 'group-unavailable', 'hidden' ],
                    innerText: this._disableMessage
                }
            )
        );
    },


    /**
     * Create an element by tag name with a set of attributes
     *
     * @param  {string} tagName    Element's tag name
     * @param  {object} attributes List of attributes
     *
     * @return {Element}           An HTML element
     */
    'private _createElement': function( tagName, attributes )
    {
        attributes = attributes || {};

        let elem = document.createElement( tagName );

        if ( Array.isArray( attributes.classList ) )
        {
            attributes.classList.forEach( c => elem.classList.add( c ) );
        }

        if ( Array.isArray( attributes.elems ) )
        {
            attributes.elems.forEach( e => elem.appendChild( e ) );
        }

        if ( typeof attributes.innerText === 'string' )
        {
            elem.innerText = attributes.innerText;
        }

        return elem;
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
        this._lengthField = this._box.getAttribute( 'data-length-field' ) || '';
    },


    'private _processHideFlags': function()
    {
        if ( this._disableFlags.length === 0 )
        {
            return;
        }

        var data = this._bucket.getData();
        var n    = 0;

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

        var isHidden = n >= this._getTabCount();

        this._toggleClass( this._box, 'disabled', isHidden );

        return isHidden;
    },


    /**
     * Handle forced-visibility for a disabled tab group when a blocking state
     * is resolved
     *
     * @param {boolean} isDisabled If the group is disabled
     * @param {boolean} isPending  If the group is pending the resolution of a
     *                             blocking flag
     */
    'private _processUnavailable': function( isDisabled, isPending )
    {
        var unavailableMsg = this._box.querySelector( '.group-unavailable' );

        this._toggleClass( this._box, 'unavailable', isDisabled );
        this._toggleClass( unavailableMsg, 'hidden', isPending || !isDisabled );
    },


    /**
     * Update the related pending UI elements
     *
     * @param {boolean} pending whether we are setting pending to true or false
     *
     * @return {boolean} Pending state
     */
    'private _setPending': function( pending )
    {
        this._toggleClass(
            this._box.querySelector( '.group-pending' ),
            'hidden',
            !pending
        );

        this._toggleClass(
            this._box.querySelector( '.supplier-selector' ),
            'hidden',
            pending
        );

        this._toggleClass(
            this._box.querySelector( '.tab-content' ),
            'hidden',
            pending
        );

        this._toggleClass( this._tabList, 'hidden', pending );

        return pending;
    },


    'private _disableTab': function( i, disable )
    {
        var tab = this._getTab( i );

        if ( disable && !tab.classList.contains( 'disabled' ) )
        {
            tab.classList.add( 'disabled' );
        }
        else if ( !disable && tab.classList.contains( 'disabled' ) )
        {
            tab.classList.remove( 'disabled' );
        }
    },


    'private _removeTab': function( index )
    {
        var tab     = this._getTab( index );
        var content = this._getTabContent( index );

        tab.parentElement.removeChild( tab );
        content.parentElement.removeChild( content );
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


    /**
     * Sets element value given a name and index
     *
     * This has the performance benefit of searching *only* within the group
     * rather than scanning the entire DOM (or a much larger subset)
     *
     * @param {string}  name         element name
     * @param {number}  index        index to set
     * @param {string}  value        value to set
     * @param {boolean} change_event whether to trigger change event
     *
     * @return {TabbedBlockGroupUi} self
     */
    'override public setValueByName': function(
        name,
        index,
        value,
        change_event
    )
    {
        var isDisabled = this._processHideFlags();
        var isPending  = this._state_manager.isPending( this._bucket );

        this._setPending( isPending );

        if ( this._state_manager.observesPending() )
        {
            this._processUnavailable( isDisabled, isPending );
        }

        this.__super.call( this, name, index, value, change_event );
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
        this._tabList.appendChild( this._createTab( index )[ 0 ] );

        // append the tab content
        var clear_tabs = this._box.getElementsByClassName( 'tabClear' );

        clear_tabs[ clear_tabs.length - 1 ].insertAdjacentElement(
            'beforebegin',
            this._createTabContent( index )[ 0 ]
        );

        // hide the add button if needed
        this._checkAddButton();

        this._hideTab( index );

        return true;
    },


    'private _createTab': function( index )
    {
        var _self = this;

        return this._finalizeContent( index,
            this.jquery( this._tabItem.cloneNode( true ) )
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
        const item = this._contentItem.cloneNode( true );

        // Set field content parent for this index
        this.fieldContentParent[ index ] = item.querySelector( 'dl' );

        if ( this.getDomPerfFlag() === true )
        {
            this.context.addIndex( index, this.fieldContentParent[ index ] );
        }

        return this._finalizeContent( index, this.jquery( item ) );
    },


    'private _finalizeContent': function( index, $content )
    {
        var content = $content[ 0 ];

        // properly name the elements to prevent id conflicts
        this.setElementIdIndexes( content.getElementsByTagName( '*' ), index );

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
        return this.$content[ 0 ].getElementsByTagName( 'div' )[ 0 ];
    },


    'private _getTabContent': function( index )
    {
        return this._box.getElementsByClassName( 'tab-content' )[ index ];
    },


    'private _getTab': function( index )
    {
        return this._tabList.querySelectorAll( 'li' )[ index ];
    },


    'private _showTab': function( index )
    {
        this._toggleClass( this._getTab( index ), 'inactive', false );
        this._toggleClass( this._getTabContent( index ), 'inactive', false );
    },


    'private _hideTab': function( index )
    {
        this._toggleClass( this._getTab( index ), 'inactive', true );
        this._toggleClass( this._getTabContent( index ), 'inactive', true );
    },


    'private _getLastEligibleTab': function()
    {
        var tab_count = this._getTabCount();
        var tab_index   = -1;

        for ( let i = 0; i < tab_count; i++ ) {
            if ( this._isEligibleTab( i )) {
                tab_index = i;
            }
        }

        return Math.max( 0, tab_index );
    },


    'private _isEligibleTab': function( index )
    {
        return !this._tabList.querySelectorAll( 'li' )[ index ]
                             .classList.contains( 'disabled' );
    },


    'override public visit': function()
    {
        // let supertype do its own thing
        this.__super();

        // we will have already rated once by the time this is called
        var isDisabled = this._processHideFlags();
        var isPending  = this._state_manager.isPending( this._bucket );

        this._setPending( isPending );

        if ( this._state_manager.observesPending() )
        {
            this._processUnavailable( isDisabled, isPending );
        }

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
    },


    /**
     * Toggles a class name on a given element
     *
     * @param {DomElement} elem       the element
     * @param {string}     class_name the class to toggle`
     * @param {boolean}    force      whether to add or remove the class
     *
     * @return {boolean} whether or not the toggle happened
     */
    'private _toggleClass': function( elem, class_name, force )
    {
        if( elem )
        {
            if ( force && !elem.classList.contains( class_name ) )
            {
                elem.classList.add( class_name );
                return true;
            }
            else if ( !force && elem.classList.contains( class_name ) )
            {
                elem.classList.remove( class_name );
                return true;
            }
        }

        return false;
    }
} );
