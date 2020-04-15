/**
 * Tests ServerSideQuote
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

'use strict';

const root   = require( '../../..' );
const Sut    = require( '../../..' ).server.quote.ServerSideQuote;
const expect = require( 'chai' ).expect;
const sinon  = require( 'sinon' );

const {
    QuoteDataBucket,
} = root.bucket;

describe( 'ServerSideQuote', () =>
{
    describe( 'accessors & mutators', () =>
    {
        [
            {
                property: 'startDate',
                default:  0,
                value:    946684800
            },
            {
                property: 'initialRatedDate',
                default:  0,
                value:    946684800
            },
            {
                property: 'agentId',
                default:  0,
                value:    12345678
            },
            {
                property: 'agentEntityId',
                default:  0,
                value:    12345678
            },
            {
                property: 'agentName',
                default:  '',
                value:    'name'
            },
            {
                property: 'imported',
                default:  false,
                value:    true,
                accessor: 'is'
            },
            {
                property: 'bound',
                default:  false,
                value:    true,
                accessor: 'is'
            },
            {
                property: 'currentStepId',
                default:  1,
                value:    2
            },
            {
                property: 'topVisitedStepId',
                default:  1,
                value:    2
            },
            {
                property: 'topSavedStepId',
                value:    1
            },
            {
                property: 'error',
                default:  '',
                value:    'ERROR'
            },
            {
                property: 'programVersion',
                default:  '',
                value:    '1.0.0'
            },
            {
                property: 'creditScoreRef',
                default:  0,
                value:    800
            },
            {
                property: 'lastPremiumDate',
                default:  0,
                value:    946684800
            },
            {
                property: 'ratedDate',
                default:  0,
                value:    946684800
            },
            {
                property: 'rateBucket',
                default:  null,
                value:    QuoteDataBucket()
            },

        ].forEach( testCase =>
        {
            const quote       = Sut( 123, {} );
            const property    = testCase.property;
            const title_cased = property.charAt( 0 ).toUpperCase() + property.slice( 1 );
            const setter      = ( testCase.mutator || 'set' ) + title_cased;
            const getter      = ( testCase.accessor || 'get' ) + title_cased;

            it( property + ' can be mutated and accessed', () =>
            {
                expect( quote[getter].call( quote ) ).to.equal( testCase.default );
                quote[setter].call( quote, testCase.value );
                expect( quote[getter].call( quote ) ).to.equal( testCase.value );
            } );
        } );
    } );

    describe( 'rating data', () =>
    {
        it( `#setRatingData throws an error if no bucket is set`, () =>
        {
            const data = { foo: 'bar' };
            const sut  = Sut();

            expect( function() { sut.setRatingData( data ); } )
                .to.throw( Error );
        } );

        it( `Bucket values setters/getters work correctly`, () =>
        {
            const data        = { foo: 'bar' };
            let   bucket_data = null;
            const sut         = Sut();
            var   called      = false;

            const bucket = {
                setValues( gdata )
                {
                    expect( gdata ).to.deep.equal( data );

                    bucket_data = gdata;
                    called      = true;
                },

                getData()
                {
                    return bucket_data;
                },
            };

            sut.setRateBucket( bucket );
            sut.setRatingData( data );

            expect( called ).to.equal( true );
        } );
    } );
} );
