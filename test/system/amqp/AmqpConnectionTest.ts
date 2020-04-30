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
                on:             () => {},
                assertExchange: () => Promise.reject( expected_err ),
            } );

            const mock_connection = <amqplib.Connection>(<unknown>{
                once() {},

                createChannel() {
                    return Promise.resolve( mock_channel );
                },
            } );

            const mock_amqp = <typeof amqplib>(<unknown>{
                connect() {
                    return Promise.resolve( mock_connection );
                }
            } );

            const emitter = new EventEmitter();
            const conf    = <AmqpConfig>{};
            const sut     = new Sut( mock_amqp, conf, emitter );

            return expect( sut.connect() )
                .to.eventually.be.rejectedWith( expected_err );
        } );
    } );


    describe( '#reconnect', () =>
    {
        it( "is called when there is an error with the connection", () =>
        {
            let reconnect_called = false;

            const mock_channel = <amqplib.Channel>(<unknown>{
                on:             () => {},
                assertExchange: () => Promise.resolve(),
            } );

            const mock_connection = <amqplib.Connection>Object.create(
                new EventEmitter()
            );

            mock_connection.createChannel = (): any => {
                return Promise.resolve( mock_channel );
            };

            const mock_amqp = <typeof amqplib>(<unknown>{
                connect() {
                    return Promise.resolve( mock_connection );
                }
            } );

            const emitter = new EventEmitter();

            emitter.on( 'amqp-reconnect', () => { reconnect_called = true } );

            const conf    = <AmqpConfig>{};
            const sut     = new Sut( mock_amqp, conf, emitter );

            const result = sut.connect()
                                .then( () => mock_connection.emit( 'error' ) )

            return expect( result )
                .to.eventually.deep.equal( true )
                .then( _ => expect( reconnect_called ).to.be.true );
        } );


        it( "is called when there is an error with the channel", () =>
        {
            let reconnect_called = false;

            const mock_channel = <amqplib.Channel>Object.create(
                new EventEmitter()
            )

            mock_channel.assertExchange = (): any => {
                return Promise.resolve();
            };

            const mock_connection = <amqplib.Connection>Object.create(
                new EventEmitter()
            );

            mock_connection.createChannel = (): any => {
                return Promise.resolve( mock_channel );
            };

            const mock_amqp = <typeof amqplib>(<unknown>{
                connect() {
                    return Promise.resolve( mock_connection );
                }
            } );

            const emitter = new EventEmitter();

            emitter.on( 'amqp-reconnect', () => { reconnect_called = true } );

            const conf    = <AmqpConfig>{};
            const sut     = new Sut( mock_amqp, conf, emitter );

            const result = sut.connect()
                                .then( () => mock_channel.emit( 'close' ) )

            return expect( result )
                .to.eventually.deep.equal( true )
                .then( _ => expect( reconnect_called ).to.be.true );
        } );


        it( "throws an error if it is unable to reconnect", done =>
        {
            let connect_call_count = 0;
            let retry_call_count   = 0;

            const mock_channel = <amqplib.Channel>(<unknown>{
                on:             () => {},
                assertExchange: () => Promise.resolve(),
            } );

            const conn = <amqplib.Connection>Object.create(
                new EventEmitter()
            );

            conn.createChannel = (): any => {
                return Promise.resolve( mock_channel );
            };

            const mock_amqp = <typeof amqplib>(<unknown>{
                connect() {
                    if ( connect_call_count++ === 0 )
                    {
                        return Promise.resolve( conn );
                    }

                    return Promise.reject( new Error( 'Foo' ) );
                }
            } );

            const conf = <AmqpConfig>{
                retry_wait: 0,
                retries:    3,
            };

            const sut = new Sut( mock_amqp, conf, new EventEmitter() );

            const old_setTimeout = global.setTimeout;

            global.setTimeout = ( cb: (...args: any[]) => void, _: number ) =>
            {
                retry_call_count++;

                try { cb() }
                catch( e )
                {
                    expect( e ).to.deep.equal(
                        new Error( 'Coulds not re-establish AMQP connection.' )
                    );

                    expect( retry_call_count ).to.equal( 3 );
                    expect( connect_call_count ).to.equal( 4 );

                    global.setTimeout = old_setTimeout;

                    done();
                }

                return <NodeJS.Timeout>{};
            }

            sut.connect().then( _ => conn.emit( 'error', 'moo' ) );
        } );
    } );
} );

