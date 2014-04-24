/**
 * Processes DataApi return data as JSON
 *
 *  Copyright (C) 2014 LoVullo Associates, Inc.
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
     * Will return an error if the response is not valid JSON.
     *
     * @param {string}             data     binary data to transmit
     * @param {function(?Error,*)} callback continuation upon reply
     *
     * @return {DataApi} self
     */
    'abstract override public request': function( data, callback )
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
                // parsing failed
                callback( e, null );
                return;
            }

            callback( null, data );
        } );

        return this;
    }
} );

