/**
 * Tests DelayedStagingBucket
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

const { expect } = require( 'chai' );

const {
    DelayedStagingBucket: Sut,
    DelayedRecursionError,
} = require( '../../' ).bucket;


describe( "DelayedStagingBucket", () =>
{
    it( "sets values after stack clears", done =>
    {
        const name  = 'foo';
        const value = [ 'value' ];

        // see end of this test
        let ready = false;

        const bucket = {
            on() {},

            setValues( given_data )
            {
                // set at the end of the test to ensure that this is
                // done asynchronously
                expect( ready ).to.be.true;

                expect( given_data ).to.deep.equal( { [name]: value } );

                done();
            },

            getData: () => ( {} ),
        };

        // queue set (should not yet call bucket#setValues)
        const sut = Sut( bucket ).setValues( { [name]: value } );

        // to write to the underlying bucket, we need to commit, but we
        // have to do so after the async code runs (we should convert
        // the SUT to a trait and avoid this madness)
        setTimeout( () => sut.commit(), 0 );

        // we're ready for the set to happen (once the stack clears)
        ready = true;
    } );


    describe( "#getDataByName", () =>
    {
        [
            {
                label:     'processes immediately retrieving modified key',
                name:      'foo',
                get_name:  'foo',
                immediate: true,
            },
            {
                label:     'does not processes immediately retrieving unmodified key',
                name:      'foo',
                get_name:  'bar',
                immediate: false,
            },
        ].forEach( ( { label, name, get_name, immediate } ) =>
        {
            it( label, () =>
            {
                const value = [ 'getDataByName value' ];

                let called_set = false;

                const bucket = {
                    on() {},

                    setValues( given_data )
                    {
                        called_set = ( given_data[ name ] !== undefined );
                    },

                    getData: () => ( {} ),
                };

                // queue set (should not yet call bucket#setValues)
                const sut = Sut( bucket ).setValues( { [name]: value } );

                // force processing of data by requesting same value (note that
                // commit is necessary since the SUT extends StagingBucket)
                sut.getDataByName( get_name );
                sut.commit();

                expect( called_set ).to.equal( immediate );
            } );
        } );


        // Invoking processValues() writes to the underlying bucket which
        // may cause hooks to be invoked, which in turn may cause the
        // DelayedStagingBucket to be referenced, which would lead to
        // infinite recursion.  This doesn't solve that problem, but it does
        // provide a useful error in case it happens, and preempts the
        // wasteful recursion which will exhaust the stack.
        [
            {
                n:    1,
                fail: false,
            },
            {
                n:    3,
                fail: false,
            },
            {
                n:    5,
                fail: true,
            },
            {
                n:    7,
                fail: true,
            },
        ].forEach( ( { n, fail } ) =>
        {
            it( `throws error on deeply recursive processValues (n=${n})`, () =>
            {
                const name  = 'recursive';
                const value = [ 'getDataByName value' ];

                let called_set = false;

                const bucket = {
                    on() {},
                    setValues( given_data ) {},
                    getData: () => ( {} ),
                };

                // queue set (should not yet call bucket#setValues)
                const sut = Sut( bucket ).setValues( { [name]: value } );

                let calln = 0;

                // this hook will trigger the recursion (the set is required
                // to start another timer; see #processValues)
                sut.on( 'preStagingUpdate', () =>
                {
                    // stop recursing at our goal
                    if ( calln++ === n )
                    {
                        return;
                    }

                    sut.setValues( { [name]: value } )
                        .getDataByName( name )
                } );

                // force processing of data by requesting same value
                if ( fail )
                {
                    expect( () => sut.getDataByName( name ) )
                        .to.throw( DelayedRecursionError );
                }
                else
                {
                    expect( () => sut.getDataByName( name ) )
                        .to.not.throw( Error );
                }
            } );
        } );
    } );
} );

