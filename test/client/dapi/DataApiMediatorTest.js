/**
 * Tests DataApiMediator
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

'use strict';

const { expect } = require( 'chai' );

const {
    client: { dapi: { DataApiMediator: Sut } },
    dapi:   { MissingDataError },
} = require( '../../../' );


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
            const sut = Sut( ui, {}, {}, getQuote ).monitor( dapi_manager );

            dapi_manager.emit( 'updateFieldData', '', 0, {}, {} );
        } );

        [
            {
                label:    "keeps existing value if in result set (first index)",
                name:     'foo',
                index:    0,
                value:    { foo: [ "first", "second" ] },
                expected: {
                    foo:   [ "first" ],
                    dest1: [ "src1data" ],
                    dest2: [ "src2data" ],
                },

                val_label: [
                    { value: "first result",  label: "first" },
                ],

                results: {
                    first:  { src1: "src1data", src2: "src2data" },
                    second: {},
                },

                expansion: [ {
                    dest1: [ "src1data" ],
                    dest2: [ "src2data" ],
                } ],
            },
            {
                label:    "keeps existing value if in result set (second index)",
                name:     'bar',
                index:    1,
                value:    { bar: [ "first", "second" ] },
                expected: {
                    bar:   [ , "second" ],
                    dest1: [ , "src1data_2" ],
                    dest2: [ , "src2data_2" ],
                },

                val_label: [
                    { value: "first result",  label: "first" },
                    { value: "second result", label: "second" },
                ],

                results: {
                    first:  {},
                    second: { src1: "src1data_2", src2: "src2data_2" },
                },

                expansion: [ , {
                    dest1: [ , "src1data_2" ],
                    dest2: [ , "src2data_2" ],
                } ],
            },
            {
                label:    "keeps existing value if in result set (all indexes)",
                name:     'bar',
                index:    -1,
                value:    { bar: [ "first", "second" ] },
                expected: {
                    bar: [ "first", "second" ],
                    dest1: [ "src1data", "src1data_2" ],
                    dest2: [ "src2data", "src2data_2" ],
                },

                val_label: [
                    { value: "first result",  label: "first" },
                    { value: "second result", label: "second" },
                ],

                results: {
                    first:  { src1: "src1data", src2: "src2data" },
                    second: { src1: "src1data_2", src2: "src2data_2" },
                },

                expansion: [
                    {
                        dest1: [ "src1data" ],
                        dest2: [ "src2data" ],
                    },
                    {
                        dest1: [ , "src1data_2" ],
                        dest2: [ , "src2data_2" ],
                    },
                ],
            },

            {
                label:    "uses first value of result if existing not in result set (first index)",
                name:     'foo',
                index:    0,
                value:    { foo: [ "does not", "exist" ] },
                expected: {
                    foo:   [ "first result" ],
                    desta: [ "src1data" ],
                    destb: [ "src2data" ],
                },

                val_label: [
                    { value: "first result",  label: "first" },
                    { value: "second result", label: "second" },
                ],

                results: {
                    first:  { src1: "src1data", src2: "src2data" },
                    second: {},
                },

                expansion: [ {
                    desta: [ "src1data" ],
                    destb: [ "src2data" ],
                } ],
            },
            {
                label:    "uses first value of result if existing not in result set (second index)",
                name:     'foo',
                index:    1,
                value:    { foo: [ "does not", "exist" ] },
                expected: {
                    foo:   [ , "first result" ],
                    desta: [ , "src1data" ],
                    destb: [ , "src2data" ],
                },

                val_label: [
                    { value: "first result",  label: "first" },
                    { value: "second result", label: "second" },
                ],

                results: {
                    first:  { src1: "src1data", src2: "src2data" },
                    second: {},
                },

                expansion: [ , {
                    desta: [ , "src1data" ],
                    destb: [ , "src2data" ],
                } ],
            },
            {
                label:    "uses first value of result if existing not in result set (all indexes)",
                name:     'foo',
                index:    -1,
                value:    { foo: [ "does not", "exist" ] },
                expected: {
                    foo:   [ "first result", "first result" ],
                    desta: [ "src1data", "src1data" ],
                    destb: [ "src1data", "src2data" ],
                },

                val_label: [
                    { value: "first result",  label: "first" },
                    { value: "second result", label: "second" },
                ],

                results: {
                    first:  { src1: "src1data", src2: "src2data" },
                    second: {},
                },

                expansion: [
                    {
                        desta: [ "src1data" ],
                        destb: [ "src1data" ],
                    },
                    {
                        desta: [ , "src1data" ],
                        destb: [ , "src2data" ],
                    },
                ],
            },

            {
                label:    "uses empty string if empty result set (first index)",
                name:     'foo',
                index:    0,
                value:    { foo: [ "foo" ] },
                expected: {
                    foo:   [ "" ],
                    dest1: [ "" ],
                },

                val_label: [],
                results:   {},
                expansion: [ {
                    dest1: [ "" ],
                } ],
            },
            {
                label:    "uses empty string if empty result set (second index)",
                name:     'foo',
                index:    1,
                value:    { foo: [ "foo", "bar" ] },
                expected: {
                    foo:   [ , "" ],
                    dest1: [ , "" ],
                },

                val_label: [],
                results:   {},
                expansion: [ , {
                    dest1: [ , "" ],
                } ],
            },
            {
                label:    "uses empty string if empty result set (all indexes)",
                name:     'foo',
                index:    -1,
                value:    { foo: [ "foo", "bar" ] },
                expected: {
                    foo:   [ "", "" ],
                    dest1: [ "", "" ],
                    dest2: [ "", "" ],
                },

                val_label: [],
                results:   {},
                expansion: [
                    {
                        dest1: [ "" ],
                        dest2: [ "" ],
                    },
                    {
                        dest1: [ , "" ],
                        dest2: [ , "" ],
                    },
                ],
            },

            {
                label:    "does not auto-expand into non-empty fields",
                name:     'foo',
                index:    0,
                value:    {
                    foo:   [ "first", "second" ],
                    label: [ "populated label" ],   // exception to the rule
                    dest1: [ "leave alone" ],
                    dest2: [ "" ],
                },
                expected: {
                    foo:   [ "first" ],

                    // labels should _always_ be populated, since they're
                    // considered to be part of the actual value, not a
                    // user-modifiable destination field
                    label: [ "first label" ],

                    // dest1 missing because it is already populated
                    dest2: [ "src2data" ],
                },

                val_label: [
                    {
                        value:    "first result",
                        label:    "first label",
                        label_id: 'label',
                    },
                ],

                results: {
                    first:  { src1: "src1data", src2: "src2data" },
                    second: {},
                },

                expansion: [ {
                    dest1: [ "src1data" ],
                    dest2: [ "src2data" ],
                    label: [ "first label" ],
                } ],
            }
        ].forEach( ( {
            label, name, index, value, expected, val_label, results, expansion
        } ) =>
        {
            it( label, done =>
            {
                let set_options   = false;
                let stack_cleared = false;

                const quote = {
                    getDataByName( given_name )
                    {
                        return value[ given_name ];
                    },

                    setData( given_data )
                    {
                        // we should have allowed the stack to clear first
                        expect( stack_cleared ).to.be.true;

                        expect( given_data ).to.deep.equal( expected );

                        // should have called setOptions by now
                        expect( set_options ).to.be.true;

                        done();
                    },
                };

                const getQuote = () => quote;

                const dapi_manager = createStubDapiManager( expansion );

                // this isn't a valid map, but comparing the objects will
                // ensure that the map is actually used
                const dapimap = { foo: {}, bar: {} };

                dapi_manager.getDataExpansion = (
                    given_name, given_index, given_quote, given_map,
                    predictive, diff
                ) =>
                {
                    expect( given_name ).to.equal( name );
                    expect( given_quote ).to.equal( quote );
                    expect( given_map ).to.deep.equal( dapimap );
                    expect( predictive ).to.be.false;
                    expect( diff ).to.deep.equal( {} );

                    return expansion[ given_index ];
                };

                const field_groups = {
                    [name]: {
                        setOptions( given_name, given_index, given_data, given_cur )
                        {
                            expect( stack_cleared ).to.be.true;

                            // index is implicitly tested by the given_cur line
                            expect( given_name ).to.equal( name );
                            expect( given_data ).to.deep.equal( val_label );
                            expect( given_cur ).to.equal( value[ given_name ][ given_index ] );

                            set_options = true;
                        },
                    },
                };

                const ui = createStubUi( field_groups );

                const sut = Sut( ui, {}, { [name]: dapimap }, getQuote )
                    .monitor( dapi_manager );

                dapi_manager.emit(
                    'updateFieldData', name, index, val_label, results
                );

                // #setData should be triggered after the stack clears to
                // #mitigate issues with hooks causing too much / infinite
                // #recursion on the bucket on the same stack
                stack_cleared = true;
            } );
        } );


        it( 'does not perform expansion if data are not available', done =>
        {
            const dapi_manager = createStubDapiManager();

            dapi_manager.getDataExpansion = () =>
            {
                throw MissingDataError(
                    'this should happen, but should be caught'
                );
            };

            const name  = 'foo';
            const value = 'bar';

            const getQuote = () => ( {
                getDataByName: () => [ value ],
                setData( given_data )
                {
                    // only the value should be set with no expansion data
                    expect( given_data ).to.deep.equal( {
                        [name]: [ value ],
                    } );

                    done();
                },
            } );

            const field_groups = { [name]: { setOptions() {} } };

            const ui  = createStubUi( field_groups );
            const sut = Sut( ui, {}, {}, getQuote ).monitor( dapi_manager );

            const val_label = [
                { value: value, label: "bar" },
            ];

            dapi_manager.emit( 'updateFieldData', name, 0, val_label, {} );
        } );
    } );


    describe( "on clearFieldData event", () =>
    {
        it( "ignores unknown fields", () =>
        {
            const dapi_manager = createStubDapiManager();

            const field_groups = {};    // no groups

            const ui  = createStubUi( field_groups );
            const sut = Sut( ui, {}, {} ).monitor( dapi_manager );

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
            const sut = Sut( ui, {}, {} ).monitor( dapi_manager );

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
            const sut = Sut( ui, data_validator, {} ).monitor( dapi_manager );

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
