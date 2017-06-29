/**
 * Tests error representing non-200 HTTP status code
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

const { expect } = require( 'chai' );
const Sut = require( '../../../' ).dapi.http.HttpError;

'use strict';


describe( "HttpError", () =>
{
    it( "provides HTTP status code", () =>
    {
        const code = 418;

        expect( Sut( 'message', code ).statuscode )
            .to.equal( code );
    } );


    // just make sure overriding ctor calls parent
    it( "sets message", () =>
    {
        const message = 'foobar';

        expect( Sut( message ).message )
            .to.equal( message );
    } );
} );
