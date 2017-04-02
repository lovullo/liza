/**
 * Contains ProgressDialog Class
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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
 *
 * @todo This thing is ancient (it is barely changed from its early days as
 *       a prototype)
 */

var Class = require( 'easejs' ).Class;


exports.create = function ( title, width, height )
{
    return new ProgressDialog( title, width, height );
};


var ProgressDialog = Class.extend(
{
    /**
     * ProgressDialog window
     * @type {jQuery}
     */
    $dialog: null,

    $content: null,

    $progressBar: null,


    /**
     * Create & manipulate a jquery ui dialog component
     *
     * @param string  title  title of dialog
     * @param integer width  width of dialog
     * @param integer height height of dialog
     *
     * @return undefined
     */
    __construct: function( title, width, height )
    {
        height = height || 'auto';

        this.$dialog = $( "<div>" ).dialog( {
            modal:       true,
            width:       width,
            height:      height,
            resizable:   false,
            title:       title,
            position:    ['center', 100],
            dialogClass: 'nox'
        } );

        this.$content = $( '<div id="dialogContent" class="center"></div>' );

        this.$progressBar = $( '<div id="dialogProgressBar" class="progressBar"></div>' );

        this.$dialog
            .append( this.$content )
            .append( this.$progressBar.hide() );
    },


    /**
     * Clear dialog text
     */
    clear: function()
    {
        this.$content.html( '' );
    },


    setTitle: function( title )
    {
        this.$dialog.dialog( "option", "title", title );

    },

    addMessage: function( html, height )
    {
        $newDiv = $( '<div class="center bold">' + html + '</div>' );

        if ( height !== undefined )
        {
            $newDiv.height( height + 'px' );
        }

        this.$content.append( $newDiv );

    },

    addError: function( html )
    {
        this.$content.append( '<div class="error-box center bold">' + html + '</div>' );

    },

    showProgressBar: function( numberSteps)
    {
        numberSteps = numberSteps || 1;

        for ( i = 0; i < numberSteps; i++ )
        {
            this.$progressBar.append( '<div class="progressSquare" />' );
        }

        this.$progressBar.show();

    },

    showWaitIcon: function()
    {
        this.addMessage( '<div id="loadingIconBar" />' );
    },

    hideWaitIcon: function()
    {
        $( '#loadingIconBar' ).remove();
    },

    progress: function()
    {
        $progressSquare = this.$progressBar.find( '.progressSquare:first' );

        $progressSquare.attr( 'class', 'progressSquareDone' );

    },

    addCloseButton: function( btnText )
    {
        var btnList = this.$dialog.dialog( "option", "buttons" );

        btnText = btnText || "Ok";

        btnList[btnText] = function(){ $( this ).dialog( 'close' ); }

        this.$dialog.dialog( { buttons: btnList } );
    },

    addButton: function( btnText, btnFunction )
    {
        //existing buttons
        var btnList = this.$dialog.dialog( "option", "buttons" );

        btnText = btnText || "Ok";

        btnList[btnText] = btnFunction;

        this.$dialog.dialog( { buttons: btnList } );
    },

    removeButtons: function()
    {
        this.$dialog.dialog( "option", "buttons", [] );
    },

    close: function()
    {
        this.$dialog.dialog( 'close' );
    }
} );

