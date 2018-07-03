/**
 * Tests DataApiMediator
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
const Sut        = require( '../../../' ).client.dapi.DataApiMediator;


describe( "DataApiMediator", () =>
{
    it( "returns self on #monitor", () =>
    {
        const dapi_manager = createStubDapiManager();
        const sut          = Sut( {}, {}, {} );

        expect( sut.monitor( dapi_manager ) ).to.equal( sut );
    } );


    describe( "updateFieldData event", () =>
    {
        it( "ignores unknown fields", () =>
        {
            const dapi_manager = createStubDapiManager();

            const getQuote = () => ( {
                getDataByName: () => {},
                setDataByName: () => {},
            } );

            const ui  = createStubUi( {} );   // no field groups
            const sut = Sut( ui, {}, getQuote ).monitor( dapi_manager );

            dapi_manager.emit( 'updateFieldData', '', 0, {}, {} );
        } );

        [
            {
                label:    "keeps existing value if in result set (first index)",
                name:     'foo',
                index:    0,
                value:    [ "first", "second" ],
                expected: [ "first" ],

                val_label: [
                    { value: "first result",  label: "first" },
                ],

                results: { first: {}, second: {} },
            },
            {
                label:    "keeps existing value if in result set (second index)",
                name:     'bar',
                index:    1,
                value:    [ "first", "second" ],
                expected: [ , "second" ],

                val_label: [
                    { value: "first result",  label: "first" },
                    { value: "second result", label: "second" },
                ],

                results: { first: {}, second: {} },
            },
            {
                label:    "keeps existing value if in result set (all indexes)",
                name:     'bar',
                index:    -1,
                value:    [ "first", "second" ],
                expected: [ "first", "second" ],

                val_label: [
                    { value: "first result",  label: "first" },
                    { value: "second result", label: "second" },
                ],

                results: { first: {}, second: {} },
            },

            {
                label:    "uses first value of result if existing not in result set (first index)",
                name:     'foo',
                index:    0,
                value:    [ "does not", "exist" ],
                expected: [ "first result" ],

                val_label: [
                    { value: "first result",  label: "first" },
                    { value: "second result", label: "second" },
                ],

                results: {},
            },
            {
                label:    "uses first value of result if existing not in result set (second index)",
                name:     'foo',
                index:    1,
                value:    [ "does not", "exist" ],
                expected: [ , "first result" ],

                val_label: [
                    { value: "first result",  label: "first" },
                    { value: "second result", label: "second" },
                ],

                results: {},
            },
            {
                label:    "uses first value of result if existing not in result set (all indexes)",
                name:     'foo',
                index:    -1,
                value:    [ "does not", "exist" ],
                expected: [ "first result", "first result" ],

                val_label: [
                    { value: "first result",  label: "first" },
                    { value: "second result", label: "second" },
                ],

                results: {},
            },

            {
                label:    "uses empty string if empty result set (first index)",
                name:     'foo',
                index:    0,
                value:    [ "foo" ],
                expected: [ "" ],

                val_label: [],
                results:   {},
            },
            {
                label:    "uses empty string if empty result set (second index)",
                name:     'foo',
                index:    1,
                value:    [ "foo", "bar" ],
                expected: [ , "" ],

                val_label: [],
                results:   {},
            },
            {
                label:    "uses empty string if empty result set (all indexes)",
                name:     'foo',
                index:    -1,
                value:    [ "foo", "bar" ],
                expected: [ "", "" ],

                val_label: [],
                results:   {},
            },
        ].forEach( ( { label, name, index, value, expected, val_label, results }, i ) =>
        {
            it( label, done =>
            {
                let set_options = false;

                const getQuote = () => ( {
                    getDataByName( given_name )
                    {
                        expect( given_name ).to.equal( name );
                        return value;
                    },

                    setDataByName( given_name, given_data )
                    {
                        expect( given_name ).to.equal( name );
                        expect( given_data ).to.deep.equal( expected );

                        // should have called setOptions by now
                        expect( set_options ).to.be.true;

                        done();
                    },
                } );

                const dapi_manager = createStubDapiManager();

                const field_groups = {
                    [name]: {
                        setOptions( given_name, given_index, given_data, given_cur )
                        {
                            // index is implicitly tested by the given_cur line
                            expect( given_name ).to.equal( name );
                            expect( given_data ).to.deep.equal( val_label );
                            expect( given_cur ).to.equal( value[ given_index ] );

                            set_options = true;
                        },
                    },
                };

                const ui  = createStubUi( field_groups );
                const sut = Sut( ui, {}, getQuote ).monitor( dapi_manager );

                dapi_manager.emit(
                    'updateFieldData', name, index, val_label, results
                );
            } );
        } );
    } );


    describe( "on clearFieldData event", () =>
    {
        it( "ignores unknown fields", () =>
        {
            const dapi_manager = createStubDapiManager();

            const field_groups = {};    // no groups

            const ui  = createStubUi( field_groups );
            const sut = Sut( ui ).monitor( dapi_manager );

            dapi_manager.emit( 'clearFieldData', 'unknown', 0 );
        } );

        it( "clears field", done =>
        {
            const dapi_manager = createStubDapiManager();

            const name  = 'foo';
            const index = 3;

            const field_groups = {
                [name]: {
                    clearOptions( given_name, given_index )
                    {
                        expect( given_name ).to.equal( name );
                        expect( given_index ).to.equal( index );

                        done();
                    },
                },
            };

            const ui  = createStubUi( field_groups );
            const sut = Sut( ui ).monitor( dapi_manager );

            dapi_manager.emit( 'clearFieldData', name, index );
        } );
    } );


    describe( "on fieldLoaded event", () =>
    {
        it( "clears failures for field", done =>
        {
            const dapi_manager = createStubDapiManager();

            const name  = 'bar';
            const index = 2;

            const data_validator = {
                clearFailures( data )
                {
                    expect( data[ name ] ).to.deep.equal( [ index ] );
                    done();
                },
            };

            const ui  = {};    // unused by this event
            const sut = Sut( ui, data_validator ).monitor( dapi_manager );

            dapi_manager.emit( 'fieldLoaded', name, index );
        } );
    } );
} );


function createStubDapiManager()
{
    const callbacks = {};

    return {
        on( name, callback )
        {
            callbacks[ name ] = callback;
        },

        emit( name )
        {
            // we don't support rest yet in our version of node
            const data = Array.prototype.slice.call( arguments, 1 );

            callbacks[ name ].apply( null, data );
        },
    };
}


function createStubUi( field_groups )
{
    return {
        getCurrentStep: () => ( {
            getElementGroup: name => field_groups[ name ]
        } )
    };
}
