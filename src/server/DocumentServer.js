/**
 * Facade for vanilla document server
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
            DataProcessor: { DataProcessor },
            JsonServerResponse,
            ServerDataApiFactory,
        },

        token: {
            MongoTokenDao: { MongoTokenDao },
        },
    },
} = require( '../..' );


/**
 * Vanilla document server
 *
 * XXX: This is a mess, and it's only getting worse with dependencies
 * instantiated everywhere.  Everything should be instantiated in one place
 * rather than part of them being passed in here.  See controller.js.
 */
module.exports = Class( 'DocumentServer',
{
    /**
     * Create document server
     *
     * See above XXX.
     *
     * @param {MongoServerDao}    dao         server DAO
     * @param {Logger}            logger      log manager
     * @param {EncryptionService} enc_service encryption service
     * @param {string}            origin_url  HTTP_ORIGIN_URL
     * @param {ConfStore}         conf        configuration store
     * @param {MongoConnection}   collection  database collection
     *
     * @return {Promise<Server>}
     */
    'public create'( dao, logger, enc_service, origin_url, conf, collection )
    {
        return Promise.all( [
            conf.get( 'dapi' ),
        ] ).then( ([ dapi_conf ]) => Server(
            new JsonServerResponse.create(),
            dao,
            logger,
            enc_service,

            new DataProcessor(
                bucket_filter,
                ( apis, request, quote ) => this._createDapiManager(
                    apis, request, origin_url, dapi_conf, quote, collection
                ),
                DapiMetaSource( QuoteDataBucket ),
                StagingBucket
            ),
            ProgramInit()
        ) );
    },


    /**
     * Create new DataApiManager
     *
     * See above XXX.
     *
     * @param {Object}          apis       API definitions
     * @param {Request}         request    Node HTTP request
     * @param {string}          origin_url HTTP_ORIGIN_URL
     * @param {Object}          dapi_conf  dapi configuration
     * @param {Quote}           quote      current quote for request
     * @param {MongoConnection} collection database collection
     */
    'private _createDapiManager'(
        apis, request, origin_url, dapi_conf, quote, collection
    )
    {
        return DataApiManager(
            ServerDataApiFactory(
                origin_url || request.getOrigin(),
                request,
                dapi_conf,
                quote.getId(),
                new MongoTokenDao(
                    collection,
                    'dapitok',
                    () => Math.floor( ( new Date() ).getTime() / 1000 )
                )
            ),
            apis
        );
    },
} );
