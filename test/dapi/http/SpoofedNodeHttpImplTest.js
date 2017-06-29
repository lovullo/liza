/**
 * Tests Node-based HTTP client with session spoofing
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

const { expect } = require( 'chai' );
const {
    SpoofedNodeHttpImpl: Sut,
    NodeHttpImpl,
} = require( '../../../' ).dapi.http;


describe( 'SpoofNodeHttpImpl', () =>
{
    it( "adds session headers", done =>
    {
        const user_agent  = 'Agent Foo';
        const forward_for = '::1';
        const sessname    = 'FOOSESSID';
        const sessid      = '12345';

        const protos = {
            http: {
                request( given )
                {
                    expect( given.headers[ 'User-Agent' ] )
                        .to.equal( user_agent );
                    expect( given.headers[ 'X-Forwarded-For' ] )
                        .to.equal( forward_for );

                    expect( given.headers.Cookie )
                        .to.contain( sessname + '=' + sessid );

                    done();
                },
            },
        };

        const url = {
            parse: () => ( {
                protocol: 'http',
            } )
        };

        const session = getStubSession( {
            agent:       user_agent,
            forward_for: forward_for,
            sessname:    sessname,
            sessid:      sessid,
        } );

        const given = NodeHttpImpl.use( Sut( session ) )( protos, url )
              .requestData( '', '', {}, ()=>{} );
    } );
} );


function getStubSession( { agent, forward_for, sessname, sessid } )
{
    return {
        getUserAgent:     () => agent,
        getRemoteAddr:    () => forward_for,
        getSessionIdName: () => sessname,
        getSessionId:     () => sessid,
    };
}
