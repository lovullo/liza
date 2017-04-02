/**
 * Contains EchoEncryptionServiceTransfer class
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

var Class = require( 'easejs' ).Class;

    /**
     * Interface
     * @type {EncryptionServiceTransfer}
     */
    EncryptionServiceTransfer = require( './EncryptionServiceTransfer' );


/**
 * Simply echoes back the data to be encrypted. Does not do any actual
 * encryption. Useful fallback when service is unavailable or is not intended to
 * be available (e.g. local development).
 */
module.exports = Class( 'EchoEncryptionServiceTransfer' )
    .implement( EncryptionServiceTransfer )
    .extend(
{
    /**
     * Echo back the provided data
     *
     * @param {string}             data     data to encrypt
     * @param {function( Buffer )} callback function to call with encrypted data
     *
     * @return undefined
     */
    'public encrypt': function( data, callback )
    {
        // simply echo the data back as a buffer
        callback( new Buffer( data, 'binary' ) );
    },


    /**
     * Echo back the provided data
     *
     * This operation is asynchronous.
     *
     * @param {Buffer}             data     data to decrypt
     * @param {function( string )} callback function to call with decrypted data
     *
     * @return undefined
     */
    'public decrypt': function( data, callback )
    {
        // simply echo the data back as a buffer
        callback( new Buffer( data, 'binary' ) );
    },
} );

