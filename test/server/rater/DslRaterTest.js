/**
 * Tests DslRater
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
const expect = require( 'chai' ).expect;
const Class  = require( 'easejs' ).Class;

const {
    DslRater: Sut,
    DslRaterContext,
} = root.server.rater;

describe( 'DslRater', () =>
{
    describe( 'rate', () =>
    {
        it( `Calls context#rate`, () =>
        {
            let called = false;

            const raters    = [ getRaterStub( ( _, __ ) => {}, [] ), getRaterStub( ( _, __ ) => {}, [] ) ];
            const resultSet = getResultSetStub();
            const override  = {
                'override public rate': function( name, meta, rate, complete )
                {
                    called = true
                }
            };

            const context = getDslContext( override );
            const sut     = Sut( raters, resultSet );

            sut.rate( context );

            expect( called ).to.equal( true );
        } );


        it( `Throws exception on invalid context`, () =>
        {
            const raters    = [ getRaterStub( ( _, __ ) => {}, [] ), getRaterStub( ( _, __ ) => {}, [] ) ];
            const resultSet = getResultSetStub();
            const context   = {};
            const sut       = Sut( raters, resultSet );

            expect( () => { sut.rate( context ) } )
                    .to.throw( "Invalid DslRaterContext provided" );

        } );


        it( `Undefined rater calls context#complete`, () =>
        {
            let called     = false;
            let rateCalled = false;

            const raters    = [ undefined ];
            const resultSet = getResultSetStub();
            const override  = {
                'override public rate': function( name, meta, rate, complete )
                {
                    rateCalled = true
                },

                'override public processCompleted': function( results, count )
                {
                    called = true
                }
            };

            const context = getDslContext( override );
            const sut     = Sut( raters, resultSet );

            sut.rate( context );

            expect( called ).to.equal( true );
            expect( rateCalled ).to.equal( false );
        } );


        it( `Calls rater with canTerm from context`, () =>
        {
            let actual;
            let called = false;

            const expected = false;
            const callback = ( data, canTerm ) =>
            {
                actual = canTerm;
                called = true;
            }

            const classes = {
                '--elig-suppliers-bar': true
            };

            const raters    = [ getRaterStub( callback, classes ) ];
            const resultSet = getResultSetStub();
            const context   = DslRaterContext( null, expected );
            const sut       = Sut( raters, resultSet );

            sut.rate( context );

            expect( called ).to.equal( true );
            expect( actual ).to.equal( expected );
        } );


        it( `Handle undefined classes gracefully`, () =>
        {
            let called = false;

            const callback = ( _, __ ) =>
            {
                called = true;
            }

            const raters    = [ getRaterStub( callback, undefined ) ];
            const resultSet = getResultSetStub();
            const context   = DslRaterContext( null, false );
            const sut       = Sut( raters, resultSet );

            sut.rate( context );

            expect( called ).to.equal( true );
        } );


        it( `Submit sets _unavailable flag`, () =>
        {
            let called = false;
            let actual = {};

            const expected  = {
                _unavailable: '1',
                ineligible:   '',
                submit:       'true',
                __classes: {
                    'submit':     true,
                    'submit-foo': true,
                    '--elig-suppliers-bar': true
                },
            };
            const raterCb   = ( _, __ ) => {};
            const resultCb  = ( name, set ) =>
            {
                actual = name;
                called = true;
            };
            const classes   = {
                'submit-foo': true,
                submit:       true,
                '--elig-suppliers-bar': true
            };
            const raters    = [ getRaterStub( raterCb, classes ) ];
            const resultSet = getResultSetStub( resultCb );
            const context   = DslRaterContext( null, expected );
            const sut       = Sut( raters, resultSet );

            sut.rate( context );

            expect( called ).to.equal( true );
            expect( actual ).to.deep.equal( expected );
        } );


        it( `Prohibit sets _unavailable flag`, () =>
        {
            let called = false;
            let actual = {};

            const expected  = {
                _unavailable: '1',
                ineligible:   'foo prohibit; baz prohibit',
                submit:       '',
                __classes: {
                    'inelig-foo': 'foo prohibit',
                    'inelig-baz': 'baz prohibit',
                    '--elig-suppliers-bar': false
                }
            };
            const raterCb   = ( _, __ ) => {};
            const resultCb  = ( name, set ) =>
            {
                actual = name;
                called = true;
            };

            const classes   = {
                'inelig-foo': 'foo prohibit',
                'inelig-baz': 'baz prohibit',
                '--elig-suppliers-bar': false
            };

            const canTerm   = false;
            const overrides = {};
            const raters    = [ getRaterStub( raterCb, classes ) ];
            const resultSet = getResultSetStub( resultCb );
            const context   = getDslContext( overrides, expected, false );
            const sut       = Sut( raters, resultSet );


            sut.rate( context );

            expect( called ).to.equal( true );
            expect( actual ).to.deep.equal( expected );
        } );


        it( `Assertions sets _unavailable flag`, () =>
        {
            let called = false;
            let actual = {};

            const expected  = {
                _unavailable: '1',
                ineligible:   'foo assertion; baz assertion',
                submit:       '',
                __classes: {
                    '-assert-foo': 'foo assertion',
                    '-assert-bar':  false,
                    '-assert-baz': 'baz assertion',
                    '--elig-suppliers-bar': false
                }
            };
            const raterCb   = ( _, __ ) => {};
            const resultCb  = ( name, set ) =>
            {
                actual = name;
                called = true;
            };

            const classes   = {
                '-assert-foo': 'foo assertion',
                '-assert-bar':  false,
                '-assert-baz': 'baz assertion',
                '--elig-suppliers-bar': false
            };

            const canTerm   = false;
            const overrides = {};
            const raters    = [ getRaterStub( raterCb, classes ) ];
            const resultSet = getResultSetStub( resultCb );
            const context   = getDslContext( overrides, expected, canTerm );
            const sut       = Sut( raters, resultSet );

            sut.rate( context );

            expect( called ).to.equal( true );
            expect( actual ).to.deep.equal( expected );
        } );
    } );


    it( `_unavailable flag defaults to false`, () =>
    {
        let called = false;
        let actual = {};

        const expected  = {
            _unavailable: '0',
            ineligible:   '',
            submit:       '',
            __classes: {
                'foo':    true,
                'submit': false,
                '--elig-suppliers-bar': true
            },
        };
        const raterCb   = ( _, __ ) => {};
        const resultCb  = ( name, set ) =>
        {
            actual = name;
            called = true;
        };
        const classes   = {
            'foo':  true,
            submit: false,
            '--elig-suppliers-bar': true
        };
        const raters    = [ getRaterStub( raterCb, classes ) ];
        const resultSet = getResultSetStub( resultCb );
        const context   = DslRaterContext( null, expected );
        const sut       = Sut( raters, resultSet );

        sut.rate( context );

        expect( called ).to.equal( true );
        expect( actual ).to.deep.equal( expected );
    } );


    it( `--elig-supplier-{supplier} causes ineligibility`, () =>
    {
        let called = false;
        let actual = {};

        const expected  = {
            _unavailable: '1',
            ineligible:   'This supplier is ineligible.',
            submit:       '',
            __classes: {
                '--elig-suppliers-bar': false
            }
        };
        const raterCb   = ( _, __ ) => {};
        const resultCb  = ( name, set ) =>
        {
            actual = name;
            called = true;
        };

        const classes   = {
            '--elig-suppliers-bar': false
        };

        const canTerm   = false;
        const overrides = {};
        const raters    = [ getRaterStub( raterCb, classes ) ];
        const resultSet = getResultSetStub( resultCb );
        const context   = getDslContext( overrides, expected, canTerm );
        const sut       = Sut( raters, resultSet );

        sut.rate( context );

        expect( called ).to.equal( true );
        expect( actual ).to.deep.equal( expected );
    } );

    it( `missing --elig-supplier-{supplier} throws error`, () =>
    {
        let called = false;
        let actual = {};

        const expected  = {
            _unavailable: '1',
            ineligible:   'This supplier is ineligible.',
            submit:       '',
            __classes: {
            }
        };
        const raterCb   = ( _, __ ) => {};
        const resultCb  = ( name, set ) =>
        {
            actual = name;
            called = true;
        };

        const classes   = {
        };

        const canTerm   = false;
        const overrides = {};
        const raters    = [ getRaterStub( raterCb, classes ) ];
        const resultSet = getResultSetStub( resultCb );
        const context   = getDslContext( overrides, expected, canTerm );
        const sut       = Sut( raters, resultSet );

        expect( () => sut.rate( context ) ).to.throw(
            'Missing supplier eligibility field: --elig-suppliers-bar'
        );
    } );


    function getRaterStub( callback, classes )
    {
        let raterStub = ( function()
        {
            var raterStub = function( data, canTerm )
            {
                callback( data, canTerm );

                return {
                    __classes: classes
                };
            }

            raterStub.supplier = 'bar';
            raterStub.rater    = {
                meta: 'foo',
                classify: {
                    desc: classes
                },
            };

            return raterStub;
        } )();

        return raterStub;
    }


    function getResultSetStub( callback = ( _, __ ) => {} )
    {
        return ( str ) => {
            return {
                addResult( name, set ){
                    callback( name, set );
                }
            }
        };
    }


    function getDslContext( override, data, canTerm )
    {
        const ContextCtr = Class( 'DummyDslRaterContext' ).extend(
            DslRaterContext,
            override
        );

        return ContextCtr( data, canTerm );
    }
} );
