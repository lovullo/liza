/**
 * Restricts Data API parameters
 *
 *  Copyright (C) 2016 LoVullo Associates, Inc.
 *
 *  This file is part of the Liza Data Collection Framework
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


var Class        = require( 'easejs' ).Class,
    DataApi      = require( './DataApi' ),
    EventEmitter = require( 'events' ).EventEmitter;


/**
 * Restricts a DataApi such that only declared params may be used in requests,
 * required params must be used and ensures that the server responds with the
 * expected values.
 *
 * Also provides support for param defaults. Perhaps this logic doesn't belong
 * here, in which case it should be extracted into a separate decorator.
 */
module.exports = Class( 'RestrictedDataApi' )
    .implement( DataApi )
    .extend( EventEmitter,
{
    /**
     * DataApi to restrict
     * @type {DataApi}
     */
    'private _api': null,

    /**
     * Available params and their defaults
     * @type {name,default.<{type,value}>}
     */
    'private _params': null,

    /**
     * Expected return params
     * @type {Array.<string>}
     */
    'private _retvals': null,


    /**
     * Initialize API restriction
     *
     * @param {DataApi} data_api data API to wrap
     * @param {Object}  desc     API description
     */
    __construct: function( data_api, desc )
    {
        if ( !( Class.isA( DataApi, data_api ) ) )
        {
            throw Error(
                'Expected object of type DataApi; given: ' + data_api
            );
        }

        this._api     = data_api;
        this._params  = desc.params  || {};
        this._retvals = desc.retvals || [];
    },


    /**
     * Request data from the service
     *
     * @param {Object=}           data     request params
     * @param {function(Object)=} callback server response callback
     *
     * @return {DataApi} self
     */
    'public request': function( data, callback )
    {
        data     = data     || {};
        callback = callback || function() {};

        var _self = this;

        // check the given params; if any are missing, then it should be
        // considered to be an error
        var reqdata = this._requestParamCheck( data );

        // make the request
        this._api.request( reqdata, function( err, response )
        {
            callback.call( _self,
                err,
                _self._checkResponse( response, callback )
            );
        } );
    },


    /**
     * Check request params to ensure that they are (a) known, (b) all required
     * params are provided and (c) contain valid values
     *
     * A separate object is returned to prevent side-effects.
     *
     * @param {Object} data request data
     *
     * @return {Object} request data to be sent
     */
    'private _requestParamCheck': function( data )
    {
        var ret = {};

        for ( var name in data )
        {
            // fail on unknown params
            if ( !( this._params[ name ] ) )
            {
                throw Error( 'Unkown param: ' + name );
            }
        }

        // yes, there are more efficient ways than looping through the above and
        // now through this, but the actual XHR itself will make it negligable,
        // so I'm going for clarity
        for ( var name in this._params )
        {
            var def_data = this._params[ name ]['default'],
                def_val  = def_data && def_data.value || '';

            // if the data is set, then we're good
            if ( data[ name ] )
            {
                ret[ name ] = data[ name ];
                continue;
            }

            // the data is not set; if there's no default, then this is an error
            if ( !( def_val ) )
            {
                throw Error( 'Missing param: ' + name );
            }

            // sorry---we only support string defaults for now
            if ( def_data.type !== 'string' )
            {
                throw Error(
                    'Only string param defaults are currently supported'
                );
            }

            // use default
            ret[ name ] = def_val;
        }

        // return a separate object to prevent side-effects
        return ret;
    },


    /**
     * Check the response data to ensure that all the expected params have been
     * returned for each item
     *
     * The response data should be an array of objects; if this is not the case
     * for the service in question, another decorator should be used to
     * transform the data *before* it gets to this decorator.
     *
     * The callback is not invoked by this method; instead, it will be passed to
     * any error events that may be emitted, allowing the handler to associate
     * it with the original request and invoke it manually if necessary.
     *
     * @param {Array.<Object>} response response data
     * @param {Function}       callback callback to be called with response
     *
     * @return {Object} original object if validations passed; otherwise {}
     */
    'private _checkResponse': function( response, callback )
    {
        // the response should be an array; otherwise, we cannot process it to
        // see if the return data is valid (since it would not be in the
        // expected format---if the format needs conversion, a separate
        // decorator should handle that job *before* the data gets to this one)
        //
        // since ES5 isn't an option, we'll stick with this dirty hack
        if ( !response || !( response.slice ) )
        {
            this.emit( 'error',
                TypeError( 'Response data is not an array' ),
                callback,
                response
            );

            return {};
        }

        // for each item returned, check to ensure that it contains the expected
        // params
        var i = this._retvals.length;
        while ( i-- )
        {
            // check all items for the given param
            var param = this._retvals[ i ],
                err   = this._checkAllFor( param, response );

            // were any errors found (these would be the failed indexes)
            if ( err.length > 0 )
            {
                this.emit( 'error',
                    TypeError(
                        'Return data missing param ' + param + ': ' +
                            err.join( ', ' )
                    ),
                    callback,
                    response
                );

                // param was not found; data is invalid
                return {};
            }
        }

        // everything looks good
        return response;
    },


    /**
     * Checks each item for the given param
     *
     * If all goes well, the caller should expect that this method will return
     * an empty array.
     *
     * @param {string}         param    name of param
     * @param {Array.<Object>} response response data to scan
     *
     * @return {Array.<number>} indexes of failed response items, if any
     */
    'private _checkAllFor': function( param, response )
    {
        var i   = response.length,
            err = [];

        while ( i-- )
        {
            if ( response[ i ][ param ] === undefined )
            {
                // since we're looping in reverse, unshift instead of push
                err.unshift( i );
            }
        }

        return err;
    }
} );
