/**
 * Tests error context
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

import * as sut from "../../src/error/ContextError";
import { expect } from 'chai';


describe( 'ContextError', () =>
{
    it( "can be created with generic error", () =>
    {
        const context = { foo: "context" };

        expect( sut.context( new Error( "test error" ), context ).context )
            .to.equal( context );
    } );


    it( "provides type predicate for TypeScript", () =>
    {
        const context = { bar: "baz context" };

        // force to Error to discard ContextError type
        const e: Error = sut.context( new Error( "test error" ), context );

        if ( sut.hasContext( e ) )
        {
            // if isChained was properly defined, then outer should now
            // have type ChainedError, and so this should compile
            expect( e.context ).to.equal( context );
        }
        else
        {
            expect.fail();
        }
    } );


    it( "can create typed contexts", () =>
    {
        type FooErrorContext = { foo: string };

        // this is the actual test
        const e: sut.ContextError<FooErrorContext> =
            sut.context( new Error( "test error" ), { foo: "context" } );

        // contravariance check (would fail to compile)
        expect( sut.hasContext( e ) ).to.be.true;
    } );
} );
