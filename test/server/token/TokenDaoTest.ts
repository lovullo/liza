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

import { expect } from 'chai';

import {
    TokenQueryResult,
    TokenStatus,
} from "../../../src/server/token/TokenQueryResult";

import Sut = require( "../../../src/server/token/TokenDao" );


describe( 'server.token.TokenDao', () =>
{
    describe( '#updateToken', () =>
    {
        it( 'updates token with given data', done =>
        {
            const field    = 'foo_field';
            const qid      = 12345;
            const ns       = 'namespace';
            const tok_id   = 'tok123';
            const tok_type = 'DONE';
            const data     = "some data";

            const root = field + '.' + ns;

            const coll: MongoCollection = {
                update( selector: any, given_data: any, options, callback )
                {
                    expect( given_data.$set[ `${root}.lastStatus` ].timestamp )
                        .to.be.greaterThan( 0 );

                    // TODO: ts is nondeterministic; pass in
                    const expected_entry: TokenStatus = {
                        type:      tok_type,
                        timestamp: given_data.$set[ `${root}.lastStatus` ].timestamp,
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

            new Sut( coll, field )
                .updateToken( qid, ns, tok_id, tok_type, data, done );
        } );


        it( 'proxies error to callback', done =>
        {
            const expected_error = Error( "expected error" );

            const coll: MongoCollection = {
                update( _selector, _data, _options, callback )
                {
                    callback( expected_error, {} );
                },

                findOne() {},
            };

            new Sut( coll, 'foo' )
                .updateToken( 0, 'ns', 'id', 'DONE', null, err =>
                {
                    expect( err ).to.equal( expected_error );
                    done();
                } );
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

        // TODO: export and use TokenData
        ( <[string, string, TokenQueryResult, any][]>[
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
            it( label, done =>
            {
                const coll: MongoCollection = {
                    findOne( _selector, _fields, callback )
                    {
                        callback( null, result );
                    },

                    update() {},
                };

                new Sut( coll, field )
                    .getToken( qid, ns, tok_id, ( err, data ) =>
                    {
                        expect( err ).to.equal( null );
                        expect( data ).to.deep.equal( expected );

                        done();
                    } );
            } )
        );


        it( 'proxies error to callback', done =>
        {
            const expected_error = Error( "expected error" );

            const coll: MongoCollection = {
                findOne( _selector, _fields, callback )
                {
                    callback( expected_error, {} );
                },

                update() {},
            };

            new Sut( coll, 'foo' )
                .getToken( 0, 'ns', 'id', ( err, data ) =>
                {
                    expect( err ).to.equal( expected_error );
                    expect( data ).to.equal( null );

                    done();
                } );
        } );
    } );
} );
