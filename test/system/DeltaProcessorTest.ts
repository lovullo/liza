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
import { MongoDeltaType } from '../../src/system/db/MongoDeltaDao';


import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );


describe( 'system.DeltaProcessor', () =>
{
    describe( '#getTimestampSortedDeltas', () =>
    {
        ( <{ label: string, given: any, expected: any }[]>[
            {
                label: 'creates list',
                given: {
                    rdelta: {
                        data: [
                            {
                                data:      { foo: 'first_bar' },
                                timestamp: 123,
                            },
                            {
                                data:      { foo: 'second_bar' },
                                timestamp: 234,
                            },
                        ],
                        ratedata: [
                            {
                                data:      { foo: 'third_bar' },
                                timestamp: 345,
                            },
                            {
                                data:      { foo: 'fourth_bar' },
                                timestamp: 456,
                            },
                        ]
                    }
                },
                expected: [
                    {
                        data:      { foo: 'first_bar' },
                        timestamp: 123,
                        type:      'data',
                    },
                    {
                        data:      { foo: 'second_bar' },
                        timestamp: 234,
                        type:      'data',
                    },
                    {
                        data:      { foo: 'third_bar' },
                        timestamp: 345,
                        type:      'ratedata',
                    },
                    {
                        data:      { foo: 'fourth_bar' },
                        timestamp: 456,
                        type:      'ratedata',
                    },
                ],
            },
            {
                label: 'creates list with no ratedata',
                given: {
                    rdelta: {
                        data: [
                            {
                                data:      { foo: 'first_bar' },
                                timestamp: 123,
                            },
                            {
                                data:      { foo: 'second_bar' },
                                timestamp: 234,
                            },
                        ],
                        ratedata: []
                    }
                },
                expected: [
                    {
                        data:      { foo: 'first_bar' },
                        timestamp: 123,
                        type:      'data',
                    },
                    {
                        data:      { foo: 'second_bar' },
                        timestamp: 234,
                        type:      'data',
                    },
                ],
            },
            {
                label: 'creates list when rate occurs between two saves',
                given: {
                    rdelta: {
                        data: [
                            {
                                data:      { foo: 'first_bar' },
                                timestamp: 123,
                            },
                            {
                                data:      { foo: 'second_bar' },
                                timestamp: 234,
                            },
                            {
                                data:      { foo: 'fourth_bar' },
                                timestamp: 456,
                            },
                        ],
                        ratedata: [
                            {
                                data:      { foo: 'third_bar' },
                                timestamp: 345,
                            },
                        ],
                    },
                },
                expected: [
                    {
                        data:      { foo: 'first_bar' },
                        timestamp: 123,
                        type:      'data',
                    },
                    {
                        data:      { foo: 'second_bar' },
                        timestamp: 234,
                        type:      'data',
                    },
                    {
                        data:      { foo: 'third_bar' },
                        timestamp: 345,
                        type:      'ratedata',
                    },
                    {
                        data:      { foo: 'fourth_bar' },
                        timestamp: 456,
                        type:      'data',
                    },
                ],
            },
        ] ).forEach( ( { given, expected, label } ) => it( label, () =>
        {
            const sut = new Sut(
                createMockDeltaDao(),
                createMockDeltaPublisher()
            );

            const actual = sut.getTimestampSortedDeltas( given );

            expect( actual ).to.deep.equal( expected );
        } ) );
    } );


    describe( '#getDeltas', () =>
    {
        ( <{
            label:    string,
            type:     MongoDeltaType,
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
                                data:      { foo: 'first_bar' },
                                timestamp: 123,
                            },
                            {
                                data:      { foo: 'second_bar' },
                                timestamp: 234,
                            },
                        ],
                    },
                },
                expected: [
                    {
                        data:      { foo: 'first_bar' },
                        timestamp: 123,
                        type:      'data',
                    },
                    {
                        data:      { foo: 'second_bar' },
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
                                data:      { foo: 'first_bar' },
                                timestamp: 123,
                            },
                            {
                                data:      { foo: 'second_bar' },
                                timestamp: 234,
                            },
                        ],
                    },
                    lastPublishDelta: {
                        data: 0,
                    },
                },
                expected: [
                    {
                        data:      { foo: 'first_bar' },
                        timestamp: 123,
                        type:      'data',
                    },
                    {
                        data:      { foo: 'second_bar' },
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
                                data:      { foo: 'first_bar' },
                                timestamp: 123,
                            },
                            {
                                data:      { foo: 'second_bar' },
                                timestamp: 234,
                            },
                        ],
                    },
                    lastPublishDelta: {
                        data: 1,
                    },
                },
                expected: [
                    {
                        data:      { foo: 'second_bar' },
                        timestamp: 234,
                        type:      'data',
                    },
                ],
            },
        ] ).forEach( ( { type, given, expected, label } ) => it( label, () =>
        {
            const sut = new Sut(
                createMockDeltaDao(),
                createMockDeltaPublisher()
            );

            const actual = sut.getDeltas( given, type );

            expect( actual ).to.deep.equal( expected );
        } ) );
    } );
} );


function createMockDeltaDao(): DeltaDao
{
    return <DeltaDao>{
        getUnprocessedDocuments() { return this },
        advanceDeltaIndexByType() { return this },
        markDocumentAsProcessed() { return this },
    };
}


function createMockDeltaPublisher(): AmqpPublisher
{
    return <AmqpPublisher>{
        publish() {},
    };
}
