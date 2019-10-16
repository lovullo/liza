/**
 * Processes DataApi return data as JSON
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

var Trait   = require( 'easejs' ).Trait,
    DataApi = require( '../DataApi' );


/**
 * Processes DataApi return data as JSON
 */
module.exports = Trait( 'JsonResponse' )
    .implement( DataApi )
    .extend(
{
    /**
     * Processes response as JSON
     *
     * If the response is not valid JSON, an error will be returned.  The
     * output value will be an object with a single
     * property---`text`---containing the response text that failed to
     * parse.
     *
     * If a request error occurs in conjunction with a parse error, then
     * both errors will be returned in a single error object under the
     * `list` property.
     *
     * @param {string}             data     binary data to transmit
     * @param {function(?Error,*)} callback continuation upon reply
     *
     * @return {DataApi} self
     */
    'virtual abstract override public request': function( data, callback, id )
    {
        var _self = this;

        this.__super( data, function( err, resp )
        {
            _self._tryParse( err, resp, callback );
        }, id );

        return this;
    },


    /**
     * Attempt to parse SRC as JSON and invoke callback according to the
     * rules of `#request`
     *
     * @param {?Error}             err      response error
     * @param {string}             src      JSON string
     * @param {function(?Error,*)} callback continuation
     *
     * @return {undefined}
     */
    'private _tryParse': function( err, src, callback )
    {
        try
        {
            var data = JSON.parse( src );
        }
        catch ( e )
        {
            // parsing failed; provide response text in addition to
            // original data so that the caller can handle how they
            // please
            callback(
                this._getReturnError( err, e ),
                { text: src }
            );

            return;
        }

        callback( err, data );
    },


    /**
     * Produce the parse error, or a combined error containing both the
     * original and parse errors
     *
     * @param {?Error} orig  response error
     * @param {Error}  parse parse error
     *
     * @return {Error} parse error or combined error
     */
    'private _getReturnError': function( orig, parse )
    {
        if ( !orig )
        {
            return parse;
        }

        var e = Error( "Multiple errors occurred; see `list` property" );
        e.list = [ orig, parse ];

        return e;
    }
} );

