/**
 * Delta Processor test
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

import { DeltaProcessor as Sut } from '../../src/system/DeltaProcessor';
import { AmqpPublisher } from '../../src/system/AmqpPublisher';
import { DeltaDao } from '../../src/system/db/DeltaDao';
import { DeltaType, DeltaDocument } from "../../src/bucket/delta";
import { DocumentId } from '../../src/document/Document';
import { EventEmitter } from 'events';

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );


describe( 'system.DeltaProcessor', () =>
{
    describe( '#getDeltas', () =>
    {
        ( <{
            label:    string,
            type:     DeltaType,
            given:    any,
            expected: any
        }[]>[
            {
                label: 'return empty array if no deltas are present',
                type: 'data',
                given: {
                    rdelta: {},
                },
                expected: [],
            },
            {
                label: 'return full list if no lastPublished index is found',
                type: 'data',
                given: {
                    rdelta: {
                        data: [
                            {
                                data:      { foo: [ 'first_bar' ] },
                                timestamp: 123,
                            },
                            {
                                data:      { foo: [ 'second_bar' ] },
                                timestamp: 234,
                            },
                        ],
                    },
                },
                expected: [
                    {
                        data:      { foo: [ 'first_bar' ] },
                        timestamp: 123,
                        type:      'data',
                    },
                    {
                        data:      { foo: [ 'second_bar' ] },
                        timestamp: 234,
                        type:      'data',
                    },
                ],
            },
            {
                label: 'marks deltas with their type',
                type: 'data',
                given: {
                    rdelta: {
                        data: [
                            {
                                data:      { foo: [ 'first_bar' ] },
                                timestamp: 123,
                            },
                            {
                                data:      { foo: [ 'second_bar' ] },
                                timestamp: 234,
                            },
                        ],
                    },
                    totalPublishDelta: {
                        data: 0,
                    },
                },
                expected: [
                    {
                        data:      { foo: [ 'first_bar' ] },
                        timestamp: 123,
                        type:      'data',
                    },
                    {
                        data:      { foo: [ 'second_bar' ] },
                        timestamp: 234,
                        type:      'data',
                    },
                ],
            },
            {
                label: 'trims delta array based on index',
                type: 'data',
                given: {
                    rdelta: {
                        data: [
                            {
                                data:      { foo: [ 'first_bar' ] },
                                timestamp: 123,
                            },
                            {
                                data:      { foo: [ 'second_bar' ] },
                                timestamp: 234,
                            },
                        ],
                    },
                    totalPublishDelta: {
                        data: 1,
                    },
                },
                expected: [
                    {
                        data:      { foo: [ 'second_bar' ] },
                        timestamp: 234,
                        type:      'data',
                    },
                ],
            },
        ] ).forEach( ( { type, given, expected, label } ) => it( label, () =>
        {
            const sut = new Sut(
                createMockDeltaDao(),
                createMockDeltaPublisher(),
                new EventEmitter(),
            );

            const actual = sut.getDeltas( given, type );

            expect( actual ).to.deep.equal( expected );
        } ) );
    } );


    describe( '#process', () =>
    {
        ( <{
            label:    string,
            given:    any[],
            expected: any
        }[]>[
            {
                label: 'No deltas are processed',
                given: [
                    {
                        id:         123,
                        lastUpdate: 123123123,
                        data:       {},
                        ratedata:   {},
                        rdelta:     {},
                    },
                ],
                expected: [],
            },
            {
                label: 'Publishes deltas in order',
                given: [
                    {
                        id:         123,
                        lastUpdate: 123123123,
                        data:       { foo: [ 'start_bar' ] },
                        ratedata:   {},
                        rdelta:     {
                            data: [
                                {
                                    data:      { foo: [ 'first_bar' ] },
                                    timestamp: 123123,
                                },
                                {
                                    data:      { foo: [ 'second_bar' ] },
                                    timestamp: 234123,
                                },
                            ],
                        },
                    },
                ],
                expected: [
                    {
                        doc_id:   123,
                        delta:    { foo: [ 'first_bar' ] },
                        bucket:   { foo: [ 'first_bar' ] },
                        ratedata: {},
                    },
                    {
                        doc_id:   123,
                        delta:    { foo: [ 'second_bar' ] },
                        bucket:   { foo: [ 'second_bar' ] },
                        ratedata: {},
                    },
                ],
            },
            {
                label: 'Publishes deltas in order for multiple documents',
                given: [
                    {
                        id:         123,
                        lastUpdate: 123123123,
                        data:       { foo: [ 'start_bar_123' ] },
                        ratedata:   {},
                        rdelta:     {
                            data: [
                                {
                                    data:      { foo: [ 'second_bar_123' ] },
                                    timestamp: 234,
                                },
                            ],
                            ratedata: [
                                {
                                    data:      { foo: [ 'first_bar_123' ] },
                                    timestamp: 123,
                                },
                            ],
                        },
                    },
                    {
                        id:         234,
                        lastUpdate: 123123123,
                        data:       { foo: [ 'start_bar_234' ] },
                        ratedata:   {},
                        rdelta:     {
                            data: [
                                {
                                    data:      { foo: [ 'first_bar_234' ] },
                                    timestamp: 123,
                                },
                                {
                                    data:      { foo: [ 'second_bar_234' ] },
                                    timestamp: 234,
                                },
                                {
                                    data:      { foo: [ 'third_bar_234' ] },
                                    timestamp: 345,
                                },
                            ],
                        },
                    },
                    {
                        id:         345,
                        lastUpdate: 123123123,
                        data:       { foo: [ 'start_bar_345' ] },
                        ratedata:   {},
                        rdelta:     {
                            ratedata: [
                                {
                                    data:      { foo: [ 'first_bar_345' ] },
                                    timestamp: 123,
                                },
                                {
                                    data:      { foo: [ 'second_bar_345' ] },
                                    timestamp: 234,
                                },
                            ],
                        },
                    },
                ],
                expected: [
                    {
                        doc_id:   123,
                        delta:    { foo: [ 'first_bar_123' ] },
                        bucket:   { foo: [ 'start_bar_123' ] },
                        ratedata: { foo: [ 'first_bar_123' ] },
                    },
                    {
                        doc_id:   123,
                        delta:    { foo: [ 'second_bar_123' ] },
                        bucket:   { foo: [ 'second_bar_123' ] },
                        ratedata: { foo: [ 'first_bar_123' ] },
                    },
                    {
                        doc_id:   234,
                        delta:    { foo: [ 'first_bar_234' ] },
                        bucket:   { foo: [ 'first_bar_234' ] },
                        ratedata: {},
                    },
                    {
                        doc_id:   234,
                        delta:    { foo: [ 'second_bar_234' ] },
                        bucket:   { foo: [ 'second_bar_234' ] },
                        ratedata: {},
                    },
                    {
                        doc_id:   234,
                        delta:    { foo: [ 'third_bar_234' ] },
                        bucket:   { foo: [ 'third_bar_234' ] },
                        ratedata: {},
                    },
                    {
                        doc_id:   345,
                        delta:    { foo: [ 'first_bar_345' ] },
                        bucket:   { foo: [ 'start_bar_345' ] },
                        ratedata: { foo: [ 'first_bar_345' ] },
                    },
                    {
                        doc_id:   345,
                        delta:    { foo: [ 'second_bar_345' ] },
                        bucket:   { foo: [ 'start_bar_345' ] },
                        ratedata: { foo: [ 'second_bar_345' ] },
                    },
                ],
            },
        ] ).forEach( ( { label, given, expected } ) => it( label, () =>
        {
            let   published: any = [];
            const dao            = createMockDeltaDao();
            const publisher      = createMockDeltaPublisher();
            const emitter        = new EventEmitter();

            dao.getUnprocessedDocuments = (): Promise<DeltaDocument[]> =>
            {
                return Promise.resolve( given );
            }

            publisher.publish = (
                doc_id,
                delta,
                bucket,
                ratedata,
            ): Promise<void> =>
            {
                published.push( {
                    doc_id:   doc_id,
                    delta:    delta.data,
                    bucket:   bucket,
                    ratedata: ratedata,
                } );

                return Promise.resolve();
            }

            return expect( new Sut( dao, publisher, emitter ).process() )
                .to.eventually.deep.equal( undefined )
                .then( _ => expect( published ).to.deep.equal( expected ) );
        } ) );
    } );


    describe( 'Error handling', () =>
    {
        it( 'Marks document in error state and continues', () =>
        {
            let   published: any = [];
            let   error_flag_set = false;
            const dao            = createMockDeltaDao();
            const publisher      = createMockDeltaPublisher();
            const emitter        = new EventEmitter();
            const doc            = <DeltaDocument[]>[ {
                id:         <DocumentId>123,
                lastUpdate: <UnixTimestamp>123123123,
                data:       { foo: [ 'start_bar' ] },
                ratedata:   {},
                rdelta:     {
                    data: [
                        {
                            data:      { foo: [ 'first_bar' ] },
                            timestamp: <UnixTimestamp>123123,
                            type:      'data',
                        }
                    ],
                    ratedata: [],
                },
            },
            {
                id:         <DocumentId>234,
                lastUpdate: <UnixTimestamp>123123123,
                data:       { foo: [ 'start_bar' ] },
                ratedata:   {},
                rdelta:     {
                    data: [
                        {
                            data:      { foo: [ 'first_bar' ] },
                            timestamp: <UnixTimestamp>123123,
                            type:      'data',
                        }
                    ],
                    ratedata: [],
                },
            } ];

            const expected_published = [
                {
                    doc_id:    123,
                    delta:     { foo: [ 'first_bar' ] },
                    bucket:    { foo: [ 'first_bar' ] },
                    ratedata:  {},
                },
                {
                    doc_id:    234,
                    delta:     { foo: [ 'first_bar' ] },
                    bucket:    { foo: [ 'first_bar' ] },
                    ratedata:  {},
                }
            ];

            const expected_error = 'Uh oh';

            dao.getUnprocessedDocuments = (): Promise<DeltaDocument[]> =>
                Promise.resolve( doc );

            dao.markDocumentAsProcessed = ( _doc_id, _ts ): Promise<void> =>
                Promise.reject( new Error( expected_error ) );

            dao.setErrorFlag = (): Promise<void> =>
            {
                error_flag_set = true;
                return Promise.resolve();
            }

            publisher.publish = (
                doc_id,
                delta,
                bucket,
                ratedata,
            ): Promise<void> =>
            {
                published.push( {
                    doc_id:   doc_id,
                    delta:    delta.data,
                    bucket:   bucket,
                    ratedata: ratedata,
                } );

                return Promise.resolve();
            }

            // Prevent node from converting an error event into an error
            emitter.on( 'error', () => {} );

            return expect( new Sut( dao, publisher, emitter ).process() )
                .to.eventually.deep.equal( undefined )
                .then( _ =>
                {
                    expect( error_flag_set ).to.be.true;
                    expect( published ).to.deep.equal( expected_published );
                } );
        } );
    } );


    describe( 'Error handling', () =>
    {
        it( 'Failure to set document error state further processing', () =>
        {
            let   published: any = [];
            let   caught_error   = '';
            const dao            = createMockDeltaDao();
            const publisher      = createMockDeltaPublisher();
            const emitter        = new EventEmitter();
            const doc            = <DeltaDocument[]>[ {
                id:         <DocumentId>123,
                lastUpdate: <UnixTimestamp>123123123,
                data:       { foo: [ 'start_bar' ] },
                ratedata:   {},
                rdelta:     {
                    data: [
                        {
                            data:      { foo: [ 'first_bar' ] },
                            timestamp: <UnixTimestamp>123123,
                            type:      'data',
                        }
                    ],
                    ratedata: [],
                },
            },
            {
                id:         <DocumentId>234,
                lastUpdate: <UnixTimestamp>123123123,
                data:       { foo: [ 'start_bar' ] },
                ratedata:   {},
                rdelta:     {
                    data: [
                        {
                            data:      { foo: [ 'first_bar' ] },
                            timestamp: <UnixTimestamp>123123,
                            type:      'data',
                        }
                    ],
                    ratedata: [],
                },
            } ];

            // Only one is published
            const expected_published = [ {
                doc_id:    123,
                delta:     { foo: [ 'first_bar' ] },
                bucket:    { foo: [ 'first_bar' ] },
                ratedata:  {},
            } ];

            const expected_error = 'Uh oh';

            dao.getUnprocessedDocuments = (): Promise<DeltaDocument[]> =>
                Promise.resolve( doc );

            dao.markDocumentAsProcessed = ( _doc_id, _ts ): Promise<void> =>
                Promise.reject( new Error( 'Couldn\'t mark document' ) );

            dao.setErrorFlag = (): Promise<void> =>
                Promise.reject( new Error( expected_error ) );

            publisher.publish = (
                doc_id,
                delta,
                bucket,
                ratedata,
            ): Promise<void> =>
            {
                published.push( {
                    doc_id:   doc_id,
                    delta:    delta.data,
                    bucket:   bucket,
                    ratedata: ratedata,
                } );

                return Promise.resolve();
            }

            // Prevent node from converting an error event into an error
            emitter.on( 'error', () => {} );

            return expect(
                    new Sut( dao, publisher, emitter ).process()
                        .catch( e => { caught_error = e.message } )
                )
                .to.eventually.deep.equal( undefined )
                .then( _ =>
                {
                    expect( caught_error ).to.equal( expected_error );
                    expect( published ).to.deep.equal( expected_published );
                } );
        } );
    } );
} );


function createMockDeltaDao(): DeltaDao
{
    return <DeltaDao>{
        getUnprocessedDocuments() { return Promise.resolve( [] ); },
        advanceDeltaIndex()       { return Promise.resolve(); },
        markDocumentAsProcessed() { return Promise.resolve(); },
        setErrorFlag()            { return Promise.resolve(); },
        getErrorCount()           { return Promise.resolve( 0 ); },
    };
}


function createMockDeltaPublisher(): AmqpPublisher
{
    return <AmqpPublisher>{
        publish() { return Promise.resolve(); },
    };
}
