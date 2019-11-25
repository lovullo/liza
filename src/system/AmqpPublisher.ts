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
import { Options } from 'amqplib';


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
    heartBeat: number;

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
     * @param delta - The delta to publish
    */
    publish( delta: DeltaResult<any> ): Promise<NullableError>;
}
