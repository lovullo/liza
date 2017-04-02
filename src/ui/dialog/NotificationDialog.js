/**
 * Contains notification dialog class
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
var Class           = require( 'easejs' ).Class,
    DialogDecorator = require( './DialogDecorator' );


/**
 * Provides logical defaults for a notification dialog
 * The purpose of the dialog is to communitcate a
 * message to the user
 */
module.exports = Class( 'NotificationDialog' )
    .extend( DialogDecorator,
{
    /**
     * Initializes dialog defaults
     *
     * @return {undefined}
     */
    'protected init': function()
    {
        // set defaults
        this.getDialog()
            .addClass( 'notification-dialog' )
            .setSize( { x: 400, y: 'auto' } )
            .setModal()
            .hideTitlebar()
            .setResizable( false );
    }
} );

