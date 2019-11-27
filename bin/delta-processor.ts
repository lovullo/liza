/**
 * Start the Liza delta processor
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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
import fs = require( 'fs' );

import { AmqpConfig } from '../src/system/AmqpPublisher';
import { MongoDeltaDao } from '../src/system/db/MongoDeltaDao';
import { DeltaProcessor } from '../src/system/DeltaProcessor';
import { DeltaPublisher } from '../src/system/DeltaPublisher';
import { MongoDb, MongoDbConfig, MongoCollection } from '../src/types/mongodb';
import { EventLogger } from '../src/system/EventLogger';
import { EventEmitter } from 'events';
import { PrometheusFactory } from '../src/system/PrometheusFactory';
import {
    MetricsCollector,
    PrometheusConfig,
} from '../src/system/MetricsCollector';

const {
    Db:          MongoDb,
    Server:      MongoServer,
    ReplServers: ReplSetServers,
} = require( 'mongodb' );

const amqp_conf           = _getAmqpConfig( process.env );
const db_conf             = _getMongoConfig( process.env );
const prom_conf           = _getPrometheusConfig( process.env );
const env                 = process.env.NODE_ENV || 'Unknown Environment';
const process_interval_ms = +(process.env.process_interval_ms || 2000);
const emitter             = new EventEmitter();
const db                  = _createDB( db_conf );

// Prometheus Metrics
const prom_factory = new PrometheusFactory();
const metrics      = new MetricsCollector(
    prom_factory,
    prom_conf,
    emitter,
    process.hrtime,
);

// Structured logging
new EventLogger( console, env, emitter, ts_ctr );

let process_interval: NodeJS.Timer;
let dao: MongoDeltaDao;
let publisher: DeltaPublisher;
let processor: DeltaProcessor;

_getMongoCollection( db, db_conf )
    .then( ( conn: MongoCollection ) => { return new MongoDeltaDao( conn ); } )
    .then( ( mongoDao: MongoDeltaDao ) =>
    {
        dao       = mongoDao;
        publisher = new DeltaPublisher( amqp_conf, emitter, ts_ctr );
        processor = new DeltaProcessor( mongoDao, publisher, emitter );
    } )
    .then( _ => publisher.connect() )
    .then( _ =>
    {
        const pidPath =  __dirname + '/../conf/.delta_processor.pid';

        writePidFile(pidPath );
        greet( 'Liza Delta Processor', pidPath );

        process_interval = setInterval( () =>
            {
                processor.process();
                metrics.checkForErrors( dao );
            },
            process_interval_ms,
        );
    } )
    .catch( e => { console.error( 'Error: ' + e ); } );


/**
 * Output greeting
 *
 * The greeting contains the program name and PID file path.
 *
 * @param name     - program name
 * @param pid_path - path to PID file
 */
function greet( name: string, pid_path: string ): void
{
    console.log( `${name}`);
    console.log( `PID file: ${pid_path}` );
}


/**
 * Write process id (PID) file
 *
 * @param pid_path - path to pid file
 */
function writePidFile( pid_path: string ): void
{
    fs.writeFileSync( pid_path, process.pid );

    process.on( 'SIGINT', () => { shutdown( 'SIGINT' ); } )
        .on( 'SIGTERM', () => { shutdown( 'SIGTERM' ); } )
        .on( 'exit', () => { fs.unlink( pid_path, () => {} ); } );
}


/**
 * Perform a graceful shutdown
 *
 * @param signal - the signal that caused the shutdown
 */
function shutdown( signal: string ): void
{
    console.log( 'Received ' + signal + '. Beginning graceful shutdown:' );
    console.log( '...Stopping processing interval' );

    clearInterval( process_interval );

    console.log( '...Closing MongoDb connection' );

    db.close( ( err, _data ) =>
    {
        if ( err )
        {
            console.error( '    Error closing connection: ' + err );
        }
    } );

    console.log( '...Closing AMQP connection...' );

    publisher.close();

    console.log( 'Shutdown complete. Exiting.' );

    process.exit();
}


/** Timestamp constructor
 *
 * @return a timestamp
 */
function ts_ctr(): UnixTimestamp
{
    return <UnixTimestamp>Math.floor( new Date().getTime() / 1000 );
}


/**
 * Create the database connection
 *
 * @param conf - the configuration from the environment
 *
 * @return the mongodb connection
 */
