/**
 * Contains Dialog interface
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
 */

var Interface = require( 'easejs' ).Interface;


/**
 * Represents a dialog that can be displayed to the user as a "window"
 */
module.exports = Interface( 'Dialog',
{
    /**
     * Sets the dialog title
     *
     * @param {string} title dialog title
     *
     * @return {Dialog} self
     */
    'public setTitle': [ 'title' ],


    /**
     * Sets/unsets the dialog as modal
     *
     * @param {boolean} modal whether to make dialog modal
     *
     * @return {Dialog} self
     */
    'public setModal': [ 'true' ],


    /**
     * Sets whether the dialog can be resized
     *
     * @param {boolean} resizable whether the dialog can be resized
     *
     * @return {Dialog} self
     */
    'public setResizable': [ 'true' ],


    /**
     * Shows/hides the 'X' button, allowing the dialog to be manually closed
     * without use of a button
     *
     * @param {boolean} hide whether to hide the X
     *
     * @return {Dialog} self
     */
    'public hideX': [ 'true' ],


    /**
     * Sets the width and height of the dialog
     *
     * @param {{ x: (number|string)=, y: (number|string)= }} size dialog size
     *
     * @return {Dialog} self
     */
    'public setSize': [ 'size' ],


    /**
     * Adds a CSS class to the dialog
     *
     * @param {string} class_name name of the class
     *
     * @return {Dialog} self
     */
    'public addClass': [ 'class_name' ],


    /**
     * Sets the buttons to be displayed on the dialog
     *
     * @param {Object.<string, function()>} buttons
     *
     * @return {Dialog} self
     */
    'public setButtons': [ 'buttons' ],


    /**
     * Appends a button to the dialog
     *
     * @param {string}     label    button label
     * @param {function()} callback callback to invoke when button is clicked
     *
     * @return {Dialog} self
     */
    'public appendButton': [ 'label', 'callback' ],


    /**
     * Sets the dialog content as HTML
     *
     * @param {string|jQuery} html HTML content
     *
     * @return {Dialog} self
     */
    'public setHtml': [ 'html' ],


    /**
     * Appends HTML to the dialog content
     *
     * @param {string|jQuery} html HTML content
     *
     * @return {Dialog} self
     */
    'public appendHtml': [ 'html' ],


    /**
     * Sets the dialog content as plain text
     *
     * @param {string} text plain text
     *
     * @return {Dialog} self
     */
    'public setText': [ 'text' ],


    /**
     * Callback to call when dialog is opened
     *
     * @return {Dialog} self
     */
    'public onOpen': [ 'callback' ],


    /**
     * Callback to call when dialog is closed
     *
     * @return {Dialog} self
     */
    'public onClose': [ 'callback' ],


    /**
     * Displays the dialog
     *
     * @return {Dialog} self
     */
    'public open': [],


    /**
     * Hides the dialog
     *
     * @return {Dialog} self
     */
    'public close': []
} );

