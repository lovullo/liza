/**
 * V1 Message Writer
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
 * Tests for Version 1 of the avro message writer
 */

import { V1MessageWriter as Sut } from '../../src/system/avro/V1MessageWriter';
import { hasContext, context } from '../../src/error/ContextError';
import { AvroEncoderCtr } from '../../src/system/avro/AvroFactory';
import { Delta, DeltaResult, DeltaType } from '../../src/bucket/delta';
import { DocumentMeta, DocumentId } from '../../src/document/Document';
import { Duplex } from 'stream';
import {
    AvroSchema,
    parse as avro_parse,
} from 'avro-js';

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );

const sinon = require( 'sinon' );

describe( 'system.V1MessageWriter', () =>
{
    it( 'Rejects improperly formatted data', () =>
    {
        const delta           = createMockDelta();
        const bucket          = createMockBucketData();
        const ratedata        = createMockBucketData();
        const error           = new Error( 'Oh no' );
        const schema          = createMockAvroSchema();
        const ts              = <UnixTimestamp>123;
        const meta            = <DocumentMeta>{
            id:          <DocumentId>123,
            quoteSetId:  <DocumentId>123,
            entity_name: 'Some Agency',
            entity_id:   234,
            startDate:   <UnixTimestamp>345,
            lastUpdate:  <UnixTimestamp>456,
        };

        const expected = {
            invalid_paths: 'Foo',
            invalid_data:  'Bar',
        };

        const error_context = context( error, expected );

        schema.isValid = () => { throw error_context; };

        const result = new Sut(
            createMockEncoderCtor( schema ),
            schema,
        ).write( ts, meta, delta, bucket, ratedata );

        return Promise.all( [
            expect( result ).to.eventually.be.rejectedWith( error ),
            result.catch( e =>
            {
                if ( !hasContext( e ) )
                {
                    return expect.fail();
                }

                return expect( e.context ).to.deep.equal( expected );
            } )
        ] );
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
                delta_data: { foo: { 'array': [ null ] } },
            },
            {
                label:      'Boolean value',
                valid:      true,
                delta_data: { foo: { 'array': [
                    { 'boolean': true },
                ] } },
            },
            {
                label:      'Simple string',
                valid:      true,
                delta_data: { foo: { 'array': [
                    { 'string': 'bar' },
                    { 'string': 'baz' },
                ] } },
            },
            {
                label:      'Simple int',
                valid:      true,
                delta_data: { foo: { 'array': [
                    { 'double': 123 },
                ] } },
            },
            {
                label:      'Nested array',
                valid:      true,
                delta_data: { foo: { 'array': [
                    { 'array': [
                        { 'string': 'bar' },
                    ] },
                ] } },
            },
            {
                label:      'Array with nulls',
                valid:      true,
                delta_data: { foo: { 'array': [
                    { 'string': 'bar' },
                    { 'string': 'baz' },
                    null,
                 ] } },
            },
            {
                label:      'Nested Array with mixed values',
                valid:      true,
                delta_data: { foo: { 'array': [
                    { 'array': [
                        { 'string': 'bar' },
                        { 'double': 123321 },
                        null,
                    ] }
                 ] } },
            },
            {
                label:      'Non-array',
                valid:      false,
                delta_data: { foo: 'bar' },
                expected:   {
                    invalid_data:  'bar',
                    invalid_paths: [
                        'delta',
                        'Data',
                        'bucket',
                        'foo',
                    ]
                }
            },
            {
                label: 'Map objects',
                valid: true,
                delta_data: { 'foo': { 'array': [
                    { 'map': {
                        'bar': { 'map': {
                            'baz': { 'double': 1572903485000 },
                        } }
                    } }
                ] } },
            }

        ].forEach( ( { label, delta_data, valid, expected } ) =>
        {
            it( label, () =>
            {
                const data    = createMockData( delta_data );
                const schema  = avro_parse(
                    __dirname + '/../../src/system/avro/schema.avsc'
                );

                const sut = new Sut( createMockEncoderCtor( schema ), schema );

                const result = sut.avroEncode( data );

                if ( valid )
                {
                    return expect( result ).to.eventually.deep.equal(
                            Buffer.from( '' )
                        )
                        .then( b =>
                        {
                            expect( typeof(b) ).to.equal( 'object' );
                        } );
                }
                else
                {
                    return Promise.all( [
                        expect( result ).to.eventually.be.rejected,
                        result.catch( e =>
                        {
                            if ( !hasContext( e ) )
                            {
                                return expect.fail();
                            }

                            return expect( e.context )
                                .to.deep.equal( expected );
                        } )
                    ] );
                }
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
                expected:   { foo: { 'array': [
                    { 'boolean': true },
                ] } },
            },
            {
                label:      'Simple string',
                delta_data: { foo: [
                    'bar',
                    'baz',
                ] },
                expected: { foo: { 'array': [
                    { 'string': 'bar' },
                    { 'string': 'baz' },
                ] } },
            },
            {
                label:      'Simple int',
                delta_data: { foo: [
                    123
                ] },
                expected: { foo: { 'array': [
                    { 'double': 123 },
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
                expected: { foo: { 'array': [
                    { 'array': [
                        { 'string': 'bar' },
                        { 'string': 'baz' },
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
                expected: { foo: { 'array': [
                    { 'array': [
                        { 'array': [
                            { 'string': 'bar' },
                            { 'double':   123 },
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
                 expected: { foo: { 'array': [
                    { 'string': 'bar' },
                    { 'string': 'baz' },
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
                expected: { foo: { 'array': [
                { 'array': [
                    { 'string': 'bar' },
                    { 'double': 123321 },
                    null,
                ] },
                ] } },
            },
            {
                label:      'Nested Array with mixed values',
                delta_data: { foo: [
                    {
                        'bar': {
                            'wer': 'qaz',
                            'qwe': 1572903485000,
                            'asd': true,
                            'zxc': null,
                        },
                    },
                ] },
                expected: { 'foo': { 'array': [
                    { 'map': {
                        'bar': { 'map': {
                            'wer': { 'string': 'qaz' },
                            'qwe': { 'double': 1572903485000 },
                            'asd': { 'boolean': true },
                            'zxc': null,
                        } },
                    } },
                ] } },
            },
        ].forEach( ( { label, delta_data, expected } ) =>
        {
            it( label, () =>
            {
                const encoded        = 'FooBar';
                const avroEncoderCtr = createMockEncoder( encoded );
                const stub_schema    = <AvroSchema>{};
                const sut            = new Sut(
                    avroEncoderCtr,
                    stub_schema,
                );

                const actual  = sut.setDataTypes( delta_data );

                expect( actual ).to.deep.equal( expected );
            } );
        } );
    } );



    it( 'Message is formatted correctly', () =>
    {
        const bucket          = { foo: [ 'bar', 'baz' ] };
        const ratedata        = {};
        const doc_id          = <DocumentId>123;
        const quote_set_id    = <DocumentId>123;
        const program         = 'mega';
        const entity_name     = 'Some Agency';
        const entity_id       = 123;
        const startDate       = <UnixTimestamp>345;
        const lastUpdate      = <UnixTimestamp>456;
        const expDate         = <UnixTimestamp>789;
        const schema          = createMockAvroSchema();
        const ts              = <UnixTimestamp>123;
        const encoder         = createMockEncoderCtor( schema );
        const meta            = <DocumentMeta>{
            id:          doc_id,
            quoteSetId:  quote_set_id,
            program:     program,
            entity_name: entity_name,
            entity_id:   entity_id,
            startDate:   startDate,
            lastUpdate:  lastUpdate,
            expDate:     expDate,
        };

        const delta = <Delta<any>>{
            type:            <DeltaType>'data',
            timestamp:       <UnixTimestamp>123123123,
            data:            <DeltaResult<any>>{},
            concluding_save: true,
        };

        const expected = {
            event: {
                id:    'STEP_SAVE',
                ts:    ts * 1000,
                actor: 'SERVER',
                step:  {
                    EventStep: {
                        transition: 'END',
                        src:        '',
                        dest: '',
                    },
                },
            },
            document: {
                id:           doc_id,
                quote_set_id: quote_set_id,
                created:  {
                    'long': startDate * 1000
                },
                modified: {
                    'long': lastUpdate * 1000
                },
                expires: {
                    'long': expDate
                },
            },
            session: {
                Session: {
                    entity_name: entity_name,
                    entity_id:   entity_id,
                },
            },
            data: {
                Data: {
                    bucket: {
                        'foo': { 'array': [
                            { 'string': 'bar' },
                            { 'string': 'baz' },
                        ] }
                    },
                },
            },
            ratedata: {
                Data: {
                    bucket: {},
                },
            },
            delta: {
                Data: {
                    bucket: delta.data,
                },
            },
            program: {
                Program: {
                    id:      program,
                    version: '',
                },
            },
        };

        let is_valid_called = false;

        schema.isValid = ( data: Record<string, any>, _:any ) =>
        {
            expect( data ).to.deep.equal( expected );

            is_valid_called = true;

            return null;
        }

        return expect( new Sut( encoder, schema )
            .write( ts, meta, delta, bucket, ratedata ) )
            .to.eventually.deep.equal( Buffer.from( '' ) )
            .then( _ =>
            {
                expect( is_valid_called ).to.be.true;
            } )
    } );
} );


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
            id:           123123,
            quote_set_id: 123123,
            created:      { 'long': 157385691600 },
            modified:     { 'long': 257381491600 },
            top_visited_step: '2',
        },
        session: {
            Session: {
                entity_name: 'Foo',
                entity_id:   123,
            },
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


function createMockDelta(): Delta<any>
{
    return <Delta<any>>{
        type:      <DeltaType>'data',
        timestamp: <UnixTimestamp>123123123,
        data:      <DeltaResult<any>>{},
    }
}


function createMockBucketData(): Record<string, any>
{
    return {
        foo: [ 'bar', 'baz' ]
    }
}


function createMockEncoderCtor( stub_schema: AvroSchema ):
    ( schema: AvroSchema ) => Duplex
{
    const events = <Record<string, () => void>>{};

    const mock_duplex   = <Duplex>(<unknown>{
        on( event_name: string, callback: () => void )
        {
            events[ event_name ] = callback;
        },

        end()
        {
            events.end();
        },
    } );

    return ( schema: AvroSchema ): Duplex =>
    {
        expect( schema ).to.equal( stub_schema );
        return mock_duplex;
    };
}


function createMockAvroSchema(): AvroSchema
{
    return <AvroSchema>{
        toBuffer() { return null },
        isValid() { return null },
        encode() {},
        toString() { return '' },
        fromBuffer() { return {} },
    };
}
