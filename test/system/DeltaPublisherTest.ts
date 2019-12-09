/**
 * Delta publisher test
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
 */

import { AmqpConnection } from '../../src/system/amqp/AmqpConnection';
import { Delta, DeltaResult, DeltaType } from '../../src/bucket/delta';
import { DeltaPublisher as Sut } from '../../src/system/DeltaPublisher';
import { DocumentId } from '../../src/document/Document';
import { Duplex } from 'stream';
import { EventEmitter } from "events";
import { hasContext } from '../../src/error/ContextError';
import { AmqpError } from '../../src/error/AmqpError';
import { Channel } from 'amqplib';
import {
    createAvroEncoder,
    AvroEncoderCtr,
} from '../../src/system/avro/AvroFactory';

import { AvroSchema } from "avro-js";

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );

const sinon = require( 'sinon' );

describe( 'server.DeltaPublisher', () =>
{
    describe( '#publish', () =>
    {
        it( 'sends a message', () =>
        {
            let   publish_called  = false;
            const delta           = createMockDelta();
            const bucket          = createMockBucketData();
            const ratedata        = createMockBucketData();
            const emitter         = new EventEmitter();
            const conn            = createMockAmqpConnection();
            conn.getAmqpChannel   = () =>
            {
                return <Channel>{
                    publish: ( _: any, __: any, buf: any, ___: any ) =>
                    {
                        expect( buf instanceof Buffer ).to.be.true;

                        publish_called = true;

                        return true;
                    }
                };
            };

            const sut = new Sut( emitter, ts_ctr, createAvroEncoder, conn );

            return expect(
                    sut.publish( <DocumentId>123, delta, bucket, ratedata )
                ).to.eventually.deep.equal( undefined )
                .then( _ =>
                {
                    expect( publish_called ).to.be.true;
                } );
        } );

        ( <[string, () => Channel | undefined, Error, string ][]>[
            [
                'Throws an error when publishing was unsuccessful',
                () =>
                {
                    return <Channel>{
                        publish: ( _: any, __: any, _buf: any, ___: any ) =>
                        {
                            return false;
                        }
                    };
                },
                Error,
                'Delta publish failed'
            ],
            [
                'Throws an error when no amqp channel is found',
                () =>
                {
                    return undefined;
                },
                AmqpError,
                'Error sending message: No channel'
            ]
        ] ).forEach( ( [ label, getChannelF, error_type, err_msg ] ) =>
        it( label, () =>
        {
            const delta           = createMockDelta();
            const bucket          = createMockBucketData();
            const ratedata        = createMockBucketData();
            const emitter         = new EventEmitter();
            const conn            = createMockAmqpConnection();
            const doc_id          = <DocumentId>123;
            const expected        = {
                doc_id:     doc_id,
                delta_type: delta.type,
                delta_ts:   delta.timestamp
            }

            conn.getAmqpChannel = getChannelF;

            const result = new Sut( emitter, ts_ctr, createAvroEncoder, conn )
                                .publish( doc_id, delta, bucket, ratedata );

            return Promise.all( [
                expect( result ).to.eventually.be.rejectedWith(
                    error_type, err_msg
                ),
                result.catch( e =>
                {
                    if ( !hasContext( e ) )
                    {
                        return expect.fail();
                    }

                    return expect( e.context ).to.deep.equal( expected );
                } )
            ] );
        } ) );
    } );

    describe( '#avroEncode parses', () =>
    {
        [
            {
                label:      'Null value',
                valid:      true,
                delta_data: { foo: null },
            },
            {
                label:      'Null array',
                valid:      true,
                delta_data: { foo: { "array": [ null ] } },
            },
            {
                label:      'Boolean value',
                valid:      true,
                delta_data: { foo: { "array": [
                    { "boolean": true },
                ] } },
            },
            {
                label:      'Simple string',
                valid:      true,
                delta_data: { foo: { "array": [
                    { "string": 'bar' },
                    { "string": 'baz' },
                ] } },
            },
            {
                label:      'Simple int',
                valid:      true,
                delta_data: { foo: { "array": [
                    { "double": 123 },
                ] } },
            },
            {
                label:      'Nested array',
                valid:      true,
                delta_data: { foo: { "array": [
                    { "array": [
                        { "string": 'bar' },
                    ] },
                ] } },
            },
            {
                label:      'Array with nulls',
                valid:      true,
                delta_data: { foo: { "array": [
                    { "string": 'bar' },
                    { "string": 'baz' },
                    null,
                 ] } },
            },
            {
                label:      'Nested Array with mixed values',
                valid:      true,
                delta_data: { foo: { "array": [
                    { "array": [
                        { "string": 'bar' },
                        { "double": 123321 },
                        null,
                    ] }
                 ] } },
            },
            {
                label:      'Non-array',
                valid:      false,
                delta_data: { foo: 'bar' },
            },
            {
                label: 'Map objects',
                valid: true,
                delta_data: { "foo": { "array": [
                    { "map": {
                        "bar": { "map": {
                            "baz": { "double": 1572903485000 },
                        } }
                    } }
                ] } },
            }
        ].forEach( ( { label, delta_data, valid } ) =>
        {
            it( label, () =>
            {
                const emitter = createMockEventEmitter();
                const conn    = createMockAmqpConnection();
                const data    = createMockData( delta_data );
                const sut     = new Sut(
                    emitter,
                    ts_ctr,
                    createAvroEncoder,
                    conn,
                );

                sut.avroEncode( data )
                    .then( b =>
                    {
                        expect( typeof(b) ).to.equal( 'object' );
                        expect( valid ).to.be.true;
                    } )
                    .catch( _ =>
                    {
                        expect( valid ).to.be.false;
                    } );
            } );
        } );
    } );


    describe( '#setDataTypes annotates', () =>
    {
        [
            {
                label:      'Null',
                delta_data: null,
                expected:   null,
            },
            {
                label:      'Null Value',
                delta_data: { foo: null },
                expected:   { foo: null },
            },
            {
                label:      'Boolean Value',
                delta_data: { foo: [ true ] },
                expected:   { foo: { "array": [
                    { "boolean": true },
                ] } },
            },
            {
                label:      'Simple string',
                delta_data: { foo: [
                    'bar',
                    'baz',
                ] },
                expected: { foo: { "array": [
                    { "string": 'bar' },
                    { "string": 'baz' },
                ] } },
            },
            {
                label:      'Simple int',
                delta_data: { foo: [
                    123
                ] },
                expected: { foo: { "array": [
                    { "double": 123 },
                ] } },
            },
            {
                label:      'Nested array',
                delta_data: { foo: [
                    [
                        'bar',
                        'baz',
                    ]
                ] },
                expected: { foo: { "array": [
                    { "array": [
                        { "string": 'bar' },
                        { "string": 'baz' },
                    ] },
                ] } },
            },
            {
                label:      'Double nested array',
                delta_data: { foo: [
                    [
                        [
                            'bar',
                            123,
                            null
                        ],
                    ],
                ] },
                expected: { foo: { "array": [
                    { "array": [
                        { "array": [
                            { "string": 'bar' },
                            { "double":   123 },
                            null,
                        ] },
                    ] },
                ] } },
            },
            {
                label:      'Array with nulls',
                delta_data: { foo: [
                    'bar',
                    'baz',
                    null
                 ] },
                 expected: { foo: { "array": [
                    { "string": 'bar' },
                    { "string": 'baz' },
                    null
                 ] } },
            },
            {
                label:      'Nested Array with mixed values',
                delta_data: { foo: [
                    [
                        'bar',
                        123321,
                        null,
                    ]
                ] },
                expected: { foo: { "array": [
                { "array": [
                    { "string": 'bar' },
                    { "double": 123321 },
                    null,
                ] },
                ] } },
            },
            {
                label:      'Nested Array with mixed values',
                delta_data: { foo: [
                    {
                        "bar": {
                            "wer": 'qaz',
                            "qwe": 1572903485000,
                            "asd": true,
                            "zxc": null,
                        },
                    },
                ] },
                expected: { "foo": { "array": [
                    { "map": {
                        "bar": { "map": {
                            "wer": { "string": 'qaz' },
                            "qwe": { "double": 1572903485000 },
                            "asd": { "boolean": true },
                            "zxc": null,
                        } },
                    } },
                ] } },
            },
        ].forEach( ( { label, delta_data, expected } ) =>
        {
            it( label, () =>
            {
                const encoded        = 'FooBar';
                const emitter        = createMockEventEmitter();
                const conn           = createMockAmqpConnection();
                const avroEncoderCtr = createMockEncoder( encoded );
                const sut            = new Sut(
                    emitter,
                    ts_ctr,
                    avroEncoderCtr,
                    conn,
                );
                const actual  = sut.setDataTypes( delta_data );

                expect( actual ).to.deep.equal( expected );
            } );
        } );
    } );
} );


