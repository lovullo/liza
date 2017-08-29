/**
 * Instantiate appropriate DataApi
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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
 */

'use strict';

const Class                 = require( 'easejs' ).Class;
const HttpDataApi           = require( './http/HttpDataApi' );
const XhrHttpImpl           = require( './http/XhrHttpImpl' );
const JsonResponse          = require( './format/JsonResponse' );
const ResponseApply         = require( './format/ResponseApply' );
const RestrictedDataApi     = require( './RestrictedDataApi' );
const StaticAdditionDataApi = require( './StaticAdditionDataApi' );
const BucketDataApi         = require( './BucketDataApi' );
const QuoteDataApi          = require( './QuoteDataApi' );


/**
 * Instantiates the appropriate DataApi object for the given service type
 */
module.exports = Class( 'DataApiFactory',
{
    /**
     * Return a DataApi instance for the requested service type
     *
     * The source and method have type-specific meaning; that is, "source"
     * may be a URL and "method" may be get/post for a RESTful service.
     *
     * @param {string} type     service type (e.g. "rest")
     * @param {Object} desc     API description
     * @param {Bucket} bucket   active bucket
     * @param {string} api_name dapi name
     *
     * @return {DataApi} appropriate DataApi instance
     */
    'public fromType': function( type, desc, bucket, api_name )
    {
        return this.descLookup( api_name, desc ).then( descl =>
        {
            const static_data = ( descl['static'] || [] );
            const nonempty    = !!descl.static_nonempty;
            const multiple    = !!descl.static_multiple;

            const api = this._createDataApi( type, descl, bucket );

            return RestrictedDataApi(
                StaticAdditionDataApi( api, nonempty, multiple, static_data ),
                descl
            );
        } );
    },


    /**
     * Look up dapi descriptor from configuration
     *
     * The default implementation just echoes back the given descriptor.
     *
     * @param {string} api_name dapi identifier
     * @param {Object} desc     given descriptor
     *
     * @return {Object} looked up descriptor
     */
    'virtual protected descLookup'( api_name, desc )
    {
        return Promise.resolve( desc );
    },


    /**
     * Create DataApi instance
     *
     * @param {string} type   API type
     * @param {Object} desc   API descriptor
     * @param {Bucket} bucket data bucket
     *
     * @return {DataApi}
     */
    'private _createDataApi'( type, desc, bucket )
    {
        const source  = ( desc.source || '' );
        const method  = ( desc.method || '' );
        const enctype = ( desc.enctype || '' );

        switch ( type )
        {
            case 'rest':
                return this._createHttp(
                    HttpDataApi.use( JsonResponse ),
                    source,
                    method,
                    enctype
                );

            case 'local':
                // currently, only local bucket data sources are supported
                if ( source !== 'bucket' )
                {
                    throw Error( "Unknown local data API source: " + source );
                }

                return BucketDataApi( bucket, desc.retvals );

            case 'quote':
                return QuoteDataApi(
                    this._createHttp(
                        HttpDataApi
                            .use( JsonResponse )
                            .use( ResponseApply( data => [ data ] ) ),
                        source,
                        method,
                        enctype
                    )
                );

            default:
                throw Error( 'Unknown data API type: ' + type );
        };
    },


    /**
     * Create HttpDataApi instance
     *
     * The `Base` is intended to allow for the caller to mix traits in.
     *
     * @param {HttpDataApi} Base    HttpDataApi type
     * @param {string}      source  URL
     * @param {string}      method  HTTP method
     * @param {string}      enctype MIME media type (for POST)
     *
     * @return {HttpDataApi}
     */
    'private _createHttp'( Base, source, method, enctype )
    {
        const impl = this.createHttpImpl();

        return Base(
            source,
            method.toUpperCase(),
            impl,
            enctype
        );
    },


    /**
     * Create HttpImpl
     *
     * This is simply intended to allow subtypes to override the type.
     *
     * @return {XhrHttpImpl}
     */
    'virtual protected createHttpImpl'()
    {
        return XhrHttpImpl( XMLHttpRequest );
    },
} );