function _createDB( conf: MongoDbConfig ): MongoDb
{
    if( conf.ha )
    {
        var mongodbPort = conf.port || 27017;
        var mongodbReplSet = conf.replset || 'rs0';
        var dbServers = new ReplSetServers(
            [
                new MongoServer( conf.host_a, conf.port_a || mongodbPort),
                new MongoServer( conf.host_b, conf.port_b || mongodbPort),
            ],
            {rs_name: mongodbReplSet, auto_reconnect: true}
        );
    }
    else
    {
        var dbServers = new MongoServer(
            conf.host || '127.0.0.1',
            conf.port || 27017,
            {auto_reconnect: true}
        );
    }
    var db = new MongoDb(
        'program',
        dbServers,
        {native_parser: false, safe: false}
    );
    return db;
}


/**
 * Attempts to connect to the database
 *
 * connectError event will be emitted on failure.
 *
 * @return any errors that occurred
 */
function _getMongoCollection(
    db:   MongoDb,
    conf: MongoDbConfig
): Promise<MongoCollection>
{
    return new Promise( ( resolve, reject ) =>
    {
        // attempt to connect to the database
        db.open( ( e: any, db: any ) =>
        {
            // if there was an error, don't bother with anything else
            if ( e )
            {
                // in some circumstances, it may just be telling us that
                // we're already connected (even though the connection may
                // have been broken)
                if ( e.errno !== undefined )
                {
                    reject( 'Error opening mongo connection: ' + e );
                    return;
                }
            } else if ( db == null )
            {
                reject( 'No database connection' );
                return;
            }

            // quotes collection
            db.collection(
                conf.collection,
                ( e: any, collection: MongoCollection ) =>
                {
                    if ( e )
                    {
                        reject( 'Error creating collection: ' + e );
                        return;
                    }

                    // initialize indexes
                    collection.createIndex(
                        [
                            ['published',  1],
                            ['deltaError', 1],
                        ],
                        true,
                        ( e: any, _index: { [P: string]: any } ) =>
                        {
                            if ( e )
                            {
                                reject( 'Error creating index: ' + e );
                                return;
                            }

                            resolve( collection );
                            return;
                        }
                    );
                }
            );
        } );
    } );
}


/**
 * Create a mongodb configuration from the environment
 *
 * @param env - the environment variables
 *
 * @return the mongo configuration
 */
function _getMongoConfig( env: any ): MongoDbConfig
{
    return <MongoDbConfig>{
        'port':       +( env.MONGODB_PORT || 0 ),
        'ha':         +( env.LIZA_MONGODB_HA || 0 ) == 1,
        'replset':    env.LIZA_MONGODB_REPLSET,
        'host':       env.MONGODB_HOST,
        'host_a':     env.LIZA_MONGODB_HOST_A,
        'port_a':     +( env.LIZA_MONGODB_PORT_A || 0 ),
        'host_b':     env.LIZA_MONGODB_HOST_B,
        'port_b':     +( env.LIZA_MONGODB_PORT_B || 0 ),
        'collection': 'quotes',
    };
}


/**
 * Create an amqp configuration from the environment
 *
 * @param env - the environment variables
 *
 * @return the amqp configuration
 */
function _getAmqpConfig( env: any ): AmqpConfig
{
    return <AmqpConfig>{
        'protocol':   'amqp',
        'hostname':   env.amqp_hostname,
        'port':       +( env.amqp_port || 0 ),
        'username':   env.amqp_username,
        'password':   env.amqp_password,
        'locale':     'en_US',
        'frameMax':   env.amqp_frameMax,
        'heartbeat':  env.amqp_heartbeat,
        'vhost':      env.amqp_vhost,
        'exchange':   env.amqp_exchange,
        'retries':    env.amqp_retries || 30,
        'retry_wait': env.amqp_retry_wait || 1000,
    };
}


/**
 * Create a prometheus configuration from the environment
 *
 * @param env - the environment variables
 *
 * @return the prometheus configuration
 */
function _getPrometheusConfig( env: any ): PrometheusConfig
{
    return <PrometheusConfig>{
        'hostname':         env.prom_hostname,
        'port':             +( env.prom_port || 0 ),
        'env':              process.env.NODE_ENV,
        'push_interval_ms': +( process.env.prom_push_interval_ms || 5000 ),
    };
}