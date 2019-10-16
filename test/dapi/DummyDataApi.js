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

const { Class }   = require( 'easejs' );
const { DataApi } = require( '../../' ).dapi;


/**
 * Dummy DataApi implementation for testing
 *
 * This should not be used in production.
 */
module.exports = Class( 'DummyDataApi' )
    .implement( DataApi )
    .extend(
{
    /**
     * #request callback
     *
     * @type {Function} #request method callback
     */
    'private _reqCallback': () => {},


    /**
     * Initialize with `#request` method callback
     *
     * @param {Function} req_callback #request method callback
     */
    constructor( req_callback )
    {
        this._reqCallback = req_callback;
    },


    /**
     * Dummy method that invokes the callback provided via constructor
     *
     * @param {?Object<string,string>|string} data request params or post data
     * @param {function(?Error,*):string} callback continuation upon reply
     *
     * @return {DataApi} self
     */
    'virtual public request'( data, callback, id )
    {
        this._reqCallback( data, callback, id );
        return this;
    },
} );
