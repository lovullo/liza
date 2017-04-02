/**
 * Contains HttpEncryptionServiceTransfer class
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
    http  = require( 'http' ),

    /**
     * Interface
     * @type {EncryptionServiceTransfer}
     */
    EncryptionServiceTransfer = require( './EncryptionServiceTransfer' );


/**
 * Responsible for performing encrypt/decryption through use of a RESTful
 * service
 */
module.exports = Class( 'HttpEncryptionServiceTransfer' )
    .implement( EncryptionServiceTransfer )
    .extend(
{
    /**
     * Path to provide for encryption request
     * @type {string}
     */
    'private const PATH_ENC': '/enc',

    /**
     * Path to provide for decryption request
     * @type {string}
     */
    'private const PATH_DEC': '/dec',


    /**
     * Holds URI of encryption REST service
     * @type {string}
     */
    'private _host': '',

    /**
     * Holds port to connect to
     * @type {number}
     */
    'private _port': 0,


    /**
     * Initializes client
     *
     * @param {string} host  service host
     * @param {number} port service port
     *
     * @return undefined
     */
    'public __construct': function( host, port )
    {
        this._host  = ''+host;
        this._port = +port;
    },


    /**
     * Connect to the remote service
     *
     * The URI and PORT and sent in as arguments beacuse they are encapsulated
     * from subtypes.
     *
     * @param {string} host  service URI
     * @param {number} port service port
     *
     * @return {http.ClientRequest}
     */
    'virtual protected connect': function( host, port, path )
    {
        var options = {
            host:   host,
            port:   port,
            path:   path,
            method: 'POST',
        };

        return http.request( options );
    },


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
    'public encrypt': function( data, callback )
    {
        this._send(
            this.connect( this._host, this._port, this.__self.$('PATH_ENC') ),
            data,
            callback
        );
    },


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
    'public decrypt': function( data, callback )
    {
        this._send(
            this.connect( this._host, this._port, this.__self.$('PATH_DEC') ),
            data,
            callback
        );
    },


    /**
     * Sends a request to the server
     *
     * @param {Object}             client   HTTP client
     * @param {Buffer}             data     data to send (enc/dec)
     * @param {function( string )} callback function to call with resulting data
     *
     * @return  {undefined}
     */
    'private _send': function( client, data, callback )
    {
        client.on( 'response', function( response )
        {
            var response_data = '';

            response.setEncoding( 'binary' );

            response
                .on( 'data', function( chunk )
                {
                    response_data += chunk;
                })
                .on( 'end', function()
                {
                    callback( new Buffer( response_data, 'binary' ) );
                });
        });

        client.write( data, 'binary' );
        client.end();
    }
} );

