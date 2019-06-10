/**
 * Manages DataAPI requests and return data
 *
 *  Copyright (C) 2019 R-T Specialty, LLC.
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

const { Class }  = require( 'easejs' );
const { expect } = require( 'chai' );
const Sut        = require( '../../../' ).server.request.UserSession;


describe( 'UserSession', () =>
{
    [
        {
            session: null,
            expects: {},
        },
        {
            session: "",
            expects: {},
        },
        {
            session: 'foo|s:1:"a";',
            expects: { "foo": "a" },
        },
        {
            session: 'foo|a:1:{i:0;s:1:"a";}',
            expects: { "foo": { "0": "a" } },
        },
        {
            session: 'foo|a:1:{i:0;s:1:"a";}bar|a:1:{s:1:"a";i:1;}',
            expects: { "foo": { "0": "a" }, "bar": { "a": 1 } },
        },
        {
            session: '_sf2_attributes|a:1:{i:0;s:1:"a";}',
            expects: {},
        },
        {
            session: 'foo|a:1:{i:0;s:1:"a";}_sf2_attributes|a:1:{i:0;s:1:"a";}',
            expects: { "foo": { "0": "a" } },
        },
    ].forEach( ( data ) =>
    {
        it( "getData", () =>
        {
            let sut = new Sut(
                1,
                {
                    "get": function( sesion_key, callback )
                    {
                        return callback( data.session );
                    },
                }
            );

            expect(
                sut.getData()
            ).to.deep.equal( data.expects );
        } );
    } );


    [
        {
            session: null,
            expects: false,
        },
        {
            session: "",
            expects: false,
        },
        {
            session: 'foo|s:1:"a";',
            expects: false,
        },
        {
            session: 'agentID|s:0:"";}',
            expects: true,
        },
        {
            session: 'agentID|s:1:"1";}',
            expects: true,
        },
    ].forEach( ( data ) =>
    {
        it( "isLoggedIn", () =>
        {
            let sut = new Sut(
                1,
                {
                    "get": function( sesion_key, callback )
                    {
                        return callback( data.session );
                    },
                }
            );

            expect(
                sut.isLoggedIn()
            ).to.be.equal( data.expects );
        } );
    } );


    [
        {
            session: null,
            expects: undefined,
        },
        {
            session: "",
            expects: undefined,
        },
        {
            session: 'foo|s:1:"a";',
            expects: undefined,
        },
        {
            session: 'agentID|s:0:"";}',
            expects: undefined,
        },
        {
            session: 'agentID|s:1:"1";}',
            expects: "1",
        },
    ].forEach( ( data ) =>
    {
        it( "agentId", () =>
        {
            let sut = new Sut(
                1,
                {
                    "get": function( sesion_key, callback )
                    {
                        return callback( data.session );
                    },
                }
            );

            expect(
                sut.agentId()
            ).to.be.equal( data.expects );
        } );
    } );
} );

