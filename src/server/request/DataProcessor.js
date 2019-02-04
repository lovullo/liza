/**
 * Manages DataAPI requests and return data
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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

'use strict';

const { Class }   = require( 'easejs' );

const { QuoteDataBucket, StagingBucket } = require( '../../' ).bucket;


/**
 * Process data provided by the client
 *
 * TOOD: This contains Data API and bucket merging logic that is better done
 * elsewhere.
 */
module.exports = Class( 'DataProcessor',
{
    /**
     * Bucket filter
     * @type {Object}
     */
    'private _filter': null,

    /**
     * Construct Data API manager
     * @type {function()}
     */
    'private _dapif': null,

    /**
     * Metadata source
     * @type {DapiMetaSource}
     */
    'private _metaSource': null,


    /**
     * Initialize processor
     *
     * The staging bucket constructor will be used to wrap the bucket for
     * diff-related operations.
     *
     * @param {Object}           filter       bucket filter
     * @param {function()}       dapif        data API constructor
     * @param {DapiMetaSource}   meta_source  metadata source
     * @param {function(Bucket)} staging_ctor staging bucket constructor
     */
    constructor( filter, dapif, meta_source, staging_ctor )
    {
        this._filter      = filter;
        this._dapif       = dapif;
        this._metaSource  = meta_source;
        this._stagingCtor = staging_ctor;
    },


    /**
     * Process client-provided data diff
     *
     * This performs sanitization to ensure that we are storing only
     * "correct" data within our database. This also strips any unknown
     * bucket values, preventing users from using us as their own personal
     * database.
     *
     * @param {Object}      data    bucket diff data
     * @param {UserRequest} request submitting request
     * @param {Program}     program active program
     *
     * @return {Object} processed diff
     */
    'public processDiff'( data, request, program, bucket )
    {
        const filtered     = this.sanitizeDiff( data, request, program );
        const dapi_manager = this._dapif( program.apis, request );
        const staging      = this._stagingCtor( bucket );

        // forbidBypass will force diff generation on initQuote
        staging.setValues( filtered, true );
        staging.forbidBypass();

        program.initQuote( staging, true );

        // array of promises for any dapi requests
        const [ dapis, meta_clear ] = this._triggerDapis(
            dapi_manager, program, staging.getDiff(), staging
        );

        staging.commit();

        return {
            filtered:   filtered,
            dapis:      dapis,
            meta_clear: meta_clear,
        };
    },


    /**
     * Sanitize client-provided data
     *
     * Internal fields will be stripped if the session is not
     * internal.  Following that, the filter provided via the ctor will be
     * applied.
     *
     * `permit_null` should be used only in the case of bucket diffs, which
     * contain nulls as terminators.
     *
     * @param {Object}      data        client-provided data
     * @param {UserRequest} request     client request
     * @param {Program}     program     active program
     *
     * @return {Object} filtered data
     */
    'public sanitizeDiff'( data, request, program )
    {
        if ( !request.getSession().isInternal() )
        {
            this._cleanInternals( data, program );
        }

        const types = program.meta.qtypes;
        return this._filter.filter( data, types, {}, true );
    },


    /**
     * Strip internal fields from diff `data`
     *
     * Internal fields are defined by the program `program`.
     *
     * @param {Object}  data    bucket diff data
     * @param {Program} program active program
     *
     * @return {undefined}
     */
    'private _cleanInternals'( data, program )
    {
        for ( let id in program.internal )
        {
            delete data[ id ];
        }
    },


    /**
     * Trigger metadata Data API requests
     *
     * @param {DataApiManager} dapi_manager dapi manager
     * @param {Program}        program      active program
     * @param {Object}         data         client-provided data
     * @param {Bucket}         bucket       active bucket
     *
     * @return {undefined}
     */
    'private _triggerDapis'( dapi_manager, program, data, bucket )
    {
        const {
            mapis = {},
            meta: {
                fields = {},
            },
        } = program;

        const dapi_fields = this._determineDapiFields( mapis, data );
        const clear       = this._genClearMetaValues( dapi_fields );

        const dapis = Object.keys( dapi_fields ).map( field =>
        {
            const { dapi } = fields[ field ];
            const indexes  = dapi_fields[ field ];

            return indexes.map( i =>
                this._metaSource.getFieldData(
                    field,
                    i,
                    dapi_manager,
                    dapi,
                    this._mapDapiData( dapi, bucket, i, data )
                )
            );
        } ).reduce( ( result, x ) => result.concat( x ), [] );

        return [ dapis, clear ];
    },


    /**
     * Generate update to clear metadata fields with pending dapi calls
     *
     * This ensures that stale data won't be accessible to systems while a
     * request hasn't yet completed.  For example, if performing a rate
     * lookup, it wouldn't be desirable to use an old rate even though data
     * used to retrieve it has since changed.
     *
     * @param {Object.<string,Array>} fields field names and array of indexes
     *
     * @return {undefined}
     */
    'private _genClearMetaValues'( fields )
    {
        return Object.keys( fields ).reduce( ( result, field ) =>
        {
            result[ field ] = fields[ field ].reduce( ( values, i ) =>
            {
                values[ i ] = "";
                return values;
            }, [] );

            return result;
        }, {} );
    },


    /**
     * Determine which fields require a Data API to be triggered
     *
     * @param {Object} mapis metadata dapi descriptors
     * @param {Object} data  client-provided data
     *
     * @return {Object} fields with indexes in need of dapi calls
     */
    'private _determineDapiFields'( mapis, data )
    {
        return Object.keys( mapis ).reduce(
            ( result, src_field ) =>
            {
                const fdata = data[ src_field ];

                if ( fdata === undefined )
                {
                    return result;
                }

                const fields = mapis[ src_field ];

                // get each index that changed
                fields.forEach( field =>
                {
                    result[ field ] = result[ field ] || [];

                    Object.keys( fdata ).forEach( i =>
                    {
                        if ( fdata[ i ] === undefined || fdata[ i ] === null )
                        {
                            return;
                        }

                        result[ field ][ i ] = i;
                    } );
                } );

                return result;
            },
            {}
        );
    },


    /**
     * Map data from bucket to dapi inputs
     *
     * @param {Object} dapi      Data API descriptor
     * @param {Bucket} bucket    active (source) bucket
     * @param {number} index     field index
     * @param {Object} diff_data client-provided data
     *
     * @return {Object} key/value dapi input data
     */
    'private _mapDapiData'( dapi, bucket, index, diff_data )
    {
        const { mapsrc } = dapi;

        return Object.keys( mapsrc ).reduce(
            ( result, srcid ) =>
            {
                const bucketid = mapsrc[ srcid ];

                const bdata = ( diff_data[ bucketid ] || [] )[ index ] ||
                      ( bucket.getDataByName( bucketid ) || [] )[ index ];

                if ( typeof bdata === 'undefined' )
                {
                    // This might be better as an empty string, but we will
                    // need to look into it more before we change it. It has
                    // been an empty array for a long time and it might cause
                    // issues to change it now.
                    result[ srcid ] = [];
                }
                else
                {
                    result[ srcid ] = bdata;
                }

                return result;
            },
            {}
        );
    },
} );
