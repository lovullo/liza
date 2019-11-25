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

import { EventDispatcher } from '../../src/system/event/EventDispatcher';
import { DeltaPublisher as Sut } from '../../src/system/DeltaPublisher';
import { AmqpConfig } from '../../src/system/AmqpPublisher';

import { expect, use as chai_use } from 'chai';
import { EventEmitter } from "events";
chai_use( require( 'chai-as-promised' ) );


describe( 'server.DeltaPublisher', () =>
{
    describe( '#publish', () =>
    {
        it( 'sends a message', () =>
        {
            const conf       = createMockConf();
            const dispatcher = new EventDispatcher( new EventEmitter() );

            console.log( new Sut( conf, dispatcher, ts_ctr ) );
            expect( true ).to.be.true
        } );
    } );

    describe( '#sendMessage', () =>
    {
        it( 'sends a message', () =>
        {
            const conf       = createMockConf();
            const dispatcher = new EventDispatcher( new EventEmitter() );

            console.log( new Sut( conf, dispatcher, ts_ctr ) );
            expect( true ).to.be.true
        } );
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
                let errorCalled = false;

                const dispatcher = <EventDispatcher>{
                    dispatch( _event_id, _err )
                    {
                        errorCalled = true;

                        console.log( 'server.DeltaPublisher.Error' + _err );
                    }
                }

                const conf   = createMockConf();
                const data   = createMockData( delta_data );
                const sut    = new Sut( conf, dispatcher, ts_ctr );
                const buffer = sut.avroEncode( data );

                if ( valid )
                {
                    expect( typeof(buffer) ).to.equal( 'object' );
                }
                else
                {
                    expect( buffer ).to.equal( null );
                }

                expect( valid ).to.equal( !errorCalled );
            } );
        } );
    } );


    describe( '#avroFormat formats', () =>
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
                const dispatcher = <EventDispatcher>{}
                const conf       = createMockConf();
                const sut        = new Sut( conf, dispatcher, ts_ctr );
                const actual     = sut.avroFormat( delta_data );

                expect( actual ).to.deep.equal( expected );
            } );
        } );
    } );
} );

function ts_ctr(): UnixTimestamp
{
    return <UnixTimestamp>Math.floor( new Date().getTime() / 1000 );
}

function createMockConf(): AmqpConfig
{
    return <AmqpConfig>{};
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
        session: {
            entity_name: 'Foobar',
            entity_id:   123123 ,
        },
        data: null,
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