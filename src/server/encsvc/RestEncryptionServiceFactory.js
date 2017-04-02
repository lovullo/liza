/**
 * Contains RestEncryptionServiceFactory
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

var Class = require( 'easejs' ).Class,

    Service  = require( './EncryptionService' ),
    Transfer = require( './HttpEncryptionServiceTransfer' );


/**
 * Factory for creating a client to a RESTful encryption service
 */
module.exports = Class( 'RestEncryptionServiceFactory',
{
    /**
     * Creates a new encryption service
     *
     * @param {string} host service host
     * @param {number} port service port
     *
     * @return {EncryptionService}
     */
    'public create': function( host, port )
    {
        return Service( Transfer( host, port ) );
    },
} );

