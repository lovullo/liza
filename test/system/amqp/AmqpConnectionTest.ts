/**
 * Tests AmqpConnection
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
 * Amqp Connection
 */

import { AmqpConnection as Sut } from "../../../src/system/amqp/AmqpConnection";
import { AmqpConfig } from "../../../src/system/AmqpPublisher";
import { EventEmitter } from "events";
import * as amqplib from "amqplib";

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );

describe( 'AmqpConnection', () =>
{
    describe( '#connect', () =>
    {
        it( "fails when exchange cannot be asserted", () =>
        {
            const expected_err = new Error( "test failure" );

            const mock_channel = <amqplib.Channel>(<unknown>{
                assertExchange() {
                    return Promise.reject( expected_err );
                },
            });

            const mock_connection = <amqplib.Connection>(<unknown>{
                once() {},

                createChannel() {
                    return Promise.resolve( mock_channel );
                },
            });

            const mock_amqp = <typeof amqplib>(<unknown>{
                connect() {
                    return Promise.resolve( mock_connection );
                }
            });

            const emitter = new EventEmitter();
            const conf    = <AmqpConfig>{};
            const sut     = new Sut( mock_amqp, conf, emitter );

            return expect( sut.connect() )
                .to.eventually.be.rejectedWith( expected_err );
        } );
    } );
} );

