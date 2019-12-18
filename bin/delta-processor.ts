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
import * as amqplib from 'amqplib';
import { createAmqpConfig } from '../src/system/AmqpPublisher';
import { MongoDeltaDao } from '../src/system/db/MongoDeltaDao';
import { DeltaProcessor } from '../src/system/DeltaProcessor';
import { DeltaPublisher } from '../src/system/DeltaPublisher';
import { MongoCollection } from '../src/types/mongodb';
import { createAvroEncoder } from '../src/system/avro/AvroFactory';
import { V1MessageWriter } from '../src/system/avro/V1MessageWriter';
import {
    createMongoConfig,
    createMongoDB,
    getMongoCollection,
} from '../src/system/db/MongoFactory';
import { EventMediator } from '../src/system/EventMediator';
import { EventEmitter } from 'events';
import { StandardLogger } from '../src/system/StandardLogger';
import { MetricsCollector } from '../src/system/MetricsCollector';
import {
    PrometheusFactory,
    createPrometheusConfig,
} from '../src/system/PrometheusFactory';
import { AmqpConnection } from '../src/system/amqp/AmqpConnection';
import { parse as avro_parse } from 'avro-js';

require('dotenv-flow').config();

const amqp_conf           = createAmqpConfig( process.env );
const prom_conf           = createPrometheusConfig( process.env );
const db_conf             = createMongoConfig( process.env );
const db                  = createMongoDB( db_conf );
const process_interval_ms = +( process.env.PROCESS_INTERVAL_MS || 10000 );
const env                 = process.env.NODE_ENV || 'Unknown Environment';
const emitter             = new EventEmitter();
const log                 = new StandardLogger( console, ts_ctr, env );
const amqp_connection     = new AmqpConnection( amqplib, amqp_conf, emitter );

const message_writer = new V1MessageWriter(
    createAvroEncoder,
    avro_parse( __dirname + '/../src/system/avro/schema.avsc' ),
);

const publisher = new DeltaPublisher(
    emitter,
    ts_ctr,
    amqp_connection,
    message_writer,
);

// Prometheus Metrics
const prom_factory = new PrometheusFactory();
const metrics      = new MetricsCollector(
    prom_factory,
    prom_conf,
    emitter,
    process.hrtime,
);

// Structured logging
new EventMediator( log, emitter );

let process_interval: NodeJS.Timer;
let dao: MongoDeltaDao;

getMongoCollection( db, db_conf )
    .then( ( conn: MongoCollection ) => { return new MongoDeltaDao( conn ); } )
    .then( ( mongoDao: MongoDeltaDao ) => { dao = mongoDao; } )
    .then( _ => amqp_connection.connect() )
    .then( _ =>
    {
        log.info( 'Liza Delta Processor' );

        handleShutdown();

        const processor = new DeltaProcessor( dao, publisher, emitter );

        return new Promise( ( _resolve, reject ) =>
        {
            process_interval = setInterval( () =>
            {
                try
                {
                    processor.process()
                        .catch( err => reject( err ) );
                }
                catch ( err )
                {
                    reject( err );
                }

                dao.getErrorCount()
                    .then( count => { metrics.updateErrorCount( count ) } );
            }, process_interval_ms );
        } );
    } )
    .catch( e =>
    {
        emitter.emit( 'error', e );
        process.exit( 1 );
    } );


/**
 * Hook shutdown events
 */
function handleShutdown(): void
{
    process.on( 'SIGINT', () => { shutdown( 'SIGINT' ); } )
        .on( 'SIGTERM', () => { shutdown( 'SIGTERM' ); } );
}


/**
 * Perform a graceful shutdown
 *
 * @param signal - the signal that caused the shutdown
 */
function shutdown( signal: string ): void
{
    log.info( 'Received ' + signal + '. Beginning graceful shutdown:' );
    log.info( '...Stopping processing interval' );

    clearInterval( process_interval );

    log.info( '...Closing MongoDb connection' );

    db.close( ( err, _data ) =>
    {
        if ( err )
        {
            console.error( '    Error closing connection: ' + err );
        }
    } );

    log.info( '...Closing AMQP connection...' );

    amqp_connection.close();

    log.info( '...Stopping the metrics collector...' );

    metrics.stop();

    log.info( 'Shutdown complete. Exiting.' );

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
