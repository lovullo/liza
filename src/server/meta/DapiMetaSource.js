/**
 * Data-API-based metadata population
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
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const { Class } = require( 'easejs' );


/**
 * Retrieve data for meta field using Data API
 *
 * TODO: The reason this class exists at all is to encapsulate the horrid
 * API.  Once refactored, perhaps this class will no longer be necessary.
 */
module.exports = Class( 'DapiMetaSource',
{
    /**
     * Metabucket constructor
     * @type {function()}
     */
    'private _bucketf': null,


    /**
     * Initialize with metabucket constructor
     * @type {function()}
     */
    constructor( bucketf )
    {
        this._bucketf = bucketf;
    },


    /**
     * Retrieve field data
     *
     * @param {string}         field        field name
     * @param {number}         index        field index
     * @param {DataApiManager} dapi_manager manager for dapi calls
     * @param {Object}         dapi         dapi descriptor
     * @param {Object}         data         dapi input data
     *
     * @return {Promise} object containing `field`, `index`, and return data
     */
    'public getFieldData'( field, index, dapi_manager, dapi, data )
    {
        const metabucket = this._bucketf();

        return new Promise( ( resolve, reject ) =>
        {
            dapi_manager.getApiData(
                dapi.name,
                data,
                ( err, api_data ) =>
                {
                    if ( api_data.length > 1 )
                    {
                        reject( Error(
                            "Data API request produced more than one result"
                        ) );
                    }

                    dapi_manager.setFieldData(
                        dapi.name,
                        index,
                        api_data,
                        dapi.value,
                        '',
                        false
                    );

                    dapi_manager.expandFieldData(
                        dapi.name,
                        index,
                        metabucket,
                        dapi.mapdest,
                        true,
                        {
                            [dapi.name]: {
                                [index]: api_data[ 0 ][ dapi.value ],
                            },
                        }
                    );

                    resolve( {
                        field: field,
                        index: index,
                        data:  metabucket.getData(),
                    } );
                },
                field,
                index,
                {},
                reject
            );
        } );
    },
} );
