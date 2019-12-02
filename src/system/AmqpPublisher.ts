/**
 * Amqp Publisher
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
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
 *
 * Publish Amqp message to a queue
 */

import { DeltaResult } from "../bucket/delta";
import { DocumentId } from '../document/Document';
import { Options } from 'amqplib';


/**
 * Create an amqp configuration from the environment
 *
 * @param env - the environment variables
 *
 * @return the amqp configuration
 */
export function createAmqpConfig( env: NodeJS.ProcessEnv ): AmqpConfig
{
    return <AmqpConfig>{
        protocol:   'amqp',
        hostname:   env.amqp_hostname,
        port:       +( env.amqp_port || 0 ),
        username:   env.amqp_username,
        password:   env.amqp_password,
        locale:     'en_US',
        frameMax:   +( env.amqp_frameMax || 0 ),
        heartbeat:  +( env.amqp_heartbeat || 0 ),
        vhost:      env.amqp_vhost,
        exchange:   env.amqp_exchange,
        retries:    env.amqp_retries || 30,
        retry_wait: env.amqp_retry_wait || 1000,
    };
}


export interface AmqpConfig extends Options.Connect {
    /** The protocol to connect with (should always be "amqp") */
    protocol: string;

    /** The hostname to connect to */
    hostname: string;

    /** The port to connect to */
    port: number;

    /** A username if one if required */
    username?: string;

    /** A password if one if required */
    password?: string;

    /** Locale (should always be "en_US") */
    locale: string;

    /** The size in bytes of the maximum frame allowed */
    frameMax: number;

    /** How often to check for a live connection */
    heartbeat: number;

    /** The virtual host we are on (e.g. live, demo, test) */
    vhost?: string;

    /** The name of a queue or exchange to publish to */
    exchange: string;

    /** The number of times to retry connecting */
    retries: number;

    /** The time to wait in between retries */
    retry_wait: number;
}


export interface AmqpPublisher
{
    /**
     * Publish quote message to exchange post-rating
     *
     * @param doc_id   - The doc_id
     * @param delta    - The delta
     * @param bucket   - The bucket
     * @param ratedata - The rate data bucket
    */
    publish(
        doc_id:    DocumentId,
        delta:     DeltaResult<any>,
        bucket:    Record<string, any>,
        ratedata?: Record<string, any>,
    ): Promise<void>
}
