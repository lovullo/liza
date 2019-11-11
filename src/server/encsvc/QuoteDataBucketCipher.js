/**
 * Handles encryption/decryption of buckets
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

var Class        = require( 'easejs' ).Class,
    EventEmitter = require( '../../events' ).EventEmitter;


/**
 * Encrypted/decrypts bucket contents
 */
module.exports = Class( 'QuoteDataBucketCipher' )
    .extend( EventEmitter,
{
    /**
     * Service used to encrypt data
     * @type {EncryptionService}
     */
    'private _encService': null,

    /**
     * Fields to encrypt
     * @type {Object}
     */
    'private _fields': null,


    /**
     * Initializes with the encryption service to be used and the fields that
     * should be encrypted
     *
     * Only the fields specified will ever be encrypted in a bucket. All other
     * fields will be left untouched.
     *
     * @param {EncryptionService} env_svc encryption service
     * @param {Array.<string>}    fields  names of fields to encrypt
     *
     * @return {undefined}
     */
    'public __construct': function( enc_svc, fields )
    {
        this._encService = enc_svc;
        this._fields     = fields;
    },


    /**
     * Encrypts the bucket data using the predefined encryption service and
     * fields
     *
     * @param {Bucket}     bucket   bucket to encrypt
     * @param {function()} callback function to call when operation is complete
     *
     * @return {undefined}
     */
    'public encrypt': function( bucket, callback )
    {
        if ( this._fields.length === 0 )
        {
            callback();
            return this;
        }

        this._encryptFields(
            bucket.getData(),
            ( this._fields.length - 1 ),
            callback
        );

        return this;
    },


    /**
     * Decrypts the bucket data using the predefined encryption service and
     * fields
     *
     * @param {Bucket}     bucket   bucket to decrypt
     * @param {function()} callback function to call when operation is complete
     *
     * @return {undefined}
     */
    'public decrypt': function( bucket, callback )
    {
        if ( this._fields.length === 0 )
        {
            callback();
            return this;
        }

        this._decryptFields(
            bucket.getData(),
            ( this._fields.length - 1 ),
            callback
        );

        return this;
    },


    /**
     * Recursively encrypts the requested bucket fields
     *
     * @param {Object}     data     bucket data
     * @param {number}     i        field index
     * @param {function()} callback function to call when all fields are
     *                              encrypted
     *
     * @return {undefined}
     */
    'private _encryptFields': function( data, i, callback )
    {
        var _self = this,
            field = this._fields[ i ];

        try
        {
            var first = new Buffer( ( data[ field ] || [''] )[ 0 ], 'base64' );
        }
        catch ( e )
        {
            // data must be invalid
            data[ field ] = [];

            c();
            return;
        }

        function c()
        {
            if ( i > 0 )
            {
                _self._encryptFields( data, ( i - 1 ), callback );
            }
            else
            {
                callback();
            }
        }

        // sanity check (do we have more than 5kB of data?)
        if ( first.length > ( 1024 * 5 ) )
        {
            // we should never have data this large in the bucket; notify hooks
            // and recover
            this.emit( 'encrecover', field, first.length );
            for ( var i in data )
            {
                data[ field ][ i ] = '';
            }

            c();
        }

        // if the data is already encrypted, then we do not want to continue to
        // encrypt it (there was a nasty bug with this...imagine how large the
        // data got...)
        if ( this._encService.isEncrypted( first ) === true )
        {
            c();
            return;
        }

        // JSON-encode the data before encrypting to ensure that we're
        // encrypting the actual data, not "[object Array]" or something
        var json_data = JSON.stringify( data[ field ] );

        // if the data is undefined, just return
        if ( json_data === undefined )
        {
            c();
            return;
        }

        // encrypt the field and store as a single-element array
        this._encService.encrypt( json_data, function( enc_data )
        {
            data[ field ] = [ enc_data.toString( 'base64' ) ];

            // recursively encrypt until we read 0
            c();
        } );
    },


    /**
     * Recursively decrypts the requested bucket fields
     *
     * If a certain field is not encrypted, it is ignored. This way, if older
     * data isn't encrypted when newer data is, we'll skill be compatible.
     *
     * @param {Object}     data     bucket data
     * @param {number}     i        field index
     * @param {function()} callback function to call when all fields are
     *                              decrypted
     *
     * @return {undefined}
     */
    'private _decryptFields': function( data, i, callback )
    {
        var _self = this,
            field = this._fields[ i ],

            next = function()
            {
                // recursively encrypt until we read 0
                if ( i > 0 )
                {
                    _self._decryptFields( data, ( i - 1 ), callback );
                }
                else
                {
                    callback();
                }
            }
        ;

        try
        {
            var enc_data = ( data[ field ] )
                ? new Buffer( data[ field ][ 0 ], 'base64' )
                : {};
        }
        catch ( e )
        {
            // data is invalid; clear the field
            data[ field ] = [];

            next();
            return;
        }

        // if the data is not encrypted, then skip it
        if ( this._encService.isEncrypted( enc_data ) === false )
        {
            next();
            return;
        }

        // encrypt the field and store as a single-element array
        this._encService.decrypt( enc_data, function( dec_data )
        {
            try
            {
                // the data was converted to JSON before encryption; convert it
                // back
                data[ field ] = JSON.parse( dec_data.toString() );
            }
            catch ( e )
            {
                // if invalid JSON, default to empty
                data[ field ] = [""];
            }

            next();
        } );
    }
} );

