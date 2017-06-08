/**
 * UiStyler class
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

var Class        = require( 'easejs' ).Class,
    EventEmitter = require( 'events' ).EventEmitter;


/**
 * Handles general styling of the GUI
 *
 * Supported events:
 *   questionHover - user hovers mouse over/out of a question
 *   questionFocus - question is given focus
 */
module.exports = Class( 'UiStyler' )
    .extend( EventEmitter,
{
    /**
     * EventEmitter events
     *
     * This is a workaround for an issue whereby EventEmitter (which we are
     * extending) only has access to the public state, whereas this class
     * has access to private; the latter masks the former.
     *
     * TODO: Remove when this issue is corrected in ease.js.
     *
     * @var {Array}
     */
    'public _events': {},

    /**
     * Content to be styled
     * @type {jQuery}
     */
    'private _$content': null,

    /**
     * Object used to style elements
     * @type {ElementStyler}
     */
    'private _elementStyler': null,

    /**
     * Context representing the active step
     * @type {Context}
     */
    'private _context': null,


    /**
     * Initializes styler on the given content
     *
     * The styler will monitor for changes to $content and apply the style to
     * any new elements automatically.
     *
     * @param {jQuery} $content content to initialize
     *
     * @return {undefined}
     */
    'public __construct': function( $content, element_styler )
    {
        this._$content      = $content;
        this._elementStyler = element_styler;
    },


    /**
     * Template method that initializes all styles on the content
     *
     * @return {UiStyler} self
     */
    'public init': function()
    {
        this._initQuestionHover();
        this._initQuestionFocus();
        this._initErrorBoxHover();

        return this;
    },


    'public register': function( as )
    {
        var _self = this;
        return function()
        {
            // refuse to raise events if we have no active context
            if ( !( _self._context ) )
            {
                return;
            }

            _self.emit.apply( _self,
                [ as, _self._context ]
                    .concat( Array.prototype.slice.call( arguments ) )
            );
        };

        return this;
    },


    'public setContext': function( context )
    {
        this._context = context;
    },


    'public attach': function( styler )
    {
        var hooks = styler.getHooks();
        for ( var event in hooks )
        {
            this.on( event, hooks[ event ] );
        }

        return this;
    },


    'public detach': function( styler )
    {
        var hooks = styler.getHooks();
        for ( var event in hooks )
        {
            this.removeListener( event, hooks[ event ] );
        }

        return this;
    },


    /**
     * Provides hover effects when mousing over a question row
     *
     * This is used (a) because CSS cannot be used for certain conditions and
     * (b) because IE6 doesn't support :hover for anything other than links.
     *
     * @return {undefined}
     */
    'private _initQuestionHover': function()
    {
        var _self = this;
        this._$content.live( 'mouseover.program mouseout.program',
            function( event )
            {
                var target = event.target || {},
                    parent = target.parentElement || {};

                if ( parent.nodeName === 'DD' )
                {
                    target = parent;
                }

                var hl = ( event.type == 'mouseover' ) ? true : false;
                _self._highlightRow( $( target ), 'hover', hl );

                // pass to callback
                _self.emit( 'questionHover', target, hl );
            }
        );
    },


    /**
     * Highlights the question row when it receives focus
     *
     * @return {undefined}
     */
    'private _initQuestionFocus': function()
    {
        var _self = this;
        this._$content.find( 'input' ).live( 'focus.program, blur.program',
            function( event )
            {
                var hl = ( ( event.type == 'focus' )
                        || ( event.type == 'focusin' ) )
                    ? true : false;

                // select the parent row, be it a normal question list or a
                // table
                var $element = $( this ).parents( 'dd:first, tr:first' );
                _self._highlightRow( $element, 'focus', hl );

                // pass to callback
                _self.emit( 'questionFocus', this, hl );
            }
        );
    },


    /**
     * Highlights the associated element when user hovers over error box with
     * mouse
     *
     * @return {undefined}
     */
    'private _initErrorBoxHover': function()
    {
        var _self = this;
        this._$content.find( '.error-box li' )
            .live( 'mouseover.program mouseout.program',
                function( event )
                {
                    var $this = $( this );
                    var name  = $this.data( 'ref' );
                    var index = $this.data( 'ref_index' );

                    var $element = _self._$content.find(
                        '[name="' + name + '[]"]:nth(' + index + ')'
                    ).parents( 'tr, dd' );

                    var hl = ( event.type == 'mouseover' ) ? true : false;
                    _self._highlightRow( $element, 'hover', hl );
                }
            );
    },


    /**
     * Highlights a row
     *
     * The sibling dd or dt will be located and highlighted automatically.
     *
     * @param jQuery  $element dd or dt to highlight
     * @param String  style    class to apply
     * @param Boolean apply    whether to apply or remove the style
     *
     * @return undefined
     */
    'private _highlightRow': function( $element, style, apply )
    {
        if ( $element.length == 0 )
        {
            return;
        }

        var node_name = $element.get( 0 ).nodeName,
            elements  = [ $element ],
            element   = null;

        // locate the sibling element
        var $other;
        if ( node_name == 'DD' )
        {
            elements.push( $element.prev( 'dt' ) );
        }
        else if ( node_name == 'DT' )
        {
            elements.push( $element.next( 'dd' ) );
        }

        // apply or remove the style
        var len = elements.length;
        if ( apply )
        {
            for ( var i = 0; i < len; i++ )
            {
                elements[i].addClass( style );
            }
        }
        else
        {
            for ( var i = 0; i < len; i++ )
            {
                elements[i].removeClass( style );
            }
        }
    }
} );

