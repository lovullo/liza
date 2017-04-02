/**
 * Contains EncryptionService class
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
 * Simple client to encrypt/decrypt data through use of a service
 */
module.exports = Class( 'EncryptionService',
{
    /**
     * Identifies a block of data as encrypted through this service
     * @type {string}
     */
    'private const ENC_HEADER': "\x06\x03\x05",


    /**
     * Object to do the actual data transfer to/from the service
     * @type {EncryptionServiceTransfer}
     */
    'private _transfer': null,


    /**
     * Initializes service client
     *
     * @param {EncryptionServiceTransfer} transfer transfer object
     *
     * @return {undefined}
     */
    'public __construct': function( transfer )
    {
        this._transfer = transfer;
    },


    /**
     * Encrypts the given data and returns the result
     *
     * This operation is asynchronous.
     *
     * @param {Buffer}           data     data to encrypt
     * @param {function(Buffer)} callback function to call with resulting data
     *
     * @return {undefined}
     */
    'public encrypt': function( data, callback )
    {
        var _self = this;

        this._transfer.encrypt( data, function( data )
        {
            // return the encrypted data, complete with header
            callback( _self._addHeader( data ) );
        } );

        return this;
    },


    /**
     * Decrypts the given data and returns the result
     *
     * This operation is asynchronous.
     *
     * @param {Buffer}           data     data to decrypt
     * @param {function(Buffer)} callback function to call with resulting data
     *
     * @return {undefined}
     */
    'public decrypt': function( data, callback )
    {
        // if the first bytes are not the encryption header, then it may not be
        // safe to decrypt
        if ( this.isEncrypted( data ) === false )
        {
            throw TypeError( "Missing encryption header" );
        }

        this._transfer.decrypt( this._stripHeader( data ), callback );
        return this;
    },


    /**
     * Returns whether the provided data is encrypted
     *
     * This operates by checking for the encryption header. If it is present, it
     * is considered to be encrypted.
     *
     * @param {Buffer} data data to check
     *
     * @return {boolean} true if encrypted, otherwise false
     */
    'public isEncrypted': function( data )
    {
        if ( !( data instanceof Buffer ) )
        {
            return false;
        }

        // if it's too small, it can't possibly include a header
        if ( data.length < 3 )
        {
            return false;
        }

        var head_bytes = data.slice( 0, this.__self.$('ENC_HEADER').length )
            .toString( 'ascii' );

        return ( head_bytes === this.__self.$('ENC_HEADER') )
            ? true
            : false;
    },


    /**
     * Prepends encryption header to data
     *
     * This operation is synchronous, but memcpy() is fairly quick. If we
     * experience many problems, we'll make it async.
     *
     * @param {Buffer} data
     *
     * @return {Buffer} data, with header
     */
    'private _addHeader': function( data )
    {
        var header_len = this.__self.$('ENC_HEADER').length;

        // create a new buffer to store the encrypted data along with the header
        var buf = new Buffer( data.length + header_len );

        // write the header and copy in the encrypted data
        buf.write( this.__self.$('ENC_HEADER') );
        data.copy( buf, header_len );

        return buf;
    },


    /**
     * Strips encryption header from data
     *
     * @param {Buffer} data
     *
     * @return {Buffer} data, without header
     */
    'private _stripHeader': function( data )
    {
        var header_len = this.__self.$('ENC_HEADER').length;

        // create a new buffer and copy all data except for the header
        var buf = new Buffer( data.length - header_len );
        data.copy( buf, 0, header_len );

        return buf;
    },


    'public getHeader': function()
    {
        return this.__self.$('ENC_HEADER');
    }
} );

