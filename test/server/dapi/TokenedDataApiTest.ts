/**
 * Test DataAPI backed by tokens for logging and precedence
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
 */

import { TokenedDataApi as Sut } from "../../../src/server/dapi/TokenedDataApi";

import { DataApi, DataApiInput, DataApiResult } from "../../../src/dapi/DataApi";
import { TokenStore } from "../../../src/server/token/store/TokenStore";
import {
    Token,
    TokenId,
    TokenNamespace,
    TokenState,
    TokenStateDoneable,
} from "../../../src/server/token/Token";
import { hasContext } from "../../../src/error/ContextError";

import { expect } from 'chai';


describe( 'TokenedDataApi', () =>
{
    const expected_ns = 'foo_ns';


    ( <[string, boolean, ( e: NullableError ) => void][]>[
        [
            "creates token and returns data if last_created",
            true,
            e => expect( e ).to.equal( null ),
        ],
        [
            "creates token and does not callback if not last_created",
            false,
            e =>
            {
                expect( e ).to.be.instanceof( Error );

                // this awkwardness can be mitigated in TS 3.7
                // (see https://github.com/microsoft/TypeScript/pull/32695)
                if ( e instanceof Error )
                {
                    expect( e.message ).to.contain( "superceded" );
                    expect( hasContext( e ) ).to.be.true;

                    if ( hasContext( e ) )
                    {
                        expect( e.context.id ).to.equal( expected_ns );
                    }
                }
            },
        ],
    ] ).forEach( ( [ label, last_created, expected_err ] ) => it( label, done =>
    {
        const expected_data = { given: "data" };
        const dapi_ret_data = [ { return: "data" } ];

        const stub_tok: Token<TokenState.ACTIVE> =
            createStubToken( last_created );

        let tok_completed = false;
        let tok_ackd      = false;

        const mock_tstore = new class implements TokenStore
        {
            lookupToken()
            {
                return Promise.reject( Error( "not used" ) );
            }

            createToken()
            {
                return Promise.resolve( stub_tok );
            }

            completeToken(
                given_tok:  Token<TokenStateDoneable>,
                given_data: string,
            )
            {
                expect( given_tok ).to.equal( stub_tok );
                expect( given_data ).to.equal(
                    JSON.stringify( dapi_ret_data )
                );

                const ret = Object.create( stub_tok );
                ret.state = TokenState.DONE;

                tok_completed = true;

                return Promise.resolve( ret );
            }

            acceptToken()
            {
                expect( tok_completed ).to.be.true;
                expect( last_created ).to.be.true;

                tok_ackd = true;
                return Promise.resolve( Object.create( stub_tok ) );
            }

            killToken()
            {
                expect( tok_completed ).to.be.true;
                expect( last_created ).to.be.false;

                tok_ackd = true;
                return Promise.resolve( Object.create( stub_tok ) );
            }
        }();

        const mock_dapi = new class implements DataApi
        {
            request(
                given_data: DataApiInput,
                callback:   NodeCallback<DataApiResult>,
                given_id:   string,
            ): this
            {
                expect( given_data ).to.equal( expected_data );
                expect( given_id ).to.equal( expected_ns );

                callback( null, dapi_ret_data );

                return this;
            }
        };

        const ctor = ( ns:TokenNamespace ) =>
        {
            expect( ns ).to.equal( expected_ns );
            return mock_tstore;
        };

        const callback: NodeCallback<DataApiResult> = ( e, data ) =>
        {
            expect( tok_ackd ).to.be.true;

            expected_err( e );

            expect( data ).to.equal(
                ( last_created ) ? dapi_ret_data : null
            );

            done();
        };

        new Sut( mock_dapi, ctor )
            .request( expected_data, callback, expected_ns );
    } ) );


    it( "propagates dapi request errors", done =>
    {
        const expected_err = Error( "test dapi error" );

        const stub_tok: Token<TokenState.ACTIVE> =
            createStubToken( true );

        const mock_tstore = new class implements TokenStore
        {
            lookupToken()
            {
                return Promise.reject( Error( "not used" ) );
            }

            createToken()
            {
                return Promise.resolve( stub_tok );
            }

            completeToken()
            {
                return Promise.reject( Error( "not used" ) );
            }

            acceptToken()
            {
                return Promise.reject( Error( "not used" ) );
            }

            killToken()
            {
                return Promise.reject( Error( "not used" ) );
            }
        }();

        const mock_dapi = new class implements DataApi
        {
            request(
                _:        any,
                callback: NodeCallback<DataApiResult>,
            )
            {
                callback( expected_err, null );
                return this;
            }
        };

        const callback: NodeCallback<DataApiResult> = ( e, data ) =>
        {
            expect( data ).to.equal( null );
            expect( e ).to.equal( expected_err );

            done();
        };

        new Sut( mock_dapi, () => mock_tstore )
            .request( {}, callback, expected_ns );
    } );
} );


function createStubToken( last_created: boolean ): Token<TokenState.ACTIVE>
{
    return {
        id:            <TokenId>'dummy-id',
        state:         TokenState.ACTIVE,
        timestamp:     <UnixTimestamp>0,
        data:          "",
        last_mismatch: false,
        last_created:  last_created,
    };
}
