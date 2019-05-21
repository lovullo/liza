/**
 * Tests BaseQuote
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
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

const chai            = require( 'chai' );
const expect          = chai.expect;
const { BaseQuote }   = require( '../../' ).quote;

describe( 'BaseQuote', () =>
{
    describe( 'accessors & mutators', () =>
    {
        [
            {
                property: 'startDate',
                default: 0,
                value: 946684800
            },
            {
                property: 'initialRatedDate',
                default: 0,
                value: 946684800
            },
            {
                property: 'agentId',
                default: 0,
                value: 12345678
            },
            {
                property: 'agentEntityId',
                default: 0,
                value: 12345678
            },
            {
                property: 'agentName',
                default: '',
                value: 'name'
            },
            {
                property: 'imported',
                default: false,
                value: true,
                accessor: 'is'
            },
            {
                property: 'bound',
                default: false,
                value: true,
                accessor: 'is'
            },
            {
                property: 'currentStepId',
                default: 1,
                value: 2
            },
            {
                property: 'topVisitedStepId',
                default: 1,
                value: 2
            },
            {
                property: 'topSavedStepId',
                value: 1
            },
            {
                property: 'error',
                default: '',
                value: 'ERROR'
            }

        ].forEach( testCase =>
        {
            const quote       = BaseQuote( 123, {} );
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

    describe( 'locking mechanisms', () =>
    {
        [
            {
                description: 'default values',
                reason: '',
                step: 0,
                bound: false,
                imported: false,
                locks: false
            },
            {
                description: 'quote with a reason',
                reason: 'reason',
                step: 0,
                bound: false,
                imported: false,
                locks: true
            },
            {
                description: 'quote with a lock on step #2',
                reason: '',
                step: 2,
                bound: false,
                imported: false,
                locks: false
            },
            {
                description: 'quote with a reason and a lock on step #2',
                reason: 'reason',
                step: 2,
                bound: false,
                imported: false,
                locks: false
            },
            {
                description: 'bound quote',
                reason: { given: '', expected: 'Quote has been bound' },
                step: 0,
                bound: true,
                imported: false,
                locks: true
            },
            {
                description: 'imported quote',
                reason: '',
                step: 0,
                bound: false,
                imported: true,
                locks: true
            },
            {
                description: 'bound and imported quote',
                reason: { given: '', expected: 'Quote has been bound' },
                step: 0,
                bound: true,
                imported: true,
                locks: true
            },
            {
                description: 'bound quote with a lock on step #2',
                reason: { given: '', expected: 'Quote has been bound' },
                step: { given: 2, expected: 0 },
                bound: true,
                imported: false,
                locks: true
            },
            {
                description: 'imported quote with a lock on step #2',
                reason: '',
                step: 2,
                bound: false,
                imported: true,
                locks: false
            }

        ].forEach( testCase =>
        {
            const quote       = BaseQuote( 123, {} );
            const description = 'Locking is correct for ' + testCase.description;
            const bound       = !!testCase.bound;
            const imported    = !!testCase.imported;
            const locks       = !!testCase.locks;

            const givenReason = ( testCase.reason.given !== undefined ) ?
                '' + testCase.reason.given :
                '' + testCase.reason;
            const expectedReason = ( testCase.reason.expected !== undefined ) ?
                '' + testCase.reason.expected :
                '' + testCase.reason;

            const givenStep = ( testCase.step.given !== undefined ) ?
                +testCase.step.given :
                +testCase.step;
            const expectedStep = ( testCase.step.expected !== undefined ) ?
                +testCase.step.expected :
                +testCase.step;

            it( description, () =>
            {
                expect( quote.getExplicitLockReason() ).to.equal( '' );
                expect( quote.getExplicitLockStep() ).to.equal( 0 );

                quote.setBound( bound )
                     .setImported( imported )
                     .setExplicitLock( givenReason, givenStep );

                expect( quote.getExplicitLockReason() ).to.equal( expectedReason );
                expect( quote.getExplicitLockStep() ).to.equal( expectedStep );
                expect( quote.isLocked() ).to.equal( locks );

                quote.clearExplicitLock();
                expect( quote.getExplicitLockReason() ).to.equal( bound ? 'Quote has been bound' : '' );
                expect( quote.getExplicitLockStep() ).to.equal( 0 );
            } );
        } );
    } );
} );
