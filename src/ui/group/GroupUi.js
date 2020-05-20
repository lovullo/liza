/**
 * General UI logic for groups
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
 *   - References to "quote" should be replaced with generic terminology
 *     representing a document.
 *   - Dependencies need to be liberated: Styler; Group.
 *   - This class is doing too much.
 * @end needsLove
 */

var Class        = require( 'easejs' ).Class,
    EventEmitter = require( '../../events' ).EventEmitter;


/**
 * Styles a group for display in the UI
 */
module.exports = Class( 'GroupUi' )
    .extend( EventEmitter,
{
    /**
     * Raised when an index is added to the group (e.g. row addition)
     * @type {string}
     */
    'const EVENT_INDEX_ADD': 'indexAdd',

    /**
     * Raised when an index is removed from the group (e.g. row deletion)
     * @type {string}
     */
    'const EVENT_INDEX_REMOVE': 'indexRemove',

    /**
     * Raised when an index is reset rather than removed
     * @type {string}
     */
    'const EVENT_INDEX_RESET': 'indexReset',

    /**
     * Emitted when a row/tab/etc is added to a group
     * @type {string}
     */
    'const EVENT_POST_ADD_ROW': 'postAddRow',

    /**
     * An action taken by the user
     * @type {string}
     */
    'const EVENT_ACTION': 'action',

    /**
     * Group being styled
     * @type {Group}
     */
    group: null,

    /**
     * Group content
     * @type {jQuery}
     */
    $content: null,

    /**
     * Styler used to style elements
     * @type {ElementStyler}
     */
    styler: null,

    /**
     * Functions to call when group is invalidated
     * @type {Array.<Function>}
     */
    invalidateHooks: [],

    /**
     * Whether the group is visible
     * @type {boolean}
     */
    'private _visible': true,

    /**
     * Number of indexes (1-based)
     * @type {number}
     */
    'private _indexCount': 0,

    /**
     * Whether the group is active (available for the user to interact with)
     * @type {boolean}
     */
    'private _active': false,

    /**
     * Continuation to perform on step visit
     * @type {function()}
     */
    'private _emptyOnVisit': null,

    /**
     * Field visibility cache by field id (reduces DOM lookups)
     * @type {Object}
     */
    'private _visCache': {},

    /**
     * Number of visibile fields per index
     * @type {number}
     */
    'private _visCount': [],

    /**
     * Number of visibile fields, including multiple indexes
     * @type {number}
     */
    'private _visCountTotal': 0,

    /**
     * Total number of fields, including multiple indexes
     * @type {number}
     */
    'private _fieldCount': 0,

    /**
     * Number of unique fields, disregarding indexes
     * @type {number}
     */
    'private _rawFieldCount': 0,

    /**
     * An array of classifications with css classes we
     * would like to bind to them
     *
     * Structured: classification => css class
     */
    'private _bind_classes': [],

    /**
     * DOM group context
     * @type {GroupContext}
     */
    'protected context': null,

    /**
     * Root DOM context (deprecated)
     * @type {DomContext}
     */
    'protected rcontext': null,

    /**
     * Group context
     * @type {HTMLElement}
     */
    'protected content': null,

    /**
     * Array of direct parent of field content per index
     * @type {Array.<HTMLElement>}
     */
    'protected fieldContentParent': [],

    /**
     * jQuery object
     * @type {jQuery}
     */
    'protected jquery': null,

    /**
     * Styler when fields are no longer applicable
     * @type {FieldStyler}
     */
    'private _naStyler': null,

    /**
     * Access feature flags for new UI features
     * @type {FeatureFlag}
     */
    'private _feature_flag': null,


     /**
     * Child groups inside of this group
     * @type {Array <GroupUi>}
     */
    'protected _children': [],


    /**
     * Initializes GroupUi
     *
     * @todo remove root (DOM) context, and na field styler!
     *
     * @param {Group}         group        group to style
     * @param {HTMLElement}   content      the group content
     * @param {ElementStyler} styler       styler to use to style elements
     * @param {jQuery}        jquery       jQuery-compatible object
     * @param {GroupContext}  context      group context
     * @param {DomContext}    rcontext     root context
     * @param {FieldStyler}   na_styler    styler for fields that are N/A
     * @param {FeatureFlag}   feature_flag toggle access to new UI features
     * @param {Array}         children     child groups
     *
     * @return  {undefined}
     */
    'public __construct': function(
        group, content, styler, jquery, context, rcontext, na_styler, feature_flag,
        children
    )
    {
        this.group         = group;
        this.content       = content;
        this.styler        = styler;
        this.jquery        = jquery;
        this.context       = context;
        this.rcontext      = rcontext;
        this._naStyler     = na_styler;
        this._feature_flag = feature_flag;

        // Todo: Transition away from jQuery
        this.$content   = this.jquery( content );

        if ( Array.isArray( children ) )
        {
            this._children = children;
        }
    },


    'public init': function( quote )
    {
        this._children.forEach( child => child.init( quote ) );

        const fields = this.group.getExclusiveFieldNames();
        const cmatch_fields = this.group.getExclusiveCmatchFieldNames();

        this.context.init( fields, cmatch_fields, this.content, this.group.isInternal() );

        if ( this.getDomPerfFlag() === true )
        {
            const detach_fields = ( this.supportsMultipleIndex() ) ? fields : cmatch_fields;
            this.context.detachStoreContent( detach_fields );
        }

        this._initActions();
        this._monitorIndexChange( quote );
        this.processContent( quote );

        // in an attempt to prevent memory leaks
        this._emptyOnVisit = null;

        // get the number of unique fields in the group
        this._rawFieldCount = this.group.getUserFieldNames().length;

        this._bindClasses( quote );

        return this;
    },


    'private _monitorIndexChange': function( quote )
    {
        var _self = this,
            first = this.getFirstElementName();

        quote.on( 'preDataUpdate', function( data )
        {
            // ignore if the data has not changed
            if ( data[ first ] === undefined )
            {
                return;
            }

            // get the data from the bucket (the staging data is not useful for
            // determining the length, since it only includes what has changed,
            // which will be void of any higher, unchanged indexes)
            var blen = quote.getDataByName( first ).length,
                dlen = _self._stripRm( data[ first ] ).length,
                len  = 0,
                rm   = [];

            // did we remove an index? if so, then this represents the correct
            // length.
            if ( dlen < data[ first ].length )
            {
                len = dlen;

                // keep a record of which indexes were removed
                var df = data[ first ];
                for ( var i = 0, l = df.length; i < l; i++ )
                {
                    if ( df[ i ] === null )
                    {
                        rm.push( i );
                    }
                }
            }
            else
            {
                // otherwise, it's a change; take the longer length
                len  = ( blen > dlen ) ? blen : dlen;
            }

            if ( len === _self.getCurrentIndexCount() )
            {
                return;
            }

            function doempty()
            {
                // TODO: knock it off.
                quote.visitData( function( bucket )
                {
                    // we cannot call preEmptyBucket because the bucket, at this
                    // point, has not yet been modified with the new data
                    _self._quickIndexChange( bucket, true, len, rm );
                } );
            }

            // if we're not an active group, then there's little use in updating
            // ourselves; next time they visit the step, we can update ourselves
            // (not only does this help with performance, but it also eliminates
            // some problems that may occur due to us not being attached to the
            // DOM)
            if ( !( _self._active ) )
            {
                // store the latest continuation
                _self._emptyOnVisit = doempty;
                return;
            }

            doempty();
        } );
    },


    /**
     * Strip removes from a data diff
     *
     * Removes are represented by nulls
     *
     * @param {Object} data data diff
     *
     * @return {Object} data with nulls stripped
     */
    'private _stripRm': function( data )
    {
        for ( var i in data )
        {
            if ( data[ i ] === null )
            {
                // null marks the end of the data
                return data.slice( 0, i );
            }
        }

        return data;
    },


    /**
     * Performs any necessary processing on the content before it's displayed
     *
     * Subtypes may override this for custom functionality
     *
     * @return undefined
     */
    'virtual protected processContent': function()
    {
    },


    /**
     * Group types that can support multiple index
     *
     * @return {boolean}
     */
    'virtual protected supportsMultipleIndex': function()
    {
        return true;
    },


    /**
     * Gets the DOM Performance Flag
     *
     * @return {boolean}
     */
    'public getDomPerfFlag': function()
    {
        return this._feature_flag.isEnabled( 'dom_perf_flag' );
    },


    /**
     * Trigger events on action interaction
     *
     * @return {undefined}
     */
    'private _initActions': function()
    {
        var _self = this;

        this.$content.find( '.action' ).live( 'click', function( e )
        {
            e.preventDefault();

            // TODO: index
            var $this = _self.jquery( this ),
                ref   = $this.attr( 'data-ref' ),
                type  = $this.attr( 'data-type' ),
                index = +$this.attr( 'data-index' ) || 0;

            _self.emit( _self.__self.$( 'EVENT_ACTION' ), type, ref, index );
        } );
    },


    /**
     * Attempts to return the group id of the group containing the given element
     *
     * This method will cache the value of the id upon the first request by
     * replacing itself with a function that returns only the value.
     *
     * @param mixed element jQuery or DOM object to retrieve group id from
     *
     * @return String|undefined group id or undefined if no group/id exists
     */
    'public getGroupId': function()
    {
        var id = this.$content.attr( 'id' );

        return id;
    },


    /**
     * Sets the index (for the name attribute) of all given elements
     *
     * The name format is expected to be: name_i, where i is the index.
     *
     * @param HTML    elements  elements to set index on
     * @param Integer index     index to set
     *
     * @return void
     */
    'protected setElementIdIndexes': function( elements, index )
    {
        for ( var i = 0; i < elements.length; i++ )
        {
            var element      = elements[ i ];
            var id           = element.getAttribute( 'id' ) || '';
            var element_data = 0;

            // grab the index from the id if found
            if ( element_data = id.match( /^(.*?)(\d+)$/ ) )
            {
                // regenerate the id
                element.setAttribute( 'id', element_data[1] + index );
            }

            element.setAttribute( 'data-index', index );
        }
    },


    /**
     * Watches the first element for changes and invalidates the group when it
     * does
     *
     * This is used when groups base their row/tab/whatever count on the first
     * element to ensure that they are properly regenerated when the count
     * changes.
     *
     * @return {undefined}
     */
    'protected watchFirstElement': function( $base, quote )
    {
        var group      = this,
            first_name = this.getFirstElementName( $base );

        if ( first_name )
        {
            quote.on( 'dataCommit', function( data )
            {
                var first_data = data[ first_name ];
                if ( first_data === undefined )
                {
                    return;
                }

                group.invalidate();
            });
        }
    },


    /**
     * Retireve the current index count
     *
     * This should be one more than the current 0-based index (like an array
     * length). Subtypes may override this if they do not wish to use the
     * built-in index tracking.
     *
     * @return {number} index count
     */
    'virtual public getCurrentIndexCount': function()
    {
        return this._indexCount;
    },


    'public getCurrentIndex': function()
    {
        return ( this.getCurrentIndexCount() - 1 );
    },


    /**
     * Allows groups to do any necessary processing before a bucket is emptied
     *
     * For example, a group may need to recreate rows in order to make room for
     * the values stored in the bucket.
     *
     * Subtypes are free to override this if the default functionality is
     * insufficient. Note that there are a number of methods used by this one
     * that too may be overridden to alter its functionality without overriding
     * this method.
     *
     * @param {Bucket}  bucket  bucket
     * @param {boolean} updated whether this is an update (rather than inital
     *                          append)
     *
     * @return {GroupUi} self
     */
    'virtual public preEmptyBucket': function( bucket, updated )
    {
        var first = this.getFirstElementName(),
            flen  = bucket.getDataByName( first ).length;

        this._quickIndexChange( bucket, updated, flen );

        return this;
    },


    'private _quickIndexChange': function( bucket, updated, len, rm )
    {
        rm = rm || [];

        var _self  = this,
            curlen = this.getCurrentIndexCount();

        this.handleIndexChange( len, curlen,
            function __add( n )
            {
                do
                {
                    _self.addIndex( len - n );
                } while ( --n )
            },

            function __rm( n )
            {
                while ( n-- )
                {
                    _self.removeIndex( rm.pop() );
                }
            }
        );

        this.postPreEmptyBucket( bucket );

        if ( !updated )
        {
            this.postPreEmptyBucketFirst( bucket );
        }
    },


    /**
     * Indicates that a tab/row/column/etc (representing an index) should be
     * added
     *
     * Subtypes may override this for custom functionality.
     *
     * @param {number} index index that has been added
     *
     * @return {GroupUi} self
     */
    'virtual protected addIndex': function( index )
    {
        this._indexCount++;
        this._recalcFieldCount( 1, index );

        return this;
    },


    /**
     * Indicates that a tab/row/column/etc (representing an index) should be
     * removed
     *
     * The last index in the group should be removed.
     *
     * Subtypes may override this for custom functionality.
     *
     * @param {number} index index that has been removed
     *
     * @return {GroupUi} self
     */
    'virtual protected removeIndex': function( index )
    {
        var fields = this.group.getExclusiveFieldNames();

        for ( var field in fields )
        {
            var cached = this._visCache[ fields[ field ] ];

            cached !== undefined && cached.pop();
        }

        this.context.removeIndex( fields );

        this._indexCount--;
        this._recalcFieldCount( -1, index );

        return this;
    },


    /**
     * Allows for processing after preEmptyBucket() has been run without
     * overriding preEmptyBucket() itself
     *
     * @return {GroupUi} self
     */
    'virtual protected postPreEmptyBucket': function()
    {
        return this;
    },


    'virtual protected postPreEmptyBucketFirst': function()
    {
        return this;
    },


    /**
     * Invokes add/remove procedures based on what must be done given a number
     * of indexes and the current number of indexes
     *
     * If any indexes need to be added/removed (subject to min/max limits), the
     * appropriate callback will be called with the number of adds/removes to be
     * performed respectively. Otherwise, no callback will be called.
     *
     * @param {number} n   desired index count
     * @param {number} cur current index count
     *
     * @param {function(number)} ca  add continuation
     * @param {function(number)} crm remove continuation
     *
     * @return {GroupUi} self
     */
    'protected handleIndexChange': function( n, cur, ca, crm )
    {
        var min = this.group.minRows(),
            max = this.group.maxRows(),

            diff = ( n - cur ),
            len  = ( cur + diff );

        // restrict to min/max
        if ( len < min )
        {
            len = min;
        }
        else if ( ( max > 0 ) && ( len > max ) )
        {
            len = max;
        }

        // now that we have the desired length, calculate that difference (may
        // not differ from diff unless a max/min is hit)
        var truediff = ( len - cur );

        // we have nothing to do if the diff is 0
        if ( truediff === 0 )
        {
            return this;
        }

        // call the add/remove callback depending on our diff
        ( ( truediff < 0 ) ? crm : ca )( Math.abs( truediff ) );

        return this;
    },


    /**
     * Initialize an index to be added to the group
     *
     * This action simply raises an event that hooks may properly handle---that
     * is, we're merely indicating our desire to add an index. Whether or not
     * it actually happens [correctly] is beyond our control.
     *
     * If properly handled, presumably the bucket will be updated with the new
     * index and that, in turn, will kick off the hooks to add the necessary UI
     * elements to reflect the addition.
     *
     * @return {GroupUi} self
     */
    'protected initIndex': function()
    {
        this.emit(
            this.__self.$('EVENT_INDEX_ADD'),
            this.getCurrentIndexCount()
        );

        return this;
    },


    /**
     * Initialize an index to be removed from the group
     *
     * This action simply raises an event that hooks may properly handle---that
     * is, we're merely indicating our desire to remove an index. Whether or not
     * it actually happens [correctly] is beyond our control.
     *
     * If properly handled, presumably the bucket will be updated to reflect the
     * deletion and the hooks will then kick off the necessary UI updates.
     *
     * @return {GroupUi} self
     */
    'protected destroyIndex': function( index )
    {
        index = ( index === undefined ) ? this.getCurrentIndex() : +index;

        this.emit(
            this.__self.$('EVENT_INDEX_REMOVE'),
            index
        );

        return this;
    },


    /**
     * Allows group to perform any necessary operations before an element is
     * scrolled to
     *
     * @param {string} field_name name of field to display
     *
     * @return {GroupUi} self
     */
    'virtual public preScrollTo': function( field_name, i )
    {
        // do not do anything if this group does not contain the requested field
        if ( !( this.group.hasExclusiveField( field_name ) ) )
        {
            return this;
        }

        // let subtypes display the element in whatever manner makes sense
        this.displayField( field_name, i );

        return this;
    },


    /**
     * Display the requested field
     *
     * The field should not be given focus; it should just be brought to the
     * foreground.
     *
     * This is intended for groups that may conceal fields from the user (e.g.
     * tabbed groups).
     *
     * @param {string} field_name name of field to display
     * @param {number} i          index of field
     *
     * @return {GroupUi} self
     */
    'virtual protected displayField': function( field_name, i )
    {
        // subtypes must override this method if they have the ability to
        // conceal fields from the user (e.g. tabs)
        return this;
    },


    'public getId': function()
    {
        // return all but the beginning 'group_'
        return this.$content.attr( 'id' ).substring( 6 );
    },


    /**
     * Bind css classes to classifications
     *
     * @param {quote} quote the quote to listen on
     */
    'private _bindClasses': function( quote )
    {
        // Get the css classes that we would like to bind to classifications
        this._bind_classes = this._getBindClasses();

        const self = this;

        quote.onClassifyAndNow( function( classes )
        {
            for( let bind_class in self._bind_classes )
            {
                css_class = self._bind_classes[ bind_class ];

                if( classes[ bind_class ] && classes[ bind_class ].is === true )
                {
                    self.content.classList.add( css_class );
                }
                else
                {
                    self.content.classList.remove( css_class );
                }
            }
        } );
    },


    /**
     * Get the class attributes and their classifiers
     *
     * @return {array} bound classes and their conditional classifications
     */
    'private _getBindClasses': function()
    {
        // return all but the beginning 'group_'
        const class_str = this.content.getAttribute( 'data-class-bind' );

        if( !class_str )
        {
            return [];
        }

        const classes   = [];

        class_str.split( ' ' ).forEach( datum => {
            const kv = datum.split( ':' );

            if( !kv[ 0 ] || !kv[ 1 ] )
            {
                return;
            }

            // Add the classifications as the keys and the css class as value
            classes[ kv[ 1 ] ] = kv[ 0 ];
        } );

        return classes;
    },


    /**
     * Gets the name of the first question or answer element available
     *
     * This method exists because answer elements cannot have name attributes.
     * Instead they store the reference name in a 'ref_id' data key.
     *
     * @param jQuery $parent parent element to search
     *
     * @return String name, otherwise empty string
     */
    'virtual public getFirstElementName': function( $parent )
    {
        return this.group.getIndexFieldName();
    },


    /**
     * Hooks the event to be triggered when a row is added to a group
     *
     * Children should call this method when they add a new row.
     *
     * @param {jQuery} $element element that was added
     * @param {number} index    index of the added element
     *
     * @return {GroupUi} self to allow for method chaining
     */
    'virtual protected postAddRow': function( $element, index )
    {
        this.emit( this.__self.$('EVENT_POST_ADD_ROW'), index );

        return this;
    },


    'public hide': function()
    {
        this.$content.hide();
        this._visible = false;

        return this;
    },

    'public show': function()
    {
        this.$content.show();
        this._visible = true;

        return this;
    },


    /**
     * Retrieve field elements for show/hide operations
     *
     * If the field is a child of another field, then only the element
     * associated with it will be selected; otherwise, the parent container
     * of the field (which may be multiple elements) will be returned.
     *
     * @param {string} field field name
     * @param {number} index field index
     *
     * @return {jQuery} field elements
     */
    'virtual protected getFieldElements': function( field, index )
    {
        var $element = this.getElementByName( field, index ),
            is_sub   = $element.parent().hasClass( 'widget' );

        return ( !is_sub && $element.parents( 'dd' ).length )
            ? $element.parents( 'dd' ).prev( 'dt' ).andSelf()
            : $element;
    },

    /**
     * Hides the field based on field name and index
     *
     * @param field
     * @param index
     */
    'virtual public hideField': function( field, index )
    {
        if ( this.isFieldVisible( field, index ) === false )
        {
            // nothing to do?
            return;
        }

        this._setFieldVisible( field, index, false );

        // can be overridden by subtypes
        this.doHideField( field, index );
    },


    'virtual protected doHideField': function( field, index )
    {
        ( this.getDomPerfFlag() === true )
            ? this.context.hide( field, index )
            : this.rcontext.getFieldByName( field, index ).applyStyle( this._naStyler );
    },

    /**
     * Returns a boolean depending on if there are visible fields
     * based off of the visCount
     *
     * @param index
     * @returns {boolean}
     */
    'public hasVisibleField': function( index )
    {
        return this._visCount[ index ] > 0 ? true : false;
    },


    /**
     * Shows the field based on field name and index
     *
     * @param field
     * @param index
     */
    'virtual public showField': function( field, index )
    {
        if ( this.isFieldVisible( field, index ) === true )
        {
            // nothing to do
            return;
        }

        this._setFieldVisible( field, index, true );

        // can be overridden by subtypes
        this.doShowField( field, index );
    },


    'virtual protected doShowField': function( field, index )
    {
        ( this.getDomPerfFlag() === true )
            ? this.context.show( field, index, this.fieldContentParent[ index ] )
            : this.rcontext.getFieldByName( field, index ).revokeStyle( this._naStyler );
    },


    'public isFieldVisible': function( id, index )
    {
        if ( index > this.getCurrentIndex() )
        {
            return false;
        }

        this._visCache[ id ] = this._visCache[ id ] || [];

        // if no index was provided, then determine if *any* of the indexes are
        // available
        if ( index === undefined )
        {
            var result = false,
                i      = this.getCurrentIndexCount();

            while ( i-- )
            {
                result = result || this.isFieldVisible( id, i );
            }

            return result;
        }

        // may be undefined
        return ( this._visCache[ id ][ index ] );
    },


    'private _setFieldVisible': function( id, index, visible )
    {
        var old = this._visCache[ id ][ index ];

        // should only ever be called after isFieldVisible(); if this is false,
        // initialize
        this._visCache[ id ][ index ] = !!visible;

        // we assume every field to be visible by default count-wise; as such,
        // if the original cache value is undefined (meaning we aren't sure if
        // it is visible or not), we do not want to increase the visibility
        // count
        this._incVis( index, ( visible )
            ? ( ( old === undefined ) ? 0 : 1 )
            : -1
        );

        this._checkVisCount();
    },


    'private _incVis': function( index, by )
    {
        if ( this._visCount[ index ] === undefined )
        {
            this._visCount[ index ] = 0;
        }

        this._visCount[ index ] += by;
        this._visCountTotal     += by;
    },


    'private _recalcFieldCount': function( change, index )
    {
        var raw = this._rawFieldCount;

        this._fieldCount = raw * this.getCurrentIndexCount();

        var count = 0;
        if ( change === -1 )
        {
            count = this._visCount[ index ];
        }
        else
        {
            count = raw;
        }

        this._incVis( index, ( change * count ) );
        this._checkVisCount();
    },


    'private _checkVisCount': function()
    {
        // if we have no fields, then ignore visibility checks
        if ( this._rawFieldCount === 0 )
        {
            return;
        }

        // XXX: ideally, < should never occur, but until this implementation is
        // finalized and all the bugs are worked out, it can :x
        if ( ( this._visCountTotal <= 0 ) && this._visible )
        {
            this.onAllFieldsHidden();
        }
        else if ( !( this._visible ) && ( this._visCountTotal > 0 ) )
        {
            this.onFieldsVisible();
        }
    },


    'virtual protected onAllFieldsHidden': function()
    {
        // default action is to hide self
        this.hide();
    },


    'virtual protected onFieldsVisible': function()
    {
        // default action is to show self
        this.show();
    },


    'public invalidate': function( hook )
    {
        if ( hook instanceof Function )
        {
            this.invalidateHooks.push( hook );
            return this;
        }

        // call the hooks
        for ( var i = 0, len = this.invalidateHooks.length; i < len; i++ )
        {
            this.invalidateHooks[ i ]();
        }

        return this;
    },


    /**
     * Returns group object being styled
     *
     * @return {Group}
     */
    'public getGroup': function()
    {
        return this.group;
    },


    'virtual public preRender': function()
    {
        if ( this._emptyOnVisit === null )
        {
            return this;
        }

        // invoke the continuation
        this._emptyOnVisit();

        this._emptyOnVisit = null;

        return this;
    },


    'virtual public visit': function()
    {
        return this;
    },


    /**
     * Return the given element within the group (if it exists)
     *
     * This has the performance benefit of searching *only* within the group
     * rather than scanning the entire DOM (or a much larger subset)
     *
     * @param {string}  name   element name (question name)
     * @param {number=} index  index of element to retrieve (bucket index)
     * @param {string=} filter filter to apply to widgets
     *
     * @return {jQuery} matches
     */
    'public getElementByName': function( name, index, filter )
    {
        // TODO: move me.
        if ( !( this.isAField( name ) ) )
        {
            return this.$content.find(
                '#' + name + ':nth(' + index + ')'
            );
        }

        // find the element within the group (by setting the search
        // context to the group, we can speed up the system on large
        // steps be avoiding scanning the DOM for the entire step
        // content)
        return this.styler.getElementByName(
            name, index, filter, this.$content
        );
    },


    /**
     * Returns whether the given name is a field
     *
     * If not a field, it could be another non-input element, such as a static
     * element.
     *
     * @param {string} name inquiry
     *
     * @return {boolean} true if field, otherwise false
     */
    'public isAField': function( name )
    {
        return ( this.styler.isAField( name ) );
    },


    'virtual public getContentByIndex': function( name, index )
    {
        return this.$content;
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
     * @return {GroupUi} self
     */
    'virtual public setValueByName': function( name, index, value, change_event )
    {
        if ( this.getDomPerfFlag() === true )
        {
            this.context.setValueByName( name, index, value );
        }
        else
        {
            this.styler.setValueByName(
                name, index, value, change_event,
                this.getContentByIndex( name, index )
            );
        }

        return this;
    },


    'public setActive': function( active )
    {
        active = ( active === undefined ) ? true : !!active;

        this._active = active;
        return this;
    },


    'public disableField': function( name, index, disable )
    {
        disable = ( disable === undefined ) ? true : !!disable;
        this.styler.disableField(
            name, index, disable, this.getContentByIndex( name, index )
        );

        return this;
    },


    'public setOptions': function( name, index, options, val )
    {
        if ( this.getDomPerfFlag() === false )
        {
            this.styler.setOptions(
                name, index, options, val, this.getContentByIndex( name, index )
            );
        }
        else
        {
            this.context.setOptions( name, index, options, val );
        }

        return this;
    },


    'public clearOptions': function( name, index )
    {
        this.setOptions( name, index, [] );
        return this;
    }
} );
