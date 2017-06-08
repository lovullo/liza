/**
 * Contains EncryptionServiceTransfer class
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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

var Interface = require( 'easejs' ).Interface;


/**
 * Facilitates data transfer between encryption service and client
 */
module.exports = Interface( 'EncryptionServiceTransfer',
{
    /**
     * Encrypt the provided data
     *
     * This operation is asynchronous.
     *
     * @param {string}             data     data to encrypt
     * @param {function( Buffer )} callback function to call with encrypted data
     *
     * @return undefined
     */
    'public encrypt': [ 'data', 'callback' ],


    /**
     * Decrypts the provided data
     *
     * This operation is asynchronous.
     *
     * @param {Buffer}             data     data to decrypt
     * @param {function( string )} callback function to call with decrypted data
     *
     * @return undefined
     */
    'public decrypt': [ 'data', 'callback' ],
} );

