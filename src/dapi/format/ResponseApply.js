/**
 * Applies arbitrary function to response data
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


module.exports = Trait( 'ResponseApply' )
    .implement( DataApi )
    .extend(
{
    /**
     * Function to apply to data
     *
     * @type {function(*)}
     */
    'private _dataf': () => {},


    /**
     * Initialize with function to apply to return data
     *
     * @param {function(*)} req_callback return data function
     */
    __mixin( dataf )
    {
        if ( typeof dataf !== 'function' )
        {
            throw TypeError( 'expected function for #request callback' );
        }

        this._dataf = dataf;
    },


    /**
     * Apply function to response
     *
     * The function provided during mixin will be applied to the response
     * data to produce a new response.
     *
     * It is not recommended to use this trait for complex transformations;
     * a new trait should be created instead.
     *
     * @param {string}             data     binary data to transmit
     * @param {function(?Error,*)} callback continuation upon reply
     *
     * @return {DataApi} self
     */
    'virtual abstract override public request'( data, callback )
    {
        this.__super( data, ( e, retdata ) =>
        {
            callback( e, this._dataf( retdata ) );
        } );

        return this;
    },
} );
