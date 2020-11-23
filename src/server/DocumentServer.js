/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
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

const {Class} = require('easejs');

const {
  bucket: {bucket_filter, QuoteDataBucket, StagingBucket},

  dapi: {DataApiManager},

  program: {ProgramInit},

  server: {
    Server,

    meta: {DapiMetaSource},

    request: {
      DataProcessor: {DataProcessor},
      JsonServerResponse,
      ServerDataApiFactory,
    },

    token: {
      MongoTokenDao: {MongoTokenDao},
    },
  },

  system: {
    flags: {
      DefaultFeatureFlag: {DefaultFeatureFlag},
      SplitFeatureFlag: {SplitFeatureFlag},
    },
  },
} = require('../..');

/**
 * Vanilla document server
 *
 * XXX: This is a mess, and it's only getting worse with dependencies
 * instantiated everywhere.  Everything should be instantiated in one place
 * rather than part of them being passed in here.  See controller.js.
 */
module.exports = Class('DocumentServer', {
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
   * @param {function}          ts_ctor     timestamp constructor
   *
   * @return {Promise<Server>}
   */
  'public create'(
    dao,
    logger,
    enc_service,
    origin_url,
    conf,
    collection,
    ts_ctor
  ) {
    return Promise.all([
      conf.get('dapi'),
      this._createFeatureFlag(conf),
    ]).then(([dapi_conf, feature_flag]) =>
      Server(
        new JsonServerResponse.create(),
        dao,
        logger,
        enc_service,
        new DataProcessor(
          bucket_filter,
          (apis, request, quote) =>
            this._createDapiManager(
              apis,
              request,
              origin_url,
              dapi_conf,
              quote,
              collection,
              ts_ctor
            ),
          DapiMetaSource(QuoteDataBucket),
          StagingBucket
        ),
        ProgramInit(),
        ts_ctor,
        feature_flag
      )
    );
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
   * @param {function}        ts_ctor    timestamp constructor
   */
  'private _createDapiManager'(
    apis,
    request,
    origin_url,
    dapi_conf,
    quote,
    collection,
    ts_ctor
  ) {
    return DataApiManager(
      ServerDataApiFactory(
        origin_url || request.getOrigin(),
        request,
        dapi_conf,
        quote.getId(),
        new MongoTokenDao(collection, 'dapitok', ts_ctor)
      ),
      apis
    );
  },

  /**
   * Create a feature flag checker
   *
   * We will use split if it is configured and included as a dependency,
   * otherwise we will default to the flags defined in the config file
   *
   * @param {conf} feature_flag Feature Flag config
   *
   * @return {FeatureFlag} A feature flag checker
   */
  'private _createFeatureFlag': function (conf) {
    return conf
      .get('services.featureFlag')
      .then(flag_conf =>
        flag_conf.reduce((accum, value, key) => {
          accum[key] = value;
          return accum;
        }, {})
      )
      .then(flag_conf => {
        var flag = new DefaultFeatureFlag(flag_conf.flags);

        switch (flag_conf.type) {
          case 'splitio':
            var {SplitFactory} = require('@splitsoftware/splitio');

            var api_key = flag_conf.splitio.key;
            var host = flag_conf.splitio.redis.host;
            var port = flag_conf.splitio.redis.port;
            var factory = new SplitFactory({
              mode: 'consumer',
              core: {authorizationKey: api_key},
              storage: {
                type: 'REDIS',
                options: {
                  url: 'redis://' + host + ':' + port + '/0',
                },
              },
            });
            return new SplitFeatureFlag(flag, {}, factory.client());

          default:
            return flag;
        }
      });
  },
});
