/**
 * Mongo Factory functions
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
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * These definitions are for a very old mongodb library, which will be
 * once we get around to updating node.  Quite a failure on the maintenance
 * front.
 *
 * instantiate objects for MongoDb
 */
import {MongoDb, MongoDbConfig, MongoCollection} from '../../types/mongodb';
import {DaoError} from '../../error/DaoError';

const {
  Db: MongoDb,
  Server: MongoServer,
  ReplSetServers: ReplSetServers,
} = require('mongodb');

/**
 * Create a mongodb configuration from the environment
 *
 * @param env - the environment variables
 *
 * @return the mongo configuration
 */
export function createMongoConfig(env: NodeJS.ProcessEnv): MongoDbConfig {
  return <MongoDbConfig>{
    port: +(env.MONGODB_PORT || 0),
    ha: +(env.LIZA_MONGODB_HA || 0) == 1,
    replset: env.LIZA_MONGODB_REPLSET,
    host: env.MONGODB_HOST,
    host_a: env.LIZA_MONGODB_HOST_A,
    port_a: +(env.LIZA_MONGODB_PORT_A || 0),
    host_b: env.LIZA_MONGODB_HOST_B,
    port_b: +(env.LIZA_MONGODB_PORT_B || 0),
    collection: 'quotes',
  };
}

/**
 * Create the database connection
 *
 * @param conf - the configuration from the environment
 *
 * @return the mongodb connection
 */
export function createMongoDB(conf: MongoDbConfig): MongoDb {
  if (conf.ha) {
    var mongodbPort = conf.port || 27017;
    var mongodbReplSet = conf.replset || 'rs0';
    var dbServers = new ReplSetServers(
      [
        new MongoServer(conf.host_a, conf.port_a || mongodbPort),
        new MongoServer(conf.host_b, conf.port_b || mongodbPort),
      ],
      {rs_name: mongodbReplSet, auto_reconnect: true}
    );
  } else {
    var dbServers = new MongoServer(
      conf.host || '127.0.0.1',
      conf.port || 27017,
      {auto_reconnect: true}
    );
  }
  var db = new MongoDb('program', dbServers, {
    native_parser: false,
    safe: false,
  });
  return db;
}

/**
 * Attempts to connect to the database and retrieve the collection
 *
 * connectError event will be emitted on failure.
 *
 * @param db   - the mongo database
 * @param conf - the mongo configuration
 *
 * @return the collection
 */
export function getMongoCollection(
  db: MongoDb,
  conf: MongoDbConfig
): Promise<MongoCollection> {
  return new Promise((resolve, reject) => {
    // attempt to connect to the database
    db.open((e: any, db: any) => {
      // if there was an error, don't bother with anything else
      if (e) {
        // in some circumstances, it may just be telling us that
        // we're already connected (even though the connection may
        // have been broken)
        if (e.errno !== undefined) {
          reject(new Error('Error opening mongo connection: ' + e));
          return;
        }
      } else if (db == null) {
        reject(new DaoError('No database connection'));
        return;
      }

      // quotes collection
      db.collection(conf.collection, (e: any, collection: MongoCollection) => {
        if (e) {
          reject(new DaoError('Error creating collection: ' + e));
          return;
        }

        let createdCount = 0;
        const checkAllCreated = (): void => {
          if (createdCount >= 3) {
            resolve(collection);
          }
        };

        const cb = (e: any, _index: {[P: string]: any}): void => {
          if (e) {
            reject(new DaoError('Error creating index: ' + e));
            return;
          }

          createdCount++;
          checkAllCreated();
        };

        // initialize indexes
        collection.createIndex([['published', 1]], false, cb);
        collection.createIndex([['deltaError', 1]], false, cb);
        collection.createIndex(
          [
            ['published', 1],
            ['deltaError', 1],
          ],
          false,
          cb
        );
      });
    });
  });
}