function ts_ctr(): UnixTimestamp
{
    return <UnixTimestamp>Math.floor( new Date().getTime() / 1000 );
}


function createMockEncoder( mock_encoded_data: string ): AvroEncoderCtr
{
    return ( _schema: AvroSchema ) =>
    {
        const mock = sinon.mock( Duplex );

        mock.on  = ( _: string, __: any ) => {};
        mock.end = ( _: any ) => { return mock_encoded_data; };

        return mock;
    };
}


function createMockEventEmitter(): EventEmitter
{
    return <EventEmitter>{};
}


function createMockAmqpConnection(): AmqpConnection
{
    return <AmqpConnection>{
        connect:         () => {},
        getExchangeName: () => { 'Foo' },
    };
}


function createMockData( delta_data: any ): any
{

    return {
        event: {
            id:    'RATE',
            ts:    1573856916,
            actor: 'SERVER',
            step:  null,
        },
        document: {
            id:       123123,
            created:  1573856916,
            modified: 1573856916,
            top_visited_step: '2',
        },
        data:     null,
        ratedata: null,
        delta: {
            Data: {
                bucket: delta_data,
            },
        },
        program: {
            Program: {
                id:      'quote_server',
                version: 'dadaddwafdwa',
            },
        },
    };
}


function createMockBucketData(): Record<string, any>
{
    return {
        foo: [ 'bar', 'baz' ]
    }
}


function createMockDelta(): Delta<any>
{
    return <Delta<any>>{
        type:      <DeltaType>'data',
        timestamp: <UnixTimestamp>123123123,
        data:      <DeltaResult<any>>{},
    }
}
