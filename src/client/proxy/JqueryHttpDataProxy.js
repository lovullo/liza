/**
 * Contains JqueryHttpDataProxy
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

var Class         = require( 'easejs' ).Class,
    HttpDataProxy = require( './HttpDataProxy' );


module.exports = Class( 'JqueryHttpDataProxy' )
    .extend( HttpDataProxy,
{
    /**
     * jQuery object to use
     * @type {jQuery}
     */
    'private _jquery': null,

    /**
     * Pool of outstanding requests
     * @type {Array.<XMLHttpRequest>}
     */
    'private _requestPool': [],


    /**
     * Initializes data proxy with the given jQuery object
     *
     * The jQuery object is injected to both decouple the two and to make it
     * stubbable for tests
     *
     * @param {jQuery} jquery jQuery object
     *
     * @return {undefined}
     */
    'public __construct': function( jquery )
    {
        if ( !( jquery ) )
        {
            throw Error( 'No jQuery instance provided' );
        }

        this._jquery = jquery;
    },


    'private _doXhr': function( url, callback, type, data )
    {
        callback = callback || function() {};

        var _self    = this,
            pool_pos = -1,
            done     = false,
            xhr      = this._jquery.ajax( {
                type:     type,
                data:     data,
                url:      url,
                dataType: 'json',

                success: function( data )
                {
                    _self._removeFromPool( pool_pos );
                    callback( data || {}, null );

                    done = true;
                },

                error: function( xhr, text_status )
                {
                    _self._removeFromPool( pool_pos );
                    callback( null, text_status );

                    done = true;
                }
            } );

        // add request to the pool, only for async requests
        if ( !done )
        {
            pool_pos = ( this._requestPool.push( xhr ) - 1 );
        }
    },


    'virtual protected getData': function( url, callback )
    {
        this._doXhr( url, callback, 'GET' );
    },


    'virtual protected postData': function( url, data, callback )
    {
        this._doXhr( url, callback, 'POST', data );
    },


    'private _removeFromPool': function( pos )
    {
        // if the position is -1, then the pool wasn't yet created
        if ( pos === -1 )
        {
            return;
        }

        delete this._requestPool[ pos ];
    },


    'abortAll': function()
    {
        var i = this._requestPool.length;

        while ( i-- )
        {
            var xhr = this._requestPool[ i ];

            // will be undefined if it finished
            if ( xhr === undefined )
            {
                continue;
            }

            xhr.abort();
        }

        // remove 'em all from memory and start with a fresh array
        this.requestPool = [];
    }
});

