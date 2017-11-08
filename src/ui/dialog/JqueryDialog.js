/**
 * Contains class representing a jQuery dialog
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

var Class  = require( 'easejs' ).Class,
    Dialog = require( './Dialog' );


/**
 * Dialog using jQuery UI
 */
module.exports = Class( 'JqueryDialog' )
    .implement( Dialog )
    .extend(
{
    /**
     * jQuery object to use for dialog
     *
     * The object must have the Dialog jQuery UI extension loaded
     *
     * @type {jQuery}
     */
    'private _jquery': null,

    /**
     * Element containing the dialog
     * @type {jQuery}
     */
    'private _$dialog': null,


    /**
     * Buttons to append to dialog
     * @type {Object}
     */
    'private _buttons': {},

    /**
     * Dialog type id
     *
     * @type {string}
     */
    'private _typeId': 'liza-dialog',


    /**
     * Initializes dialog
     *
     * @param {jQuery} jquery jquery object to use
     *
     * @return {undefined}
     */
    __construct: function( jquery, id )
    {
        this._jquery = jquery;

        this._$dialog = this._jquery( '<div>' )
            .dialog( {
                // don't show until we're ready
                autoOpen: false,
            }
        );
    },


    /**
     * Uniquely identify dialog type
     *
     * The `type_id` is exposed as a CSS class for styling.
     *
     * @param {string} type_id unique type identifier
     *
     * @return {JqueryDialog} self
     */
    'public setTypeId': function( type_id )
    {
        this._typeId = ''+type_id;
        return this;
    },


    /**
     * Sets the dialog title
     *
     * @param {string} title dialog title
     *
     * @return {JqueryDialog} self
     */
    'public setTitle': function( title )
    {
        title = ''+( title );

        this._$dialog.dialog( { title: title } );
        return this;
    },


    'public hideTitlebar': function()
    {
        this._$dialog.parent( '.ui-dialog' ).find( '.ui-dialog-titlebar' )
            .hide();

        return this;
    },


    /**
     * Sets/unsets the dialog as modal
     *
     * @param {boolean} modal whether to make dialog modal
     *
     * @return {JqueryDialog} self
     */
    'public setModal': function( modal )
    {
        modal = ( modal === undefined ) ? true : !!modal;

        this._$dialog.dialog( { modal: modal } );
        return this;
    },


    /**
     * Sets whether the dialog can be resized
     *
     * @param {boolean} resizable whether the dialog can be resized
     *
     * @return {JqueryDialog} self
     */
    'public setResizable': function( resizable )
    {
        resizable = ( resizable === undefined ) ? true : !!resizable;

        this._$dialog.dialog( { resizable: resizable } );
        return this;
    },


    /**
     * Shows/hides the 'X' button, allowing the dialog to be manually closed
     * without use of a button
     *
     * @param {boolean} hide whether to hide the X
     *
     * @return {JqueryDialog} self
     */
    'public hideX': function( hide )
    {
        hide = ( hide === undefined ) ? true : !!hide;

        this._$dialog.dialog( { dialogClass: 'nox' } );
        return this;
    },


    /**
     * Sets the width and height of the dialog
     *
     * @param {{ x: (number|string)=, y: (number|string)= }} size dialog size
     *
     * @return {JqueryDialog} self
     */
    'public setSize': function( size )
    {
        size = size || {};

        if ( size.x )
        {
            this._$dialog.dialog( { width: size.x } );
        }

        if ( size.y )
        {
            this._$dialog.dialog( { height: size.y } );
        }

        return this;
    },


    /**
     * Adds a CSS class to the dialog
     *
     * @param {string} class_name name of the class
     *
     * @return {JquerDialog} self
     */
    'public addClass': function( class_name )
    {
        this._$dialog.addClass( class_name );
        return this;
    },


    /**
     * Sets the buttons to be displayed on the dialog
     *
     * @param {Object.<string, function()>} buttons
     *
     * @return {JqueryDialog} self
     */
    'public setButtons': function( buttons )
    {
        buttons = buttons || {};

        var dialog = this,
            orig   = null;

        for ( label in buttons )
        {
            orig = buttons[ label ];

            // remove if the callback is undefined (meaning the button will not
            // be shown)
            if ( orig === undefined )
            {
                delete buttons[ label ];
                continue;
            }

            dialog.appendButton( label, buttons[ label ] );
        }

        return this;
    },


    /**
     * Appends a button to the dialog
     *
     * @param {string}     label    button label
     * @param {function()} callback callback to invoke when button is clicked
     *
     * @return {JqueryDialog} self
     */
    'public appendButton': function( label, callback )
    {
        var _self = this;

        label    = label    || 'Close';
        callback = callback || function()
        {
            _self.close();
        };

        this._buttons[ label ] = function()
        {
            // WARNING: Breaks encapsulation, since callback will have access to
            // private members. Consider alternative in the future (may break
            // existing callbacks).
            callback.call( _self );
        };

        return this;
    },


    /**
     * Sets the dialog content as HTML
     *
     * @param {string|jQuery} html HTML content
     *
     * @return {JqueryDialog} self
     */
    'public setHtml': function( html )
    {
        this._$dialog.html( html );
        return this;
    },


    /**
     * Appends HTML to the dialog content
     *
     * @param {string|jQuery} html HTML content
     *
     * @return {JqueryDialog} self
     */
    'public appendHtml': function( html )
    {
        this._$dialog.append( html );
        return this;
    },


    /**
     * Sets the dialog content as plain text
     *
     * @param {string} text plain text
     *
     * @return {JqueryDialog} self
     */
    'public setText': function( text )
    {
        text = ''+( text );

        this._$dialog.text( text );
        return this;
    },


    /**
     * Callback to call when dialog is opened
     *
     * @return {JqueryDialog} self
     */
    'public onOpen': function( callback )
    {
        var dialog = this;

        this._$dialog.dialog( {
            open: function()
            {
                callback.call( dialog );
            }
        } );

        return this;
    },


    /**
     * Callback to call when dialog is closed
     *
     * @return {JqueryDialog} self
     */
    'public onClose': function( callback )
    {
        var dialog = this;

        this._$dialog.dialog( {
            close: function()
            {
                callback.call( dialog );
            }
        } );

        return this;
    },


    /**
     * Displays the dialog
     *
     * @return {JqueryDialog} self
     */
    'virtual public open': function()
    {
        this._$dialog.dialog( {
            buttons:     this._buttons,
            dialogClass: this._typeId,
        } );

        this._$dialog.dialog( 'open' );
        return this;
    },


    /**
     * Hides the dialog
     *
     * @return {JqueryDialog} self
     */
    'public close': function()
    {
        this._$dialog.dialog( 'close' );
        return this;
    }
} );

