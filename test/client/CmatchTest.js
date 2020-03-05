/**
 * Test case for Cmatch
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

const { event }  = require( '../../' ).client;
const { expect } = require( 'chai' );

const Sut = require( '../../src/client/Cmatch' )
    .extend(
{
    'override constructor'( class_matcher, program, client )
    {
        this.__super( class_matcher || {}, program || {}, client || {} );
    },

    // make public
    'override public markShowHide'( field, visq, show, hide )
    {
        return this.__super( field, visq, show, hide );
    },

    // make public
    'override public handleClassMatch'( cmatch, force )
    {
        this.__super( cmatch, force );
    },
} );


// these tests aren't terribly effective right now
describe( "Cmatch", () =>
{
    it( "marks hidden fields on class change to show", () =>
    {
        expect(
            Sut().markShowHide( 'foo', {}, [ 1, 2 ], [] )
        ).to.deep.equal( { foo: { show: [ 1, 2 ] } } );
    } );


    it( "marks shown fields on class change to hide", () =>
    {
        expect(
            Sut().markShowHide( 'foo', {}, [], [ 3, 4, 5 ] )
        ).to.deep.equal( { foo: { hide: [ 3, 4, 5 ] } } );
    } );


    it( "marks combination show/hide on class change", () =>
    {
        expect(
            Sut().markShowHide( 'foo', {}, [ 2, 3 ], [ 4, 5, 6 ] )
        ).to.deep.equal( {
            foo: {
                show: [ 2, 3 ],
                hide: [ 4, 5, 6 ],
            }
        } );
    } );


    it( "marks no fields with no show or hide", () =>
    {
        expect(
            Sut().markShowHide( 'foo', {}, [], [] )
        ).to.deep.equal( {} );
    } );


    it( "does not affect marking of other fields", () =>
    {
        const barval = {};
        const visq   = { bar: barval };

        Sut().markShowHide( 'foo', {}, [ 1 ], [ 0 ] );

        expect( visq.bar ).to.equal( barval );
    } );


    it( "getCmatchFields returns only fields with cmatch data", () =>
    {
        expected_fields = [
            'foo_address',
            'foo_phone'
        ];

        const field_names = [
            'foo_name',
            'foo_id',
            'foo_address',
            'foo_term',
            'foo_date',
            'foo_phone',
            'foo_email',
        ];

        const cmatch = {
            foo_address: { all: true, any: true, indexes: [ 0 ] },
            foo_phone:   { all: true, any: true, indexes: [ 0 ] }
        };

        const program = {
            getClassifierKnownFields() {},
            classify: {
                apply() {},
            }
        };

        const class_matcher  = createStubClassMatcher( cmatch );
        const data_validator = createStubDataValidator();
        const quote          = createStubClientQuote();

        const mock_client = {
            getUi: () => ( {
                setCmatch() {},
                getCurrentStep() { return false; },
            } ),
            getQuote: () => quote
        };

        const sut = Sut( class_matcher, program, mock_client );

        sut.hookClassifier( data_validator );

        quote.emit( "classify", function(){} );

        expect( sut.getCmatchFields( field_names ) )
            .to.deep.equal( expected_fields );
    } );


    /**
     * __classes is always returned (at least at the time of writing) by
     * TAME.  here was a bug when it was recognized as a field (e.g. marked
     * as an `external' in program.xml),
     */
    it( "does not fail when __classes is a known field", () =>
    {
        const cmatch = {
            // populated by TAME, always
            __classes: {},
        };

        const field_names = {
            __classes: true,
        };

        const mock_client = {
            getUi: () => ( {
                setCmatch() {},
                getCurrentStep: () => ( {
                    getStep: () => ( {
                        getExclusiveFieldNames: () => field_names,
                    } )
                } )
            } ),
            getQuote: () => ( {} ),
        };

        Sut( {}, {}, mock_client ).handleClassMatch(
            cmatch, false
        );
    } );
} );



function createStubClientQuote()
{
    const callbacks = {};

    return {
        setClassifier( fields, callback )
        {
            return this;
        },

        on( name, callback )
        {
            callbacks[ name ] = callback;
        },

        emit( name )
        {
            const data = Array.prototype.slice.call( arguments, 1 );

            callbacks[ name ].apply( null, data );
        },
    };
}


function createStubDataValidator()
{
    return {
        validate( undefined, classes )
        {
            return this;
        },

        catch( callback )
        {
            return;
        },
    };
}


function createStubClassMatcher( cmatch )
{
    return {
        match( _, callback )
        {
            callback( cmatch ) ;
        }
    }
}