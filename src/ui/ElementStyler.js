/**
 * Archaic DOM element styler
 *
 *  Copyright (C) 2016 R-T Specialty, LLC.
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
 *   - Everything!  This class exists from when the framework was barely
 *     more than a few prototypes and has rotted ever since with little else 
 *     but workarounds.
 * @end needsLove
 */

var State = require( '../data/UsStates' ),
    Class = require( 'easejs' ).Class;


/**
 * Styles DOM elements
 *
 * This class styles DOM elements with Dojo's Dijits (widgets).
 *
 * @return void
 */
module.exports = Class( 'ElementStyler',
{
    /**
     * Stores element types as an associative array
     * @type {Object.<string>}
     */
    elementTypes: {},

    'private _answerRefs': {},

    /**
     * Stores help text for elements
     * @type {Object.<string>}
     */
    elementHelp: {},

    /**
     * Whether to show internal questions
     * @type {boolean}
     */
    _showInternal: false,

    /**
     * Stores defaults for questions
     * @type {Object}
     */
    'private _defaults': {},

    /**
     * Stores defaults for display only
     * @type {Object}
     */
    'private _displayDefaults': {},

    /**
     * Contains data for select
     * @type {Object.<string,string>}
     */
    'private _selectData': {},

    /**
     * Selector context
     * @type {jQuery}
     */
    'private _$context': null,


    _answerStyles: {
        'deductible': function( value, _, default_val  )
        {
            // if no value was given, be sure that we use the proper default
            // value
            if ( ( value === '' ) && default_val )
            {
                return default_val;
            }

            return value + ' Deductible';
        },

        'includeExclude': function( value, _, default_val  )
        {
            // use the default if no value
            if ( ( value === '' ) && default_val )
            {
                return default_val;
            }

            return ( +value === 0 )
                ? 'Excluded'
                : 'Included';
        },

        'state': function( value )
        {
            return State.getName( value );
        },

        /**
         * Styles a no-yes answer
         *
         * A non-zero value is considered to be "Yes". An empty string (unless a
         * default value is given) and "0" are considered to be "No". Default
         * value is only returned if an empty string is provided.
         *
         * @param {string} value       value to style
         * @param {*}      _           ignored
         * @param {string_ default_val default value
         *
         * @return {string} styled answer
         */
        'noyes': function( value, _, default_val )
        {
            // if a default value is provided, we will interpret an empty string
            // as no value and return the default
            if ( ( value === '' ) && default_val )
            {
                return default_val;
            }

            return ( value && ( value !== '0' ) )
                ? 'Yes'
                : 'No';
        },

        'select': function( value, ref_id )
        {
            var val = this._selectData[ref_id][value];

            // return the string associated with the given value
            // (the text for the option), or the given value if it does not
            // exist
            return ( val === undefined )
                ? value
                : val;
        },

        'dateTime': function( value )
        {
            var ret_val = new Date( ( +value ) * 1000 );

            // do not attempt to format if invalid date
            if ( isNaN( ret_val.getDate() ) || value === '' )
            {
                return '';
            }

            return ( ret_val.getMonth() + 1 ) + '/'
                + ret_val.getDate() + '/'
                + ret_val.getFullYear();
        },

        percent: function( value )
        {
            return value + '%';
        },

        waitable: function( value )
        {
            return value.replace(
                /Please wait.../,
                '<div class="plswait">$&</div>'
            );
        }
    },


    __construct: function( jquery )
    {
        this._$context = jquery;
    },


    /**
     * Returns the function to be used for the widget jQuery selector
     *
     * @return Function selector function
     */
    getWidgetSelector: function()
    {
        return function( node, i, data )
        {
            // name of the widget we're searching for
            var name  = data[3],
                $node = $( node );

            // if it's not a widget, bail
            if ( !( $node.hasClass( 'widget' ) ) )
            {
                return false;
            }

            // if no name was given, then don't check for it (they just want to
            // know if this is a widget)
            if ( !( name ) )
            {
                return true;
            }

            // quick name check on self
            if ( $node.attr( 'name' ) === ( name + '[]' ) )
            {
                return true;
            }

            // attempt to locate the element with the name we're looking for
            var $named = $node.find( '[name="' + name + '[]"]' );
            if ( $named.length === 0 )
            {
                return false;
            }

            return true;
        }
    },


    getWidgetIdSelector: function()
    {
        return function( node, i, data )
        {
            // name of the widget we're searching for
            var id    = data[3],
                $node = $( node );

            if ( !( $node.hasClass( 'widget' ) ) )
            {
                return false;
            }

            // if no name was given, then don't check for it (they just want to
            // know if this is a widget)
            if ( !( name ) )
            {
                return true;
            }

            // quick name check on self
            if ( $node.attr( 'id' ) === id )
            {
                return true;
            }

            // attempt to locate the element with the name we're looking for
            var $named = $node.find( '[id="' + id + '"]' );
            if ( $named.length === 0 )
            {
                return false;
            }

            return true;
        }
    },


    /**
     * Applies the style to all DOM elements that are descendants of $content
     *
     * This method operates off of a very basic concept. It takes an array of
     * data containing a jQuery selector and applies the associated attributes
     * to the elements. These attributes are non-standard - that is, they are
     * not valid HTML attributes. Dojo then parses out these attributes and
     * generates the dijit HTML, replacing the existing element.
     *
     * @param jQuery $content parent element containing elements to style
     *
     * @return ElementStyler self to support method chaining
     */
    apply: function( $content, parse )
    {
        parse = ( parse === undefined ) ? true : !!parse;

        // if we're internal, show internal questions
        if ( this._showInternal )
        {
            $content.find( '.hidden.i' ).removeClass( 'hidden' );
        }

        return this;
    },


    /**
     * Called after the content is appended to the DOM for the first time
     *
     * This is used to do final processing for display. In this case, performing
     * the actual styling based off of the previously set attributes.
     *
     * @return ElementStyler self to allow for method chaining
     */
    postAppend: function( $content )
    {
        return this;
    },


    /**
     * Retrieves the id associated with the given element
     *
     * The problem is that Dijits do not always use a single element. They'll
     * often have multiple elements in order to achieve a certain effect. The id
     * may be on a different element than the one that contains the correct name
     * attribute.
     *
     * This method will attempt to find the id by checking first the given
     * element, then its siblings, followed finally by its children. Having to
     * check for siblings is slower than accessing directly, and having to go so
     * far as to check the children is the slowest. It is uncommon to have to
     * check the children, so that check is performed last.
     *
     * @param jQuery $element element to get id of
     *
     * @return String element id or undefined
     */
    getIdFromElement: function( $element )
    {
        // check to see if the given element has the id we're looking for
        // first, otherwise the siblings/children most likely contain the id
        // we're looking for
        return $element.attr( 'widgetid' )
            || $element.attr( 'id' )
            || $element.siblings().filter( '[id]' ).attr( 'id' )
            || $element.children().filter( '[id]' ).attr( 'id' );
    },


    /**
     * Gets the name from a given element
     *
     * This method is needed because the name attribute may exist on a different
     * element than the one provided.
     *
     * @return String|undefined
     */
    getNameFromElement: function( $element )
    {
        if ( !( $element instanceof jQuery ) )
        {
            // assume it's an id
            $element = $( '#' + $element );
        }

        return $element.attr( 'name' )
            || $element.siblings().filter( '[name]' ).attr( 'name' )
            || $element.children().filter( '[name]' ).attr( 'name' )
            || '';
    },


    /**
     * Returns the element with the name attribute
     *
     * This allows referencing the element that should be posted
     *
     * @return jQuery named element
     */
    getNameElement: function( $element )
    {
        // if the passed element has a name attribute, then no searching is
        // needed
        if ( $element.attr( 'name' ) )
        {
            return $element;
        }

        // attempt to find from siblings and children
        return $element.siblings().filter( '[name]' )
            || $element.children().filter( '[name]' )
    },


    'public setOptions': function( name, index, options, val, $context )
    {
        var $element = this.getElementByName( name, index, null, $context );

        // if the provided question is not a select, then we cannot add options
        // to it---use the first index instead
        if ( this._getElementType( name ) !== 'select' )
        {
            $element.val( ( options[ 0 ] || { value: '' } ).value );
            return;
        }

        // store the old value
        val = val || $element.val();

        $element.html('');

        var answer_data = this._selectData[ name ] = {};
        for ( var item in options )
        {
            var opt       = options[ item ],
                opt_value = opt.value === undefined || opt.value === null ?  '' : opt.value;

            answer_data[ opt_value ] = opt.label;

            $element.append(
                $( '<option>' )
                    .attr( 'value', opt_value )
                    .text( opt.label )
            );

            // if we found our old value, re-select it (note that the string
            // cast is important; bucket values are usually strings but the
            // values we set may not be)
            if ( ''+opt_value === ''+val )
            {
                $element.val( val );
            }
        }

        return this;
    },


    'public clearOptions': function( name, index )
    {
        return this.setOptions( name, index, [] );
    },


    /**
     * Sets element value given a name and index
     *
     * @param {string}  name         element name
     * @param {number}  index        index to set
     * @param {string}  value        value to set
     * @param {boolean} change_event whether to trigger change event
     * @param {jQuery=} $context     optional DOM element context
     *
     * @return {ElementStyler} self
     */
    setValueByName: function( name, index, value, change_event, $context )
    {
        change_event = ( change_event === undefined ) ? true : change_event;

        // just to be sure before we fully remove this
        if ( change_event !== false )
        {
            throw Error(
                "ElementStyler#setValueByName change_event is being removed"
            );
        }

        // set value
        switch ( this._getElementType( name ) )
        {
            case 'noyes':
            case 'radio':
            case 'legacyradio':
                var elements = [];
                if ( $context && $context.singleIndex )
                {
                    // get all elements
                    elements = this.getElementByName(
                        name, undefined, null, $context
                    );
                }
                else
                {
                    var group_length = this.getElementLength( name, $context ),
                        current      = index * group_length,
                        end          = ( ( ( index + 1 ) * group_length ) - 1 );
                    while ( current <= end )
                    {
                        elements.push( this.getWidgetByName(
                            name, current, null, $context
                        ) );

                        current++;
                    }
                }

                var i = elements.length;
                while ( i-- )
                {
                    const question = elements[ i ];
                    question.checked = ( question.value === ''+value );
                }

                break;

            default:
                const $element = this.getElementByName(
                    name, index, null, $context
                );
                $element.val( ''+( value ) );
        }

        return this;
    },


    styleAnswer: function( ref_id, value )
    {
        var type = this._getElementType( ref_id );
        if ( !( type ) )
        {
            return value;
        }

        var format      = this._getAnswerStyler( type ),
            default_val = this._displayDefaults[ ref_id ]
                || this._defaults[ ref_id ];

        if ( format )
        {
            return format.call( this, value, ref_id, default_val );
        }

        return ( value === '' || typeof value === 'undefined' )
            ? default_val || value
            : value;
    },


    /**
     * Determine field type
     *
     * This maintains BC: the old data format used a string to represent
     * the type, whereas the new system uses an object describing additional
     * details.
     *
     * @param {string} name type name
     *
     * @return {string|undefined} type of field NAME
     */
    'private _getElementType': function( name )
    {
        var type_data = this.elementTypes[ name ];

        return ( type_data )
            ? type_data.type || type_data
            : undefined;
    },


    'private _getAnswerStyler': function( type )
    {
        return this._answerStyles[ type ];
    },


    setTypeData: function( data )
    {
        this.elementTypes = data;
        return this;
    },


    'public setAnswerRefs': function( data )
    {
        this._answerRefs = data;
        return this;
    },


    showInternal: function()
    {
        this._showInternal = true;
        return this;
    },


    addAnswerStyle: function( type, handler )
    {
        this._answerStyles[type] = handler;
        return this;
    },


    /**
     * Removes the element identified by the given id from the DOM
     *
     * This will ensure that styled elements are also removed from memory, so
     * that the same id can later be styled if it is readded.
     *
     * If the element is not styled, this method will fall back on jQuery to
     * attempt to locate and remove it.
     *
     * @return ElementStyler self to allow for method chaining
     */
    remove: function( id )
    {
        if ( !id )
        {
            return this;
        }

        var $element = ( id instanceof jQuery )
            ? id
            : $( '#' + id );

        $element.remove();

        return this;
    },


    /**
     * Focuses on an element and optionally displays the tooltip
     *
     * @param jQuery  $element     element to focus on
     * @param Boolean tooltip      whether to display the tooltip
     * @param String  tooltip_text text to display on tooltip (optional)
     *
     * @return ElementStyler self to allow for method chaining
     */
    focus: function( $element, tooltip, tooltip_text )
    {
        tooltip = !!tooltip;

        // place focus on the element
        $element.focus();

        return this;
    },


    /**
     * Get the element with an id associated with the given name
     *
     * Styled elements may have separate DOM elements for the name and the id of
     * the original element. In some cases, for example, the named element is a
     * hidden field, whereas the id element is the actual entry textbox that
     * should have focus. This method aims to return the element that should
     * receive that focus.
     *
     * @param String  name  name of the element
     * @param Integer index index of the element (0 by default)
     *
     * @return jQuery requested element
     */
    getIdElementFromName: function( name, index, $parent )
    {
        index   = +index || 0;
        $parent = $parent || $( 'body' );

        var $element = $parent.find(
            "[name='" + name + "[]']:nth(" + index + ")"
        );
        var id = this.getIdFromElement( $element );

        return $( '#' + id );
    },


    /**
     * Disable a field
     *
     * @param {string}  id    id of the field to disable
     * @param {boolean} value whether to disable the element
     *
     * @return {ElementStyler} self
     */
    disable: function( name, value )
    {
        var $elements = ( name instanceof jQuery )
            ? name
            : this.getElementByName( name );

        $elements.attr( 'disabled', !!value );

        console.error( '[Deprecated] ElementStyler.disable()' );
        return this;
    },


    /**
     * Disable the given field
     *
     * @param {string}   name    field name
     * @param {number}   index   field index
     * @param {boolean=} disable whether to disable (default true)
     *
     * @return {ElementStyler} self
     */
    'public disableField': function( name, index, disable, $context )
    {
        disable = ( disable === undefined ) ? true : !!disable;

        var $e = this.getElementByName( name, index, null, $context );
        if ( !disable && $e.hasClass( 'readonly' ) )
        {
            // do not enable read-only fields
            return;
        }

        $e.attr( 'disabled', disable );
        return this;
    },


    /**
     * Enable the given field
     *
     * @param {string} name  field name
     * @param {number} index field index
     *
     * @return {ElementStyler} self
     */
    'public enableField': function( name, index )
    {
        this.disableField( name, index, false );
    },


    /**
     * Sets help data
     *
     * Should be provided as an associative array, with the question name as the
     * key and the help text as the value.
     *
     * @param {Object} data help data
     *
     * @return {ElementStyler} self
     */
    setHelpData: function( data )
    {
        this.elementHelp = data;
        return this;
    },


    /**
     * Returns the help text associated with the given element id
     *
     * If no help text is available, this method will fall back on the invalid
     * message.
     *
     * @param {jQuery} $element element
     *
     * @return {string} help message
     */
    getHelpMessage: function( $element )
    {
        var name = ( $element.attr( 'name' ) || '' ).replace( /\[\]$/, '' );
        return this.elementHelp[ name ] || '';
    },


    setDefaults: function( defaults )
    {
        this._defaults = defaults;
        return this;
    },


    'public setDisplayDefaults': function( defaults )
    {
        this._displayDefaults = defaults;
        return this;
    },


    getDefault: function( name )
    {
        return this._defaults[ name ];
    },


    'public setSelectData': function( data )
    {
        this._selectData = data;
    },


    'public setContext': function( $ )
    {
        this._$context = $;
    },


    /**
     * Retrieve widgets by the given name and optional index
     *
     * This allows for a simple mapping from bucket to UI.
     *
     * @param {string}  name     element name (question name)
     * @param {number=} index    index of element to retrieve (bucket index)
     * @param {string=} filter   filter to apply to widgets
     * @param {jQuery=} $context filtering context
     *
     * @return {jQuery} matches
     */
    'public getWidgetByName': function( name, index, filter, $context )
    {
        $context = $context || this._$context;

        // find the field; note that we *skip* the index selection if we have
        // been notified---via a property on the context---that the content
        // should contain only the index we are looking for
        var $results = this._getWidgetByNameQuick( name, index, $context );

        if ( filter )
        {
            return $results.filter( filter );
        }

        return $results;
    },


    /**
     * Attempt to quickly locate an element by id
     *
     * Otherwise, we have to fall back to scanning the DOM. Note that, if we do
     * not find a match on the id, this will be slower than if we hadn't
     * performed the check to begin with, so the idea is to find the id for as
     * many as possible.
     */
    'private _getWidgetByNameQuick': function( name, index, $context )
    {
        var hasindex = ( ( index !== undefined ) && !$context.singleIndex );

        if ( hasindex )
        {
            var id = this._getElementId( name, index, $context );

            if ( id )
            {
                $element = $context.find( '#' + id );

                // let's hope for the best
                if ( $element.length )
                {
                    return $element;
                }
            }
        }

        // damnit. Fallback to the painfully slow method.
        return $context.find( '[data-field-name="' + name + '"]' +
            ( ( hasindex )
                ? ':nth(' + +index + ')'
                : ''
            )
        );
    },


    /**
     * Retrieve elements by the given name and optional index
     *
     * This allows for a simple mapping from bucket to UI.
     *
     * If multiple elements exist for a group of elements (e.g. radios), the
     * first element in the group will be returned.
     *
     * @param {string}  name     element name (question name)
     * @param {number=} index    index of element to retrieve (bucket index)
     * @param {string=} filter   filter to apply to widgets
     * @param {jQuery=} $context filtering context
     *
     * @return {jQuery} matches
     */
    'public getElementByName': function( name, index, filter, $context )
    {
        var proper_index = ( index !== undefined )
            ? this.getProperIndex( name, index, $context )
            : undefined;

        var oldflag;
        if ( $context )
        {
            // let's avoid a perf hit that would arise from cloning and
            // potential problems with jQuery from creating a prototype...
            oldflag = $context.singleIndex;

            // proper_index above takes into account the singleIndex flag, so we
            // do not need it for the getWidgetByName() call
            if ( +index !== +proper_index )
            {
                $context.singleIndex = false;
            }
        }

        var result = this.getWidgetByName(
            name, proper_index, filter, $context
        );

        // mutability sucks.
        if ( $context )
        {
            $context.singleIndex = oldflag;
        }

        return result;
    },


    /**
     * Attempt to retrieve DOM element by name, or id if not a field
     *
     * If NAME does not represent a known field, the element will be located
     * using NAME as an element id; otherwise, this acts just as
     * getElementByName.
     *
     * @param {string}  name     element name (question name)
     * @param {number=} index    index of element to retrieve (bucket index)
     * @param {string=} filter   filter to apply to widgets
     * @param {jQuery=} $context filtering context
     *
     * @return {jQuery} matches
     */
    'public getElementByNameLax': function(
        name, index, filter, $context
    )
    {
        $context = $context || this._$context;

        if ( !( this.isAField( name ) ) )
        {
            return $context.find(
                '#' + name + ':nth(' + index + ')'
            );
        }

        return this.getElementByName(
            name, index, filter, $context
        );
    },


    /**
     * Retrieve id of the element from the given name and index
     *
     * This is necessary both because we do not want id "guess" logic spread
     * throughout the code and because the id indexes do not necessarily match
     * the bucket indexes.
     *
     * @param {string}  name  element name (question name)
     * @param {number} index  index of element to retrieve (bucket index)
     *
     * @return {string} id or empty string if not found
     */
    'public getElementIdFromName': function( name, index )
    {
        return this.getElementByName( name, index )
            .attr( 'id' ) || '';
    },


    'public getProperIndex': function ( name, index, $context )
    {
        var len = this.getElementLength( name, $context );

        // if the context states that we have only a single index, and the
        // element length is greater than 1, then we want to return a relative
        // index
        if ( $context && ( len > 1 ) && ( $context.singleIndex === true ) )
        {
            // the index passed to us, unadjusted, is the relative value we're
            // looking for
            return 0;
        }

        // otherwise, calculate the proper index for the lookup based on the
        // element length
        var proper_index = ( index !== undefined )
            ? ( +index * len )
            : undefined;

        return proper_index;
    },

    /**
     * Determines the number of elements in a group of the given element type
     *
     * @param {string} name element name
     *
     * @return {number} element length
     */
    'public getElementLength': function( name, $context )
    {
        $context = $context || this._$context;

        switch ( this._getElementType( name ) )
        {
            // TODO: use same method as radio
            case 'noyes':
                return 2;

            case 'radio':
                return this.getWidgetByName( name, 0, null, $context )
                    .attr( 'data-question-length' );

            case 'legacyradio':
                return $context.find( '[name="' + name + '[]"]' ).length;

            default:
                return 1;
        }
    },


    'public isAField': function( name )
    {
        // consider both elements and answers to be fields (note that displays
        // are considered to be answers)
        return ( ( this._getElementType( name ) !== undefined )
            || ( this._answerRefs[ name ] !== undefined )
        );
    },


    'private _getElementId': function( name, index, $context )
    {
        switch ( this._getElementType( name ) )
        {
            case 'radio': return '';
            case 'noyes':
                // append yes/no depending on whether or not the given index is
                // even/odd
                name += ( index & 0x01 )
                    ? '_y'
                    : '_n';

                index = index / 2;

                /* fallthrough */

            default:
                return 'q_' + name + '_' + index;
        }
    },


    'public getAnswerElementByName': function( name, index, filter, $context )
    {
        var $results = ( $context || this._$context ).find(
            '[data-answer-ref="' + name + '"]' +
            ( ( index !== undefined )
                ? '[data-index="' + index + '"]'
                : ''
            )
        );

        if ( filter )
        {
            return $results.filter( filter );
        }

        return $results;
    },


    /**
     * Set the status of a particular field
     *
     * The status is simply an element appended after the element itself; the
     * stylesheet is to determine how exactly it is displayed. The status will
     * have a class of "sidebyside", which is taken from legacy code, in
     * addition to "status" to uniquely identify this element.
     *
     * @param {string} name  element name (question name)
     * @param {number} index index of element to retrieve (bucket index)
     * @param {string} value text to display
     *
     * @return {ElementStyler} self
     */
    'public setStatus': function( name, index, value )
    {
        var $element = this.getElementByName( name, index ),
            id       = $element.attr( 'id' ) + '__status',
            $status  = $( '#' + id );

        // create the element if it does not yet exist
        if ( !( $status.length ) )
        {
            $status = $( '<span>' )
                .attr( 'id', id )
                .addClass( 'sidebyside' )
                .addClass( 'status' );

            $element.after( $status );
        }

        // update the text
        $status.text( value );

        return this;
    }
});
