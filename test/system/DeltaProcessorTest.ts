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
import { DeltaDocument } from '../../src/bucket/delta';
import { DocumentId } from '../../src/document/Document';
import { EventEmitter } from 'events';

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );


describe( 'system.DeltaProcessor', () =>
{
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

            // when quote is initialized: { foo: [ '' ], state: [ 'a' ] }
            {
                label: 'Publishes deltas in order',

                given: [
                    {
                        id:         123,
                        lastUpdate: 123123123,

                        data:       {
                            bar:   [ 'initial and unchanged' ],
                            foo:   [ 'third' ],
                            state: [ 'a', 'b', 'c', 'd' ],
                        },

                        ratedata: {
                            prem:  [ 'rate_second' ],
                            state: [ 'i', 'ii', 'iii' ],
                        },

                        rdelta:     {
                            data: [
                                {
                                    timestamp: 1,
                                    data:      {
                                        foo:   [ '' ],
                                        state: [ undefined, null ],
                                    },
                                },
                                {
                                    timestamp: 3,
                                    data:      {
                                        foo:   [ 'first' ],
                                        state: [ undefined, undefined, null ],
                                    },
                                },
                                {
                                    timestamp: 5,
                                    data:    {
                                        foo:   [ 'second' ],
                                        state: [ undefined, undefined, undefined, null ],
                                    },
                                },
                            ],

                            ratedata: [
                                {
                                    timestamp: 2,
                                    data:      {
                                        prem:   [ '' ],
                                        state: [ undefined, null ],
                                    },
                                },
                                {
                                    timestamp: 4,
                                    data:      {
                                        prem:   [ 'rate_first' ],
                                        state: [ undefined, undefined, null ],
                                    },
                                },
                            ],
                        },
                    },
                ],

                expected: [
                    // bucket
                    {
                        doc_id:   123,
                        rdelta: {
                            foo:   [ '' ],
                            state: [ undefined, null ],
                        },
                        bucket:   {
                            bar:   [ 'initial and unchanged' ],
                            foo:   [ 'first' ],
                            state: [ 'a', 'b' ],
                        },
                        ratedata: {},
                    },

                    // rate
                    {
                        doc_id:   123,
                        rdelta: {
                            prem:  [ '' ],
                            state: [ undefined, null ],
                        },
                        bucket:   {
                            bar:   [ 'initial and unchanged' ],
                            foo:   [ 'first' ],
                            state: [ 'a', 'b' ],
                        },
                        ratedata: {
                            prem:  [ 'rate_first' ],
                            state: [ 'i', 'ii' ],
                        },
                    },

                    // bucket
                    {
                        doc_id:   123,
                        rdelta:    {
                            foo:   [ 'first' ],
                            state: [ undefined, undefined, null ],
                        },
                        bucket:   {
                            bar:   [ 'initial and unchanged' ],
                            foo:   [ 'second' ],
                            state: [ 'a', 'b', 'c' ],
                        },
                        ratedata:  {},
                    },

                    // rate
                    {
                        doc_id:   123,
                        rdelta:    {
                            prem:  [ 'rate_first' ],
                            state: [ undefined, undefined, null ],
                        },
                        bucket:   {
                            bar:   [ 'initial and unchanged' ],
                            foo:   [ 'second' ],
                            state: [ 'a', 'b', 'c' ],
                        },
                        ratedata:  {
                            prem:  [ 'rate_second' ],
                            state: [ 'i', 'ii', 'iii' ],
                        },
                    },

                    // bucket
                    {
                        doc_id:   123,
                        rdelta:    {
                            foo:   [ 'second' ],
                            state: [ undefined, undefined, undefined, null ],
                        },
                        bucket:   {
                            bar:   [ 'initial and unchanged' ],
                            foo:   [ 'third' ],
                            state: [ 'a', 'b', 'c', 'd' ],
                        },
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

                        data:       {
                            foo:   [ 'first' ],
                            state: [ 'a', 'b' ],
                        },

                        ratedata: {
                            prem:  [ 'rate_first' ],
                            state: [ 'i', 'ii' ],
                        },

                        rdelta:     {
                            data: [
                                {
                                    timestamp: 1,
                                    data:      {
                                        foo:   [ '' ],
                                        state: [ undefined, null ],
                                    },
                                },
                            ],

                            ratedata: [
                                {
                                    timestamp: 4,
                                    data:      {
                                        prem:   [ '' ],
                                        state: [ undefined, null ],
                                    },
                                },
                            ],
                        },
                    },

                    // timestamps of this document are sandwiched between
                    // the above to make sure documents are processed
                    // independently (without splicing their deltas together)
                    {
                        id:         234,
                        lastUpdate: 121212123,

                        data:       {
                            foo2:   [ 'first' ],
                            state: [ 'a', 'b' ],
                        },

                        ratedata: {
                            prem2:  [ 'rate_first' ],
                            state: [ 'i', 'ii' ],
                        },

                        rdelta:     {
                            data: [
                                {
                                    timestamp: 2,
                                    data:      {
                                        foo2:   [ '' ],
                                        state: [ undefined, null ],
                                    },
                                },
                            ],

                            ratedata: [
                                {
                                    timestamp: 3,
                                    data:      {
                                        prem2:   [ '' ],
                                        state: [ undefined, null ],
                                    },
                                },
                            ],
                        },
                    },
                ],

                expected: [
                    // bucket
                    {
                        doc_id:   123,
                        rdelta: {
                            foo:   [ '' ],
                            state: [ undefined, null ],
                        },
                        bucket:   {
                            foo:   [ 'first' ],
                            state: [ 'a', 'b' ],
                        },
                        ratedata: {},
                    },

                    // rate
                    {
                        doc_id:   123,
                        rdelta: {
                            prem:  [ '' ],
                            state: [ undefined, null ],
                        },
                        bucket:   {
                            foo:   [ 'first' ],
                            state: [ 'a', 'b' ],
                        },
                        ratedata: {
                            prem:  [ 'rate_first' ],
                            state: [ 'i', 'ii' ],
                        },
                    },

                    // bucket
                    {
                        doc_id:   234,
                        rdelta: {
                            foo2:   [ '' ],
                            state: [ undefined, null ],
                        },
                        bucket:   {
                            foo2:   [ 'first' ],
                            state: [ 'a', 'b' ],
                        },
                        ratedata: {},
                    },

                    // rate
                    {
                        doc_id:   234,
                        rdelta: {
                            prem2:  [ '' ],
                            state: [ undefined, null ],
                        },
                        bucket:   {
                            foo2:   [ 'first' ],
                            state: [ 'a', 'b' ],
                        },
                        ratedata: {
                            prem2:  [ 'rate_first' ],
                            state: [ 'i', 'ii' ],
                        },
                    },
                ],
            },

            {
                label: 'trims delta array based on index',
                given: [
                    {
                        id:         111,
                        lastUpdate: 123123123,
                        data:       { foo: [ 'second' ] },
                        ratedata:   {},
                        rdelta:     {
                            data: [
                                {
                                    data:      { foo: [ '' ] },
                                    timestamp: 123,
                                },
                                {
                                    data:      { foo: [ 'first' ] },
                                    timestamp: 234,
                                },
                            ],
                        },
                        totalPublishDelta: {
                            data: 1,
                        },
                    },
                ],
                expected: [
                    {
                        doc_id:   111,
                        rdelta:   { foo: [ 'first' ] },
                        bucket:   { foo: [ 'second' ] },
                        ratedata: {}
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
                meta,
                delta,
                bucket,
                ratedata,
            ): Promise<void> =>
            {
                published.push( {
                    doc_id:   meta.id,
                    rdelta:   delta.data,
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
            const entity_num     = 'Some Agency';
            const entity_id      = 4321;
            const lastUpdate     = <UnixTimestamp>123123123;
            const createdData    = <UnixTimestamp>234234234;
            const doc            = <DeltaDocument[]>[ {
                id:            <DocumentId>123,
                programId:     'mega',
                agentName:     entity_num,
                agentEntityId: entity_id,
                startDate:     createdData,
                lastUpdate:    lastUpdate,
                data:          { foo: [ 'start_bar' ] },
                ratedata:      {},
                rdelta:        {
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
                id:            <DocumentId>234,
                programId:     'mega',
                agentName:     entity_num,
                agentEntityId: entity_id,
                startDate:     createdData,
                lastUpdate:    <UnixTimestamp>123123123,
                data:          { foo: [ 'start_bar' ] },
                ratedata:      {},
                rdelta:        {
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
                    meta: {
                        entity_id:   4321,
                        entity_name: 'Some Agency',
                        id:          123,
                        program:     'mega',
                        lastUpdate:  123123123,
                        startDate:   234234234,
                    },
                    delta:     { foo: [ 'first_bar' ] },
                    bucket:    { foo: [ 'start_bar' ] },
                    ratedata:  {},
                },
                {
                    meta: {
                        entity_id:   4321,
                        entity_name: 'Some Agency',
                        id:          234,
                        program:     'mega',
                        lastUpdate:  123123123,
                        startDate:   234234234,
                    },
                    delta:     { foo: [ 'first_bar' ] },
                    bucket:    { foo: [ 'start_bar' ] },
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
                meta,
                delta,
                bucket,
                ratedata,
            ): Promise<void> =>
            {
                published.push( {
                    meta:     meta,
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
                id:            <DocumentId>123,
                programId:     'mega',
                agentName:     'Some Agency',
                agentEntityId: 4321,
                startDate:     <UnixTimestamp>234234234,
                lastUpdate:    <UnixTimestamp>123123123,
                data:          { foo: [ 'start_bar' ] },
                ratedata:      {},
                rdelta:        {
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
                id:            <DocumentId>234,
                programId:     'mega',
                agentName:     'Some Agency',
                agentEntityId: 4321,
                startDate:     <UnixTimestamp>234234234,
                lastUpdate:    <UnixTimestamp>123123123,
                data:          { foo: [ 'start_bar' ] },
                ratedata:      {},
                rdelta:        {
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
                meta: {
                    entity_id:   4321,
                    entity_name: 'Some Agency',
                    id:          123,
                    program:     'mega',
                    lastUpdate:  123123123,
                    startDate:   234234234,
                },
                delta:     { foo: [ 'first_bar' ] },
                bucket:    { foo: [ 'start_bar' ] },
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
                meta,
                delta,
                bucket,
                ratedata,
            ): Promise<void> =>
            {
                published.push( {
                    meta,
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
