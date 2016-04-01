/**
 * General UI logic for steps
 *
 *  Copyright (C) 2015 LoVullo Associates, Inc.
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
 *   - Dependencies need to be liberated:
 *       - BucketDataValidator.
 *   - Global references (e.g. jQuery) must be removed.
 *   - jQuery must be eliminated.
 *     - The public API now accepts and returns vanilla DOM content, so at
 *       least it's encapsulated now.
 *   - Checkbox-specific logic must be extracted.
 *   - This class is doing too much.
 * @end needsLove
 */

var Class        = require( 'easejs' ).Class,
    EventEmitter = require( 'events' ).EventEmitter,
    StepUi       = require( './StepUi' );


/**
 * Handles display of a step
 *
 * @return {StepUi}
 */
module.exports = Class( 'StepUi' )
    .implement( StepUi )
    .extend( EventEmitter,
{
    /**
     * Called after step data is processed
     * @type {string}
     */
    'const EVENT_POST_PROCESS': 'postProcess',

    /**
     * Called after step is appended to the DOM
     * @type {string}
     */
    'const EVENT_POST_APPEND': 'postAppend',

    /**
     * Called when data is changed (question value changed)
     * @type {string}
     */
    'const EVENT_DATA_CHANGE': 'dataChange',

    /**
     * Raised when an index is added to a group (e.g. row addition)
     * @type {string}
     */
    'const EVENT_INDEX_ADD': 'indexAdd',

    /**
     * Raised when an index is reset in a group (rather than removed)
     * @type {string}
     */
    'const EVENT_INDEX_RESET': 'indexReset',

    /**
     * Raised when an index is removed from a group (e.g. row deletion)
     * @type {string}
     */
    'const EVENT_INDEX_REMOVE': 'indexRemove',

    /**
     * Represents an action trigger
     * @type {string}
     */
    'const EVENT_ACTION': 'action',

    /**
     * Triggered when the step is active
     * @type {boolean}
     */
    'const EVENT_ACTIVE': 'active',


    /**
     * Instance of step to style
     * @type {Step}
     */
    step: null,

    /**
     * Step data (DOM representation)
     * @type {jQuery}
     */
    $content: null,

    /**
     * Element styler
     * @type {ElementStyler}
     */
    styler: null,

    /**
     * Whether the step should be repopulated with bucket data upon display
     * @type {boolean}
     */
    invalid: false,

    /**
     * Stores group objects representing each group
     * @type {Object.<Group>}
     */
    groups: {},

    /**
     * Flag to let system know its currently saving the step
     * @type {boolean}
     */
    saving: false,

    /**
     * Format bucket data for display
     * @type {BucketDataValidator}
     */
    'private _formatter': null,

    /**
     * Stores references to which group fields belong to
     * @type {Object}
     */
    'private _fieldGroup': {},

    /**
     * Hash of answer contexts (jQuery) for quick lookup
     * @type {Object}
     */
    'private _answerContext': {},

    /**
     * Hash of static answer indexes, if applicable
     * @type {Object}
     */
    'private _answerStaticIndex': {},

    /**
     * Whether the step is the currently active (visible) step
     * @type {boolean}
     */
    'private _active': false,

    /**
     * Whether the step is locked (all elements disabled)
     * @type {boolean}
     */
    'private _locked': false,

    'private _forceAnswerUpdate': null,


    /**
     * Initializes StepUi object
     *
     * The data_get function is used to retrieve the step data, allowing the
     * logic to be abstracted from the Step implementation. It must accept two
     * arguments: the id of the step to load, and a callback function, as the
     * operation is likely to be asynchronous.
     *
     * A callback function is used for when the step is ready to be used. This
     * is done because the loading of the data is (ideally_ an asynchronous
     * operation.  This operation is performed in the constructor, to ensure
     * that each instance of a Step class has data associated with it.
     * Therefore, the object will be instantiated, but the data_get function
     * will still be running in the background. The step should not be used
     * until the data loading is complete.  That is when the callback will be
     * triggered.
     *
     * @return {undefined}
     */
    'public __construct': function(
        step,
        styler,
        formatter
    )
    {
        this.step        = step;
        this.styler      = styler;
        this._formatter  = formatter;
    },


    /**
     * Initializes step
     *
     * @return {undefined}
     */
    'public init': function()
    {
        var _self = this;

        this.step.on( 'updateQuote', function()
        {
            _self._hookBucket();
            _self._processAnswerFields();
            _self.invalidate();
        } );

        return this;
    },


    'public initGroupFieldData': function()
    {
        for ( var group in this.groups )
        {
            var groupui = this.groups[ group ],
                fields  = groupui.group.getExclusiveFieldNames();

            for ( var i in fields )
            {
                this._fieldGroup[ fields[ i ] ] = groupui;
            }
        }
    },


    /**
     * Sets content to be displayed
     *
     * @param {HTMLElement} content content to display
     *
     * @return {StepUi} self
     */
    'public setContent': function( content )
    {
        // TODO: transition away from jQuery
        this.$content = $( content );

        this._processAnswerFields();

        return this;
    },


    /**
     * Returns the step that this object is styling
     *
     * @return lovullo.program.Step
     */
    getStep: function()
    {
        return this.step;
    },


    /**
     * Returns the generated step content as a jQuery object
     *
     * @return {HTMLElement} generated step content
     */
    'virtual getContent': function()
    {
        return this.$content[ 0 ];
    },


    /**
     * Will mark the step as dirty when the content is changed and update
     * the staging bucket
     *
     * @return undefined
     */
    setDirtyTrigger: function()
    {
        var step = this;

        this.$content.bind( 'change.program', function( event )
        {
            // do nothing if the step is locked
            if ( step._locked )
            {
                return;
            }

            // get the name of the altered element
            var $element = step.styler.getNameElement( $( event.target ) ),
                name     = $element.attr( 'name' ),
                val      = $element.val();

            if ( !( name ) )
            {
                // rogue field not handled by the framework!
                return;
            }

            // remove the trailing square brackets from the name
            name = name.substring( 0, ( name.length - 2 ) );

            // get its index
            var $elements = step.$content.find( "[name='" + name + "[]']" ),
                index     = $elements.index( $element );


            // todo: this is temporary to allow noyes and legacy radios to work.
            if ( $element.hasClass( 'legacyradio' ) )
            {
                index = 0;
            }
            else if ( $element.attr( 'type' ) === 'radio'
                || $element.attr( 'type' ) === 'checkbox'
            )
            {
                // if it's not checked, then this isn't the radio we're
                // interested in. Sorry!
                if ( !( $element.attr( 'checked' ) ) )
                {
                    $element.attr( 'checked', true );

                    return;
                }

                // 2 in this instance is the yes/no group length.
                var group_length = $element.attr( 'data-question-length' )
                    ? $element.attr( 'data-question-length' )
                    : 2;

                index = Math.floor( index / group_length );
            }

            var values              = {};
            values[ name ]          = [];
            values[ name ][ index ] = val;


            // update our bucket with this new data
            step.emit( step.__self.$('EVENT_DATA_CHANGE'), values );
        } );

        // @note This is a hack. In IE8, checkbox change events don't properly fire.
        this.$content.delegate(
            'input[type="checkbox"]',
            'click',
            function ()
            {
                // XXX: remove global
                jQuery( this ).change();
            }
        );
    },


    /**
     * Prepares answer fields
     *
     * This method will populate the answer fields with values already in the
     * bucket and hook the bucket so that future updates will also be reflected.
     *
     * @return {undefined}
     */
    _processAnswerFields: function()
    {
        var _self  = this,
            bucket = this.step.getBucket();

        this._prepareAnswerContexts();

        // perform initial update for the step when we are first created, then
        // hook everything else (we do not need the hooks before then, as we
        // will be forcefully updating the step with values)
        this.__inst.once( 'postAppend', function()
        {
            var forceupdate = false;

            // when the value we're watching is updated in the bucket, update
            // the displayed value
            var doUpdate;
            bucket.on( 'stagingUpdate', doUpdate = function( data )
            {
                // defer updates unless we're active
                if ( !( _self._active ) )
                {
                    if ( forceupdate === false )
                    {
                        forceupdate = true;

                        // use __inst until we get the ease.js issue sorted out
                        // with extending non-class protoypes
                        _self.__inst.once( _self.__self.$('EVENT_ACTIVE'), function()
                        {
                            doUpdate( bucket.getData() );
                            forceupdate = false;
                        } );
                    }

                    return;
                }

                // give the UI a chance to update the DOM; otherwise, the
                // answer elements we update may no longer be used (this also
                // has performance benefits since it allows repainting before
                // potentially heavy processing)
                setTimeout( function()
                {
                    _self._updateAnswerFieldData( data );
                }, 25 );
            } );

            doUpdate( bucket.getData() );

            // set the values when a row is added
            _self.__inst.on( 'postAddRow', function( index )
            {
                var data = bucket.getData();

                for ( var name in _self._answerContext )
                {
                    var value = ( data[ name ] || {} )[ index ];

                    if ( value === undefined )
                    {
                        continue;
                    }

                    _self._updateAnswer( name, index, value );
                }
            } );

            this._forceAnswerUpdate = doUpdate;
        } );
    },


    /**
     * Update DOM answer fields with respective datum in diff DATA
     *
     * Only watched answer fields are updated.  The update is performed on
     * the discovered context during step initialization.
     *
     * @param {Object} data bucket diff
     *
     * @return {undefined}
     */
    'private _updateAnswerFieldData': function( data )
    {
        // we only care if the data we're watching has been
        // changed
        for ( var name in data )
        {
            if ( !( this._answerContext[ name ] ) )
            {
                continue;
            }

            var curdata = data[ name ],
                si      = this._answerStaticIndex[ name ],
                i       = curdata.length;

            // static index override
            if ( !( isNaN( si ) ) )
            {
                // update every index on the DOM
                i = this.styler.getAnswerElementByName(
                    name, undefined, undefined,
                    this._answerContext[ name ]
                ).length;
            }

            while ( i-- )
            {
                var index = ( isNaN( si ) ) ? i : si,
                    value = curdata[ index ];

                // take into account diff; note that if one of
                // them is null, that means it has been removed
                // (and will therefore not be displayed), so we
                // don't have to worry about clearing out a value
                if ( ( value === undefined ) || ( value === null ) )
                {
                    continue;
                }

                this._updateAnswer( name, i, curdata[ index ] );
            }
        }
    },


    'private _prepareAnswerContexts': function()
    {
        var _self = this;

        // get a list of all the answer elements
        this.$content.find( 'span.answer' ).each( function()
        {
            var $this  = $( this ),
                ref_id = $this.attr( 'data-answer-ref' ),
                index  = $this.attr( 'data-answer-static-index' );

            // clear the value (which by default contains the name of the answer
            // field)
            $this.text( '' );

            // if we've already found an element for this ref, then it is
            // referenced in multiple places; simply store the context as the
            // entire step
            if ( _self._answerContext[ ref_id ] )
            {
                _self._answerContext[ ref_id ] = _self.$content;
                return;
            }

            // store the parent fieldset as our context to make DOM lookups a
            // bit more performant
            _self._answerContext[ ref_id ] = $( this ).parents( 'fieldset' );
            _self._answerStaticIndex[ ref_id ] = ( index )
                ? +index
                : NaN;
        } );
    },


    /**
     * Update the display of an answer field
     *
     * The value will be styled before display.
     *
     * @param {string} name  field name
     * @param {number} index index to update
     * @param {string} value answer value (unstyled)
     *
     * @return {undefined}
     */
    'private _updateAnswer': function( name, index, value )
    {
        var $element = this.styler.getAnswerElementByName(
            name, index, null, ( this._answerContext[ name ] || this.$content )
        );

        var i = $element.length;
        if ( i > 0 )
        {
            while( i-- )
            {
                var styled = this.styler.styleAnswer( name, value ),
                    allow_html = $element[ i ]
                        .attributes[ 'data-field-allow-html' ] || {};

                if ( allow_html.value === 'true' )
                {
                    $element.html( styled );
                }
                else
                {
                    $element.text( styled );
                }

                var id = $element[ i ].attributes['data-field-name'];
                if ( !id )
                {
                    continue;
                }

                this.emit( 'displayChanged', id.value, index, value );
            }
        }
    },


    /**
     * Monitors the bucket for data changes and updates the elements accordingly
     *
     * @return undefined
     */
    _hookBucket: function()
    {
        var _self = this;

        // when the bucket data is updated, update the element to reflect the
        // value
        this.step.getBucket().on( 'stagingUpdate', function( data )
        {
            // if we're saving (filling the bucket), this is pointless
            if ( _self.saving )
            {
                return;
            }

            var data_fmt = _self._formatter.format( data );

            for ( var name in _self.step.getExclusiveFieldNames() )
            {
                // if this data hasn't changed, then ignore the element
                if ( data_fmt[ name ] === undefined )
                {
                    continue;
                }

                // update each of the elements (it is important to update the
                // number of elements on the screen, not the number of elements
                // in the data array, since the array is a diff and will contain
                // information regarding removed elements)
                var data_len = data_fmt[ name ].length;

                for ( var index = 0; index < data_len; index++ )
                {
                    var val = data_fmt[ name ][ index ];

                    // if the value is not set or has been removed (remember,
                    // we're dealing with a diff), then ignore it
                    if ( ( val === undefined ) || ( val === null ) )
                    {
                        continue;
                    }

                    // set the value of the element using the appropriate group
                    // (for performance reasons, so we don't scan the whole DOM
                    // for the element)
                    _self.getElementGroup( name ).setValueByName(
                        name, index, val, false
                    );
                }
            }
        } );
    },


    /**
     * Called after the step is appended to the DOM
     *
     * This method will simply loop through all the groups that are a part of
     * this step and call their postAppend() methods. If the group does not have
     * an element id, it will not function properly.
     *
     * @return StepUi self to allow for method chaining
     */
    postAppend: function()
    {
        // let the styler do any final styling
        this.styler.postAppend( this.$content.parent() );

        // If we have data in the bucket (probably loaded from the server), show
        // it. We use a delay to ensure that the UI is ready for the update. In
        // certain cases (such as with tabs), the UI may not have rendered all
        // the elements.
        this.emptyBucket( null, true );

        // monitor bucket changes and update the elements accordingly
        this._hookBucket();

        this.emit( this.__self.$('EVENT_POST_APPEND') );

        return this;
    },


    /**
     * Empties the bucket into the step (filling the fields with its values)
     *
     * @param Function callback function to call when bucket has been emptied
     *
     * @return StepUi self to allow for method chaining
     */
    emptyBucket: function( callback, delay )
    {
        delay = ( delay === undefined ) ? false : true;

        var _self  = this,
            bucket = this.getStep().getBucket(),
            fields = {};

        // first, clear all the elements
        for ( var group in this.groups )
        {
            this.groups[group].preEmptyBucket( bucket );
        }

        // then update all the elements with the form values in the bucket
        // (using setTimeout allows the browser UI thread to process repaints,
        // added elements, etc, which will ensure that the elements will be
        // available to empty into)
        var empty = function()
        {
            var data = {};

            for ( var name in _self.step.getExclusiveFieldNames() )
            {
                data[ name ] = bucket.getDataByName( name );
            }

            // format the data (in-place, since we're the only ones using this
            // object)
            _self._formatter.format( data, true );

            for ( var name in data )
            {
                var values = data[ name ],
                    i      = values.length;

                while ( i-- )
                {
                    // set the data and do /not/ trigger the change event
                    var group = _self.getElementGroup( name );
                    if ( !group )
                    {
                        // This should not happen (see FS#13653); emit an error
                        // and continue processing in the hopes that we can
                        // display most of the data
                        this.emit( 'error', Error(
                            "Unable to locate group for field `" + name + "'"
                        ) );

                        continue;
                    }

                    var id = _self.getElementGroup( name ).setValueByName(
                        name, i, values[ i ], false
                    );
                }
            }

            // answers are normally only updated on bucket change
            _self._forceAnswerUpdate( bucket.getData() );

            if ( callback instanceof Function )
            {
                callback.call( _self );
            }
        };

        // either execute immediately or set a timer (allowing the UI to update)
        // if a delay was requested
        if ( delay )
        {
            setTimeout( empty, 25 );
        }
        else
        {
            empty();
        }

        return this;
    },


    /**
     * Resets a step to its previous state or hooks the event
     *
     * @param Function callback function to call when reset is complete
     *
     * @return StepUi self to allow for method chaining
     */
    reset: function( callback )
    {
        var step = this;

        this.getStep().getBucket().revert();

        if ( typeof callback === 'function' )
        {
            callback.call( this );
        }

        // clear invalidation flag
        this.invalid = false;

        return this;
    },


    /**
     * Returns whether all the elements in the step contain valid data
     *
     * @return Boolean true if all elements are valid, otherwise false
     */
    isValid: function( cmatch )
    {
        return this.step.isValid( cmatch );
    },


    /**
     * Returns the id of the first failed field if isValid() failed
     *
     * Note that the returned element may not be visible. Visible elements will
     * take precidence --- that is, invisible elements will be returned only if
     * there are no more invalid visible elements, except in the case of
     * required fields.
     *
     * @param {Object} cmatch cmatch data
     *
     * @return String id of element, or empty string
     */
    'public getFirstInvalidField': function( cmatch )
    {
        var $element = this.$content.find(
            '.invalid_field[data-field-name]:visible:first'
        );

        if ( $element.length === 0 )
        {
            $element = this.$content.find(
                '.invalid_field[data-field-name]:first'
            );
        }

        var name = $element.attr( 'data-field-name' );

        // no invalid fields, so what about missing required fields?
        if ( !name )
        {
            // append 'true' indiciating that this is a required field check
            var result = this.step.getNextRequired( cmatch );
            if ( result !== null )
            {
                result.push( true );
            }

            return result;
        }

        // return the element name and index
        return [
            name,

            // calculate index of this element
            this.$content.find( '[data-field-name="' + name + '"]' )
                .index( $element ),

            // not a required field failure
            false
        ];
    },


    /**
     * Scrolls to the element identified by the given id
     *
     * @param {string}  field        name of field to scroll to
     * @param {number}  i            index of field to scroll to
     * @param {boolean} show_message whether to show the tooltip
     * @param {string}  message      tooltip message to display
     *
     * @return {StepUi} self to allow for method chaining
     */
    'public scrollTo': function( field, i, show_message, message )
    {
        show_message = ( show_message === undefined ) ? true : !!show_message;

        if ( !( field ) || ( i < 0 ) || i === undefined )
        {
            // cause may be empty
            var cause = this.step.getValidCause();

            this.emit( 'error',
                Error(
                    'Could not scroll: no field/index provided' +
                    ( ( cause )
                        ? ' (cause: ' + cause + ')'
                        : ''
                    )
                )
            );
        }

        var index    = this.styler.getProperIndex( field, i ),
            $element = this.styler.getWidgetByName( field, index );

        // if the element couldn't be found, then this is useless
        if ( $element.length == 0 )
        {
            this.emit( 'error',
                Error(
                    'Could not scroll: could not locate ' + field + '['+i+']'
                )
            );
        }

        // allow the groups to preprocess the scrolling
        for ( var group in this.groups )
        {
            this.groups[ group ].preScrollTo( field, index );
        }

        // is the element visible now that we've given the groups a chance to
        // display it?
        if ( $element.is( ':visible' ) !== true )
        {
            // fail; don't bother scrolling
            this.emit( 'error', Error(
                'Could not scroll: element ' + field + ' is not visible'
            ) );
        }

        // scroll to just above the first invalid question so that it
        // may be fixed
        var stepui = this;
        this.$content.parent().scrollTo( $element, 100, {
            offset:  { top: -150 },
            onAfter: function()
            {
                // focus on the element and display the tooltip
                stepui.styler.focus( $element, show_message, message );
            }
        } );

        return this;
    },


    /**
     * Invalidates the step, stating that it should be reset next time it is
     * displayed
     *
     * Resetting the step will clear the invalidation flag.
     *
     * @return StepUi self to allow for method chaining
     */
    invalidate: function()
    {
        this.invalid = true;
    },


    /**
     * Returns whether the step has been invalidated
     *
     * @return Boolean true if step has been invalidated, otherwise false
     */
    isInvalid: function()
    {
        return this.invalid;
    },


    /**
     * Returns the GroupUi object associated with the given element name, if
     * known
     *
     * @param {string} name element name
     *
     * @return {GroupUi} group if known, otherwise null
     */
    getElementGroup: function( name )
    {
        return this._fieldGroup[ name ] || null;
    },


    /**
     * Forwards add/remove hiding requests to groups
     *
     * @param {boolean} value whether to hide (default: true)
     *
     * @return {StepUi} self
     */
    hideAddRemove: function( value )
    {
        value = ( value !== undefined ) ? !!value : true;

        for ( var group in this.groups )
        {
            var groupui = this.groups[ group ];
            if ( groupui.hideAddRemove instanceof Function )
            {
                groupui.hideAddRemove( value );
            }
        }

        return this;
    },


    'public preRender': function()
    {
        for ( var group in this.groups )
        {
            this.groups[ group ].preRender();
        }

        return this;
    },


    'public visit': function( callback )
    {
        // "invalid" means that the displayed data is not up-to-date
        if ( this.invalid )
        {
            this.emptyBucket();
            this.invalid = false;
        }

        for ( var group in this.groups )
        {
            this.groups[group].visit();
        }

        var _self = this,
            cn    = 0;

        // we perform async. processing, so ideally the caller should know
        // when we're actually complete
        var c = function()
        {
            if ( --cn === 0 )
            {
                callback();
            }
        };

        this.step.eachSortedGroupSet( function( ids )
        {
            cn++;
            _self._sortGroups( ids, c );
        } );

        if ( cn === 0 )
        {
            callback && callback();
        }

        return this;
    },


    'private _sortGroups': function( ids, callback )
    {
        // detach them all (TODO: a more efficient method could be to detach
        // only the ones that aren not already in order, or ignore ones that
        // would be hidden..etc)
        var len    = ids.length,
            groups = [];

        if ( len === 0 )
        {
            return;
        }

        function getGroup( name )
        {
            return document.getElementById( 'group_' + name );
        }

        var nodes = [];
        for ( var i in ids )
        {
            nodes[ i ] = getGroup( ids[ i ] );
        }

        var prev = nodes[ 0 ];
        if ( !( prev && prev.parentNode ) )
        {
            return;
        }

        // TODO: this makes the assumption that there is a parent node; we
        // should not be concerned with that, and should find some other way
        // of hiding the entire step while sorting (which the Ui handles)
        var step_node = this.$content[ 0 ].parentNode,
            container = step_node.parentNode,
            sibling   = step_node.nextSibling,
            parent    = prev.parentNode,
            i         = len - 1;

        if ( !container )
        {
            return;
        }

        // to prevent DOM updates for each and every group move, detach the node
        // that contains all the groups from the DOM; we'll re-add it after
        // we're done
        container.removeChild( step_node );

        // we can sort the groups in place without screwing up the DOM by simply
        // starting with the last node and progressively inserting nodes
        // before that element; we start at the end simply because there is
        // Node#insertBefore, but no Node#insertAfter
        setTimeout( function()
        {
            try
            {
                do
                {
                    var group = nodes[ i ];

                    if ( !group )
                    {
                        continue;
                    }

                    // remove from DOM and reposition, unless we are already in
                    // position
                    if ( prev.previousSibling !== group )
                    {
                        parent.removeChild( group );
                        parent.insertBefore( group, prev );
                    }

                    prev = group;
                }
                while ( i-- );
            }
            catch ( e )
            {
                // we need to make sure we re-attach the container, so don't blow up
                // if sorting fails
                console.error && console.error( e, group, prev );
            }

            // now that sorting is complete, re-add the groups in one large DOM
            // update, maintaining element order
            if ( sibling )
            {
                container.insertBefore( step_node, sibling );
            }
            else
            {
                container.appendChild( step_node );
            }

            callback();
        }, 25 );
    },


    /**
     * Marks a step as active (or inactive)
     *
     * A step should be marked as active when it is the step that is currently
     * accessible to the user.
     *
     * @param {boolean} active whether step is active
     *
     * @return {StepUi} self
     */
    'public setActive': function( active )
    {
        active = ( active === undefined ) ? true : !!active;

        this._active = active;

        // notify each individual group of whether or not they are now active
        for ( var id in this.groups )
        {
            this.groups[ id ].setActive( active );
        }

        if ( active )
        {
            this.emit( this.__self.$('EVENT_ACTIVE') );
        }

        return this;
    },


    /**
     * Lock/unlock a step (preventing modifications)
     *
     * If the lock status has changed, the elements on the step will be
     * disabled/enabled respectively.
     *
     * @param {boolean} lock whether step should be locked
     *
     * @return {StepUi} self
     */
    'public lock': function( lock )
    {
        lock = ( lock === undefined ) ? true : !!lock;

        // if the lock has changed, then alter the elements
        if ( lock !== this._locked )
        {
            for ( var name in this.step.getExclusiveFieldNames() )
            {
                this.styler.disableField( name, undefined, lock );
            }
        }

        this._locked = lock;
        return this;
    }
} );
