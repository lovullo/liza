/**
 * Manages DataAPI requests and return data
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
import { StagingBucket, StagingBucketConstructor } from "../../bucket/StagingBucket";
import { DapiMetaSource } from "../meta/DapiMetaSource";
import { PositiveInteger } from "../../numeric";
import { bucket_filter } from "../../bucket/bucket_filter";
import { UserRequest } from "./UserRequest";
import { DataApiManager, DataApiConstructor } from "../../dapi/DataApiManager";

/**
 * Process data provided by the client
 *
 * TOOD: This contains Data API and bucket merging logic that is better done
 * elsewhere.
 */
export class DataProcessor
{
    /**
     * Initialize processor
     *
     * The staging bucket constructor will be used to wrap the bucket for
     * diff-related operations.
     *
     * @param filter       - bucket filter
     * @param dapif        - data API constructor
     * @param meta_source  - metadata source
     * @param staging_ctor - staging bucket constructor
     */
    constructor(
        private readonly _filter:       bucket_filter.filter,
        private readonly _dapif:        DataApiConstructor,
        private readonly _meta_source:  DapiMetaSource,
        private readonly _stagingCtor:  StagingBucketConstructor,
    ) {}


    /**
     * Process client-provided data diff
     *
     * This performs sanitization to ensure that we are storing only
     * "correct" data within our database. This also strips any unknown
     * bucket values, preventing users from using us as their own personal
     * database.
     *
     * @param data    - bucket diff data
     * @param request - submitting request
     * @param program - active program
     *
     * @return processed diff
     */
    processDiff(
        data:    Record<string, any>,
        request: UserRequest,
        program: any,
        bucket:  any,
        quote:   any,
    ): Record<string, any>
    {
        const filtered     = this.sanitizeDiff( data, request, program );
        const dapi_manager = this._dapif( program.apis, request, quote );
        const staging      = this._stagingCtor( bucket );

        // forbidBypass will force diff generation on initQuote
        staging.setValues( filtered );
        staging.forbidBypass();

        program.initQuote( staging, true );

        const diff                       = staging.getDiff();
        const rdiff: Record<string, any> = {};

        // array of promises for any dapi requests
        const [ dapis, meta_clear ] = this._triggerDapis(
            dapi_manager, program, diff, staging
        );

        for( let diff_key in diff )
        {
            rdiff[ diff_key ] = staging.getOriginalDataByName( diff_key );
        }

        staging.commit();

        return {
            filtered:   filtered,
            dapis:      dapis,
            meta_clear: meta_clear,
            rdiff:      rdiff,
        };
    }


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
     * @param data    - client-provided data
     * @param request - client request
     * @param program - active program
     *
     * @return filtered data
     */
    sanitizeDiff(
        data:    Record<string, any>,
        request: UserRequest,
        program: any,
    ): Record<string, any>
    {
        if ( !request.getSession().isInternal() )
        {
            this._cleanInternals( data, program );
        }

        return this._filter.filter( data, program.meta.qtypes, {}, true );
    }


    /**
     * Strip internal fields from diff `data`
     *
     * Internal fields are defined by the program `program`.
     *
     * @param data    - bucket diff data
     * @param program - active program
     */
    private _cleanInternals(
        data:    Record<string, any>,
        program: any,
    ): void
    {
        for ( let id in program.internal )
        {
            delete data[ id ];
        }
    }


    /**
     * Trigger metadata Data API requests
     *
     * @param dapi_manager - dapi manager
     * @param program      - active program
     * @param data         - client-provided data
     * @param bucket       - active bucket
     *
     * @return an array containing the dapis and cleared meta values
     */
    private _triggerDapis(
        dapi_manager: DataApiManager,
        program:      any,
        data:         Record<string, any>,
        bucket:       StagingBucket,
    ): [ any, Record<string, any> ]
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

            return indexes.map( ( i: PositiveInteger ) =>
                this._meta_source.getFieldData(
                    field,
                    i,
                    dapi_manager,
                    dapi,
                    this._mapDapiData( dapi, bucket, i, data )
                )
            );
        } ).reduce( ( result, x ) => result.concat( x ), [] );

        return [ dapis, clear ];
    }


    /**
     * Generate update to clear metadata fields with pending dapi calls
     *
     * This ensures that stale data won't be accessible to systems while a
     * request hasn't yet completed.  For example, if performing a rate
     * lookup, it wouldn't be desirable to use an old rate even though data
     * used to retrieve it has since changed.
     *
     * @param fields - field names and array of indexes
     *
     * @return cleared values
     */
    private _genClearMetaValues(
        fields: Record<string, any>
    ): Record<string, any>
    {
        return Object.keys( fields ).reduce(
            ( result: Record<string, any>, field: string ) =>
        {
            result[ field ] = fields[ field ].reduce( ( values: any, i: any ) =>
            {
                values[ i ] = "";
                return values;
            }, [] );

            return result;
        }, {} );
    }


    /**
     * Determine which fields require a Data API to be triggered
     *
     * @param mapis - metadata dapi descriptors
     * @param data  - client-provided data
     *
     * @return fields with indexes in need of dapi calls
     */
    private _determineDapiFields(
        mapis: Record<string, string[]>,
        data:  Record<string, any>
    ): Record<string, any>
    {
        return Object.keys( mapis ).reduce(
            ( result: any, src_field: string ) =>
            {
                const fdata = data[ src_field ];

                if ( fdata === undefined )
                {
                    return result;
                }

                const fields = mapis[ src_field ];

                // get each index that changed
                fields.forEach( (field: string) =>
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
    }


    /**
     * Map data from bucket to dapi inputs
     *
     * @param dapi      - Data API descriptor
     * @param bucket    - active (source) bucket
     * @param index     - field index
     * @param diff_data - client-provided data
     *
     * @return key/value dapi input data
     */
    private _mapDapiData(
        dapi:      any,
        bucket:    StagingBucket,
        index:     PositiveInteger,
        diff_data: Record<string, any>,
    ): Record<string, any>
    {
        const { mapsrc } = dapi;

        return Object.keys( mapsrc ).reduce(
            ( result: any, srcid: any ) =>
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
    }
};
