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

import { AmqpConfig } from "../src/system/AmqpPublisher";
import { MongoDeltaDao } from "../src/system/db/MongoDeltaDao";
import { DeltaProcessor } from "../src/system/DeltaProcessor";
import { DeltaPublisher } from "../src/system/DeltaPublisher";
import { MongoDb, MongoDbConfig } from "../src/types/mongodb";
import { DeltaLogger } from "../src/system/DeltaLogger";
import { EventEmitter } from "events";
import { EventDispatcher } from "../src/system/event/EventDispatcher";
import { EventSubscriber } from "../src/system/event/EventSubscriber";
// import { MetricsCollector } from "../src/system/MetricsCollector";

const {
    Db:          MongoDb,
    Server:      MongoServer,
    Connection:  MongoConnection,
    ReplServers: ReplSetServers,
} = require( 'mongodb/lib/mongodb' );

// TODO: fix this
process.env.hostname = 'localhost';
process.env.port     = '5672';
process.env.username = 'quote_referral';
process.env.password = 'Et7iojahwo4aePie9Cahng7Chu5eim4E';
process.env.vhost    = 'quote';
process.env.exchange = 'quoteupdate';


// Environment variables
const amqp_conf = _getAmqpConfig( process.env );
const db_conf   = _getMongoConfig( process.env );
const env       = process.env.NODE_ENV || 'Unknown Environment';

// Event handling
const event_emitter    = new EventEmitter();
const event_dispatcher = new EventDispatcher( event_emitter );
const event_subscriber = new EventSubscriber( event_emitter );

// Event subscribers
new DeltaLogger( env, event_subscriber, ts_ctr ).init();
// new MetricsCollector( env, event_subscriber );

// Instantiate classes for processor
const db        = _createDB( db_conf );
const dao       = new MongoDeltaDao( db );
const publisher = new DeltaPublisher( amqp_conf, event_dispatcher, ts_ctr );
const processor = new DeltaProcessor( dao, publisher, event_dispatcher );

// If the dao intializes successfully then process on a two second interval
const interval_ms = 2000;

dao.init()
.then( _ => { setInterval( () => { processor.process(); }, interval_ms ); } )
.catch( err => { console.error( 'Mongo Error: ' + err ); } );


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
        var mongodbPort = conf.port || MongoConnection.DEFAULT_PORT;
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
            conf.port || MongoConnection.DEFAULT_PORT,
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
 * Create a mongodb configuration from the environment
 *
 * @param env - the environment variables
 *
 * @return the mongo configuration
 */
function _getMongoConfig( env: any ): MongoDbConfig
{
    return <MongoDbConfig>{
        "port":    +( env.MONGODB_PORT || 0 ),
        "ha":      +( env.LIZA_MONGODB_HA || 0 ) == 1,
        "replset": env.LIZA_MONGODB_REPLSET,
        "host":    env.MONGODB_HOST,
        "host_a":  env.LIZA_MONGODB_HOST_A,
        "port_a":  +( env.LIZA_MONGODB_PORT_A || 0 ),
        "host_b":  env.LIZA_MONGODB_HOST_B,
        "port_b":  +( env.LIZA_MONGODB_PORT_B || 0 ),
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
        "protocol":  "amqp",
        "hostname":  env.hostname,
        "port":      +( env.port || 0 ),
        "username":  env.username,
        "password":  env.password,
        "locale":    "en_US",
        "frameMax":  0,
        "heartbeat": 0,
        "vhost":     env.vhost,
        "exchange":  env.exchange,
    };
}