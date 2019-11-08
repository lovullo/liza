/**
 * Tests MongoServerDao
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

'use strict';

const chai                 = require( 'chai' );
const expect               = chai.expect;
const { MongoServerDao: Sut } = require( '../../../' ).server.db;


describe( 'MongoServerDao', () =>
{
    describe( '#saveQuote', () =>
    {
        describe( "with no save data or push data", () =>
        {
            it( "saves entire metabucket record individually", done =>
            {
                const metadata = {
                    foo: [ 'bar', 'baz' ],
                    bar: [ { quux: 'quuux' } ],
                };

                const quote = createStubQuote( metadata );

                const sut = Sut( createMockDb(
                    // update
                    ( selector, data ) =>
                    {
                        expect( data.$set[ 'meta.foo' ] )
                            .to.deep.equal( metadata.foo );

                        expect( data.$set[ 'meta.bar' ] )
                            .to.deep.equal( metadata.bar );


                        expect( data.$push ).to.equal( undefined );

                        done();
                    }
                ) );

                sut.init( () =>
                    sut.saveQuote( quote, () => {}, () => {} )
                );
            } );
        } );

        describe( "with push data", () =>
        {
            it( "adds push data to the collection", done =>
            {
                const push_data = {
                    foo: [ 'bar', 'baz' ],
                    bar: [ { quux: 'quuux' } ],
                };

                const quote = createStubQuote( {} );

                const sut = Sut( createMockDb(
                    // update
                    ( selector, data ) =>
                    {
                        expect( data.$push[ 'foo' ] )
                            .to.deep.equal( push_data.foo );

                        expect( data.$push[ 'bar' ] )
                            .to.deep.equal( push_data.bar );

                        done();
                    }
                ) );

                sut.init( () =>
                    sut.saveQuote(
                        quote,
                        () => {},
                        () => {},
                        undefined,
                        push_data
                    )
                );
            } );

            it( "skips push data when it is an empty object", done =>
            {
                const push_data = {};

                const quote = createStubQuote( {} );

                const sut = Sut( createMockDb(
                    // update
                    ( selector, data ) =>
                    {
                        expect( data.$push ).to.equal( undefined );

                        done();
                    }
                ) );

                sut.init( () =>
                    sut.saveQuote(
                        quote,
                        () => {},
                        () => {},
                        undefined,
                        push_data
                    )
                );
            } );
        } );
    } );
} );


function createMockDb( on_update )
{
    const collection_quotes = {
        update: on_update,
        createIndex: ( _, __, c ) => c(),
    };

    const collection_seq = {
        find( _, __, c )
        {
            c( null, {
                toArray: c => c( null, { length: 5 } ),
            } );
        },
    };

    const db = {
        collection( id, c )
        {
            const coll = ( id === 'quotes' )
                ? collection_quotes
                : collection_seq;

            c( null, coll );
        },
    };

    const driver = {
        open: c => c( null, db ),
        on:   () => {},
    };

    return driver;
}


function createStubQuote( metadata )
{
    return {
        getBucket: () => ( {
            getData: () => {},
        } ),

        getMetabucket: () => ( {
            getData: () => metadata,
        } ),

        getId:                 () => 1,
        getProgramVersion:     () => 0,
        getLastPremiumDate:    () => 0,
        getRatedDate:          () => 0,
        getExplicitLockReason: () => "",
        getExplicitLockStep:   () => 0,
        isImported:            () => false,
        isBound:               () => false,
    };
}
