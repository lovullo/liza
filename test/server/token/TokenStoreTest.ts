/**
 * Tests token management
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

import { TokenStore as Sut } from "../../../src/server/token/TokenStore";
import { TokenDao, TokenData } from "../../../src/server/token/TokenDao";
import { DocumentId } from "../../../src/document/Document";

import {
    Token,
    TokenId,
    TokenNamespace,
    TokenState,
} from "../../../src/server/token/Token";

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );


describe( 'TokenStore', () =>
{
    // required via the ctor, but this name is just used to denote that it's
    // not used for a particular test
    const voidIdgen = () => <TokenId>"00";


    describe( '#lookupToken', () =>
    {
        const doc_id   = <DocumentId>5;
        const ns       = <TokenNamespace>'namespace';
        const token_id = <TokenId>'token';

        const expected_ts   = <UnixTimestamp>12345;
        const expected_data = "token data";

        ( <[string, TokenData, Token<TokenState>][]>[
            [
                "returns existing token with matching last",
                {
                    id:     token_id,

                    status: {
                        type:      TokenState.ACTIVE,
                        timestamp: expected_ts,
                        data:      expected_data,
                    },

                    prev_status: null,
                    prev_last:   {
                        id: token_id,

                        status: {
                            type:      TokenState.ACTIVE,
                            timestamp: expected_ts,
                            data:      expected_data,
                        },

                        prev_status: null,
                        prev_last:   null,
                    },
                },
                {
                    id:            token_id,
                    state:         TokenState.ACTIVE,
                    timestamp:     expected_ts,
                    data:          expected_data,
                    last_mismatch: false,
                },
            ],

            [
                "returns existing token with mismatched last",
                {
                    id:     token_id,

                    status: {
                        type:      TokenState.DEAD,
                        timestamp: expected_ts,
                        data:      expected_data,
                    },

                    prev_status: null,
                    prev_last:   {
                        id: <TokenId>'something-else',

                        status: {
                            type:      TokenState.DEAD,
                            timestamp: expected_ts,
                            data:      expected_data,
                        },

                        prev_status: null,
                        prev_last:   null,
                    },
                },
                {
                    id:            token_id,
                    state:         TokenState.DEAD,
                    timestamp:     expected_ts,
                    data:          expected_data,
                    last_mismatch: true,
                },
            ],
        ] ).forEach( ( [ label, dbdata, expected ] ) => it( label, () =>
        {
            const dao = new class implements TokenDao
            {
                getToken(
                    given_doc_id:   DocumentId,
                    given_ns:       TokenNamespace,
                    given_token_id: TokenId
                )
                {
                    expect( given_doc_id ).to.equal( doc_id );
                    expect( given_ns ).to.equal( ns );
                    expect( given_token_id ).to.equal( token_id );

                    return Promise.resolve( dbdata );
                }

                updateToken()
                {
                    return Promise.reject( "unused method" );
                }
            }();

            return expect(
                new Sut( dao, doc_id, ns, voidIdgen )
                    .lookupToken( token_id )
            )
                .to.eventually.deep.equal( expected );
        } ) );


        it( "propagates database errors", () =>
        {
            const doc_id   = <DocumentId>0;
            const ns       = <TokenNamespace>'badns';
            const token_id = <TokenId>'badtok';

            const expected_e = new Error( "test error" );

            const dao = new class implements TokenDao
            {
                getToken()
                {
                    return Promise.reject( expected_e );
                }

                updateToken()
                {
                    return Promise.reject( "unused method" );
                }
            }();

            return expect(
                new Sut( dao, doc_id, ns, voidIdgen )
                    .lookupToken( token_id )
            ).to.eventually.be.rejectedWith( expected_e );
        } );
    } );


    describe( '#createToken', () =>
    {
        const doc_id   = <DocumentId>5;
        const ns       = <TokenNamespace>'namespace';
        const token_id = <TokenId>'token';

        const expected_ts   = <UnixTimestamp>12345;
        const expected_data = "token data";

        ( <[string, TokenData, Token<TokenState>][]>[
            [
                "creates token with last_mismatch given last",
                {
                    id:     token_id,
                    status: {
                        type:      TokenState.ACTIVE,
                        timestamp: expected_ts,
                        data:      expected_data,
                    },

                    prev_status: null,

                    prev_last: {
                        id:     <TokenId>'something-else',
                        status: {
                            type:      TokenState.ACTIVE,
                            timestamp: expected_ts,
                            data:      expected_data,
                        },

                        prev_status: null,
                        prev_last:   null,
                    },
                },
                {
                    id:            token_id,
                    state:         TokenState.ACTIVE,
                    timestamp:     expected_ts,
                    data:          expected_data,
                    last_mismatch: true,
                },
            ],

            [
                "creates token with last_mismatch given null last",
                {
                    id:     token_id,
                    status: {
                        type:      TokenState.ACTIVE,
                        timestamp: expected_ts,
                        data:      expected_data,
                    },

                    prev_status: null,
                    prev_last:   null,
                },
                {
                    id:            token_id,
                    state:         TokenState.ACTIVE,
                    timestamp:     expected_ts,
                    data:          expected_data,
                    last_mismatch: true,
                },
            ],
        ] ).forEach( ( [ label, dbdata, expected ] ) => it( label, () =>
        {
            const dao = new class implements TokenDao
            {
                getToken()
                {
                    return Promise.reject( "unused method" );
                }

                updateToken(
                    given_doc_id:   DocumentId,
                    given_ns:       TokenNamespace,
                    given_token_id: TokenId,
                    given_type:     TokenState,
                    given_data:     string | null,
                )
                {
                    expect( given_doc_id ).to.equal( doc_id );
                    expect( given_ns ).to.equal( ns );
                    expect( given_token_id ).to.equal( token_id );
                    expect( given_type ).to.equal( TokenState.ACTIVE );
                    expect( given_data ).to.equal( null );

                    return Promise.resolve( dbdata );
                }
            }();

            return expect(
                new Sut( dao, doc_id, ns, () => token_id )
                    .createToken()
            ).to.eventually.deep.equal( expected );
        } ) );
    } );


    // each of the state changes do the same thing, just behind a
    // type-restrictive API
    const expected_ts = <UnixTimestamp>123;

    ( <[keyof Sut, Token<TokenState>, string, Token<TokenState>][]>[
        [
            'completeToken',
            {
                id:            <TokenId>'complete-test',
                state:         TokenState.ACTIVE,
                timestamp:     <UnixTimestamp>0,
                data:          "",
                last_mismatch: true,
            },
            "complete-data",
            {
                id:            <TokenId>'complete-test',
                state:         TokenState.DONE,
                timestamp:     expected_ts,
                data:          "complete-data",
                last_mismatch: true,
            },
        ],

        [
            'acceptToken',
            {
                id:            <TokenId>'accept-test',
                state:         TokenState.DONE,
                timestamp:     <UnixTimestamp>0,
                data:          "accept",
                last_mismatch: true,
            },
            "accept-data",
            {
                id:            <TokenId>'accept-test',
                state:         TokenState.ACCEPTED,
                timestamp:     expected_ts,
                data:          "accept-data",
                last_mismatch: true,
            },
        ],

        [
            'killToken',
            {
                id:            <TokenId>'kill-test',
                state:         TokenState.ACTIVE,
                timestamp:     <UnixTimestamp>0,
                data:          "kill",
                last_mismatch: true,
            },
            "kill-data",
            {
                id:            <TokenId>'kill-test',
                state:         TokenState.DEAD,
                timestamp:     expected_ts,
                data:          "kill-data",
                last_mismatch: true,
            },
        ],
    ] ).forEach( ( [ method, token, data, expected ] ) => describe( `#${method}`, () =>
    {
        const doc_id = <DocumentId>1234;
        const ns     = <TokenNamespace>'update-ns';

        it( "changes token state", () =>
        {
            const dao = new class implements TokenDao
            {
                getToken()
                {
                    return Promise.reject( "unused method" );
                }

                updateToken(
                    given_doc_id:   DocumentId,
                    given_ns:       TokenNamespace,
                    given_token_id: TokenId,
                    given_type:     TokenState,
                    given_data:     string | null,
                )
                {
                    expect( given_doc_id ).to.equal( doc_id );
                    expect( given_ns ).to.equal( ns );
                    expect( given_token_id ).to.equal( token.id );
                    expect( given_type ).to.equal( expected.state );
                    expect( given_data ).to.equal( data );

                    return Promise.resolve( {
                        id: token.id,
                        status: {
                            // purposefully hard-coded, since this is ignored
                            type: TokenState.ACTIVE,

                            timestamp: expected_ts,
                            data:      given_data,
                        },

                        prev_status: null,
                        prev_last:   null,
                    } );
                }
            }();

            // this discards some type information for the sake of dynamic
            // dispatch, so it's not testing the state transition
            // restrictions that are enforced by the compiler
            return expect(
                new Sut( dao, doc_id, ns, voidIdgen )[ method ](
                    <any>token, data
                )
            ).to.eventually.deep.equal( expected );
        } );
    } ) );
} );
