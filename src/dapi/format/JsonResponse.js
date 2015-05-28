/**
 * Processes DataApi return data as JSON
 *
 *  Copyright (C) 2014, 2015 LoVullo Associates, Inc.
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
     * @param {string}             data     binary data to transmit
     * @param {function(?Error,*)} callback continuation upon reply
     *
     * @return {DataApi} self
     */
    'virtual abstract override public request': function( data, callback )
    {
        this.__super( data, function( err, resp )
        {
            if ( err !== null )
            {
                callback( err, null );
                return;
            }

            try
            {
                var data = JSON.parse( resp );
            }
            catch ( e )
            {
                // parsing failed; provide response text in addition to
                // original data so that the caller can handle how they
                // please
                callback( e, { text: resp } );

                return;
            }

            callback( null, data );
        } );

        return this;
    }
} );

