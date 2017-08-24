/**
 * Facade for vanilla document server
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

const { Class } = require( 'easejs' );

const {
    bucket: {
        bucket_filter,
        QuoteDataBucket,
        StagingBucket,
    },

    dapi: {
        DataApiManager,
    },

    program: {
        ProgramInit,
    },

    server: {
        Server,

        meta: {
            DapiMetaSource,
        },

        request: {
            DataProcessor,
            JsonServerResponse,
            ServerDataApiFactory,
        },
    },
} = require( '../..' );


/**
 * Vanilla document server
 */
module.exports = Class( 'DocumentServer',
{
    'public create': ( dao, logger, enc_service, origin_url, conf ) =>
        Promise.all( [
            conf.get( 'dapi' ),
        ] ).then( ([ dapi_conf ]) => Server(
            new JsonServerResponse.create(),
            dao,
            logger,
            enc_service,

            DataProcessor(
                bucket_filter,
                ( apis, request ) => DataApiManager(
                    ServerDataApiFactory(
                        origin_url || request.getOrigin(),
                        request,
                        dapi_conf
                    ),
                    apis
                ),
                DapiMetaSource( QuoteDataBucket ),
                StagingBucket
            ),
            ProgramInit()
        ) )
} );
