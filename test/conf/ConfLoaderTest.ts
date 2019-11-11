/**
 * Tests ConfLoader
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

const chai   = require( 'chai' );
const expect = chai.expect;

import { readFile } from "fs";

import { ConfLoader as Sut } from "../../src/conf/ConfLoader";

type FsLike = { readFile: typeof readFile };

const {
    store: {
        MemoryStore: Store,
    },
} = require( '../../' );

chai.use( require( 'chai-as-promised' ) );


describe( 'ConfLoader', () =>
{
    it( "loads Store'd configuration from file", () =>
    {
        const expected_path = "/foo/bar/baz.json";
        const expected_data = '{ "foo": "bar" }';

        const fs = <FsLike>{
            readFile( path: string, encoding: string, callback: any )
            {
                expect( path ).to.equal( expected_path );
                expect( encoding ).to.equal( 'utf8' );

                callback( null, expected_data );
            },
        };

        return expect(
            new Sut( fs, Store )
                .fromFile( expected_path )
                .then( conf => conf.get( 'foo' ) )
        ).to.eventually.deep.equal( JSON.parse( expected_data ).foo );
    } );


    it( "fails on read error", () =>
    {
        const expected_err = Error( 'rejected' );

        const fs = <FsLike>{
            readFile( _: any, __: any, callback: any )
            {
                callback( expected_err, null );
            },
        };

        return expect( new Sut( fs, Store ).fromFile( '' ) )
            .to.eventually.be.rejectedWith( expected_err );
    } );


    it( "can override #parseConfData for custom parser", () =>
    {
        const result = { foo: {} };
        const input  = "foo";

        const fs = <FsLike>{
            readFile( _: any, __: any, callback: any )
            {
                callback( null, input );
            },
        };

        const sut = new class extends Sut
        {
            parseConfData( given_input: string )
            {
                expect( given_input ).to.equal( input );
                return Promise.resolve( result );
            }
        }( fs, Store );

        return expect(
            sut.fromFile( '' )
                .then( conf => conf.get( 'foo' ) )
        ).to.eventually.equal( result.foo );
    } );


    it( 'rejects promise on parsing error', () =>
    {
        const expected_err = SyntaxError( 'test parsing error' );

        const fs = <FsLike>{
            readFile( _: any, __: any, callback: any )
            {
                // make async so that we clear the stack, and therefore
                // try/catch
                process.nextTick( () => callback( null, '' ) );
            },
        };

        const sut = new class extends Sut
        {
            parseConfData( _given_input: string ): never
            {
                throw expected_err;
            }
        }( fs, Store );

        return expect( sut.fromFile( '' ) )
            .to.eventually.be.rejectedWith( expected_err );
    } );


    it( "rejects promise on Store ctor error", () =>
    {
        const expected_err = Error( 'test Store ctor error' );

        const fs = <FsLike>{
            readFile: ( _: any, __: any, callback: any ) =>
                callback( null, '' ),
        };

        const badstore = () => { throw expected_err };

        return expect( new Sut( fs, badstore ).fromFile( '' ) )
            .to.eventually.be.rejectedWith( expected_err );
    } );


    it( "rejects promise on bad fs call", () =>
    {
        return expect( new Sut( <FsLike>{}, Store ).fromFile( '' ) )
            .to.eventually.be.rejected;
    } );
} );
