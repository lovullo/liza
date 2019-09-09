/**
 * Token state management test
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

import {
    TokenQueryResult,
    TokenStatus,
} from "../../../src/server/token/TokenQueryResult";

import {
    default as Sut,
    TokenData,
} from "../../../src/server/token/TokenDao";

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );


describe( 'server.token.TokenDao', () =>
{
    describe( '#updateToken', () =>
    {
        it( 'updates token with given data', () =>
        {
            const field     = 'foo_field';
            const qid       = 12345;
            const ns        = 'namespace';
            const tok_id    = 'tok123';
            const tok_type  = 'DONE';
            const data      = "some data";
            const timestamp = 12345;

            const root = field + '.' + ns;

            const coll: MongoCollection = {
                update( selector: any, given_data: any, options, callback )
                {
                    expect( given_data.$set[ `${root}.lastStatus` ].timestamp )
                        .to.be.greaterThan( 0 );

                    const expected_entry: TokenStatus = {
                        type:      tok_type,
                        timestamp: timestamp,
                        data:      data,
                    };

                    expect( selector.id ).to.equal( qid );

                    expect( given_data ).to.deep.equal( {
                        $set:  {
                            [`${root}.last`]:             tok_id,
                            [`${root}.lastStatus`]:       expected_entry,
                            [`${root}.${tok_id}.status`]: expected_entry,
                        },
                        $push: {
                            [`${root}.${tok_id}.statusLog`]: expected_entry,
                        },
                    } );

                    expect( ( <MongoQueryUpdateOptions>options ).upsert )
                        .to.be.true;

                    callback( null, {} );
                },

                findOne() {},
            };

            return new Sut( coll, field, () => timestamp )
                .updateToken( qid, ns, tok_id, tok_type, data );
        } );


        it( 'proxies error to callback', () =>
        {
            const expected_error = Error( "expected error" );

            const coll: MongoCollection = {
                update( _selector, _data, _options, callback )
                {
                    callback( expected_error, {} );
                },

                findOne() {},
            };

            return expect(
                new Sut( coll, 'foo', () => 0 )
                    .updateToken( 0, 'ns', 'id', 'DONE', null )
            ).to.eventually.be.rejectedWith( expected_error );
        } );
    } );


    describe( '#getToken', () =>
    {
        const field  = 'get_field';
        const qid    = 12345;
        const ns     = 'get_ns';

        const expected_status: TokenStatus = {
            type:      'ACTIVE',
            timestamp: 0,
            data:      "",
        };

        ( <[string, string, TokenQueryResult, TokenData][]>[
            [
                'retrieves token by id',
                'tok123',
                {
                    [field]: {
                        [ns]: {
                            last:       'tok123',
                            lastStatus: expected_status,

                            tok123: {
                                status:    expected_status,
                                statusLog: [ expected_status ],
                            },
                        },
                    },
                },
                {
                    id:     'tok123',
                    status: expected_status,
                },
            ],

            [
                'returns null for namespace if token is not found',
                'tok123',
                {
                    [field]: {
                        [ns]: {
                            last:       'something',
                            lastStatus: expected_status,

                            // just to make sure we don't grab another tok
                            othertok: {
                                status:    expected_status,
                                statusLog: [ expected_status ],
                            },
                        },
                    },
                },
                null,
            ],

            [
                'returns null for field if namespace is not found',
                'tok123',
                {
                    [field]: {},
                },
                null,
            ],

            [
                'returns lastest modified token given no token id',
                '',
                {
                    [field]: {
                        [ns]: {
                            last: 'toklast',
                            lastStatus: expected_status,

                            toklast: {
                                status:    expected_status,
                                statusLog: [ expected_status ],
                            },
                        },
                    },
                },
                {
                    id:     'toklast',
                    status: expected_status,
                },
            ],
        ] ).forEach( ( [ label, tok_id, result, expected ] ) =>
            it( label, () =>
            {
                const coll: MongoCollection = {
                    findOne( _selector, _fields, callback )
                    {
                        callback( null, result );
                    },

                    update() {},
                };

                return expect(
                    new Sut( coll, field, () => 0 ).getToken( qid, ns, tok_id )
                ).to.eventually.deep.equal( expected );
            } )
        );


        it( 'proxies error to callback', () =>
        {
            const expected_error = Error( "expected error" );

            const coll: MongoCollection = {
                findOne( _selector, _fields, callback )
                {
                    callback( expected_error, {} );
                },

                update() {},
            };

            return expect(
                new Sut( coll, 'foo', () => 0 ).getToken( 0, 'ns', 'id' )
            ).to.eventually.be.rejectedWith( expected_error );
        } );
    } );
} );
