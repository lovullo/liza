/**
 * HttpDataProxy interface
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
 * @todo This is a deprecated system; remove.
 */

var AbstractClass = require( 'easejs' ).AbstractClass,
    EventEmitter  = require( 'events' ).EventEmitter;


/**
 * Abstract class providing the foundation for a data proxy
 *
 * Data proxies simply abstract the means to communicate with another data
 * source, such as a remote web server.
 */
module.exports = AbstractClass( 'HttpDataProxy' )
    .extend( EventEmitter,
{
    /**
     * Triggered when data is received
     * @type {string}
     */
    'const EVENT_RECEIVED': 'received',


    /**
     * Retrieves data using a HTTP GET request
     *
     * @param {string}                url      URL to request
     * @param {function( Object, * )} callback function to call when complete
     *
     * @return {HttpDataProxy} self
     */
    'public get': function( url, callback )
    {
        var _self = this;

        this.getData( url, function( data, error )
        {
            _self._dataResponse( data, error, callback );
        });

        return this;
    },


    /**
     * Retrieves data using a HTTP POST request
     *
     * @param {string}                url      URL to request
     * @param {Object}                postdata data to post
     * @param {function( Object, * )} callback function to call when complete
     *
     * @return {HttpDataProxy} self
     */
    'public post': function( url, postdata, callback )
    {
        var _self = this;

        this.postData( url, postdata, function( data, error )
        {
            _self._dataResponse( data, error, callback );
        });

        return this;
    },


    /**
     * Called when a response is received from the server
     *
     * The callback is not called if the process is aborted.
     *
     * @param {Object} data  data received from server
     * @param {Object} error error data, otherwise null
     *
     * @param {function( Object, * )} callback function to call to return
     *                                received data
     *
     * @return void
     */
    'protected _dataResponse': function( data, error, callback )
    {
        var abort = false,
            event = {
                abort: function()
                {
                    abort = true;
                }
            };

        this.emit( this.__self.$('EVENT_RECEIVED'), data, event );

        // if aborted, we don't want to call the callback
        if ( abort )
        {
            return;
        }

        if ( callback instanceof Function )
        {
            callback( data, error );
        }
    },


    /**
     * Permits subtype to retrieve data
     *
     * Subtypes should override this method to implement a method for retrieving
     * data
     *
     * @param {string}                url      URL to request
     * @param {function( Object, * )} callback function to call when complete
     *
     * @return {undefined}
     */
    'abstract protected getData': [ 'url', 'callback' ],


    /**
     * Permits subtype to retrieve data
     *
     * Subtypes should override this method to implement a method for retrieving
     * data
     *
     * @param {string}                url      URL to request
     * @param {Object}                data     data to post
     * @param {function( Object, * )} callback function to call when complete
     *
     * @return {undefined}
     */
    'abstract protected postData': [ 'url', 'data', 'callback' ],


    /**
     * Aborts all current requests
     *
     * @return {HttpDataProxy} self
     */
    'abstract public abortAll': []
} );

