/**
 * Contains DevDaemon class
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var Class  = require( 'easejs' ).Class,
    Daemon = require( './Daemon' );


/**
 * Daemon to use for local development
 *
 * This daemon does not use the encryption service.
 */
module.exports = Class( 'DevDaemon' ).extend( Daemon,
{
    /**
     * Returns dummy encryption service
     *
     * For development purposes, running the encryption service is unnecessary.
     * Instead, use a dummy service that simply returns what it was given.
     *
     * @return {EncryptionService}
     */
    'protected getEncryptionService': function()
    {
        var log = this.getDebugLog();
        log.log( log.PRIORITY_INFO, "Using dummy (echo) encryption service" );

        return require( '../encsvc/EchoEncryptionServiceFactory' )()
            .create();
    },
} );

