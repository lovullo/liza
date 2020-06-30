/**
 * Test case for GridGroupUi
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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

const Sut   = require( "../../../src/ui/group/GridGroupUi" );
const sinon = require( 'sinon' );

import { expect } from 'chai';
import { createSut, createQuote, createContent, createBoxContent, createStateManager, createGroup } from "./CommonResources";

before(function () {
    this.jsdom = require( 'jsdom-global' )();
});

after(function () {
    this.jsdom();
});

describe( "GridGroup", () =>
{
    describe ( "gettXType", () =>
    {
        it( "detects x-type for a group", () =>
        {
            const sut = createSut( Sut, { content: createBoxContent() } );

            expect( sut.getXType() ).to.be.null;

            sut.init( createQuote() );
            sut.visit();

            expect( sut.getXType() ).to.equal( "foo" );
        } );
    } );

    describe ( "getCategory", () =>
    {
        it( "detects categories for a group", () =>
        {
            const expected = [ "foo" ];
            const sut = createSut( Sut, { content: createBoxContent() } );

            expect( sut.getCategories() ).to.deep.equal( [] );

            sut.init( createQuote() );
            sut.visit();

            expect( sut.getCategories() ).to.deep.equal( expected );
        } );
    } );

    describe ( "isVisible", () =>
    {
        it( "detects when the group is visible", () =>
        {
            const content = createBoxContent();

            content.classList.contains = sinon.stub().returns( true );

            const sut = createSut( Sut, { content: content } );

            expect( sut.isVisible() ).to.be.false;

            sut.init( createQuote() );
            sut.visit();

            expect( sut.isVisible() ).to.be.true;
        } );

        it( "detects when the group is not visible", () =>
        {
            const sut = createSut( Sut, { content: createBoxContent() } );

            expect( sut.isVisible() ).to.be.false;

            sut.init( createQuote() );
            sut.visit();

            expect( sut.isVisible() ).to.be.false;
        } );
    } );

    describe ( "isSelected", () =>
    {
        it( "detects when the group is selected", () =>
        {
            const content = createBoxContent();

            const sut = createSut( Sut, { content: content } );

            expect( sut.isSelected() ).to.be.false;

            sut.init( createQuote() );
            sut.visit();

            sut.select();

            expect( sut.isSelected() ).to.be.true;
        } );

        it( "detects when the group is deselected", () =>
        {
            const sut = createSut( Sut, { content: createBoxContent() } );

            expect( sut.isSelected() ).to.be.false;

            sut.init( createQuote() );
            sut.visit();

            expect( sut.isSelected() ).to.be.false;
        } );
    } );

    describe ( "visit", () =>
    {
        it( "sets a group to selected based on bucket value", () =>
        {
            const selected_list_key = 'foo';
            const selected_value = 'bar';
            const mock_data = [ selected_value ];

            let get_data_calls = 0;

            const content = createContent();
            const box_content = createContent();
            box_content.querySelector = () => content;

            const quote = createQuote();

            quote.getDataByName = ( name: string ) =>
            {
                get_data_calls++;
                expect( name ).to.equal( selected_list_key );
                return mock_data;
            };

            content.getAttribute
                .withArgs( 'data-selected-list-key' )
                .returns( selected_list_key );

            content.getAttribute
                .withArgs( 'data-selected-value' )
                .returns( selected_value );

            const sut = createSut( Sut, { content: box_content } );

            sut.init( quote );
            sut.visit();

            expect( get_data_calls ).to.equal( 1 );
            expect( sut.isSelected() ).to.be.true;
        } );

        it( "sets a group to deselected if already selected and disabled state is true", () =>
        {
            const selected_current_key = 'cur';
            const selected_list_key = 'foo';
            const selected_value = 'bar';
            const mock_data = [ selected_value ];

            const expected_data = {
                'foo': [ null ],
                'cur': []
            };

            let set_data_calls = 0;

            const group = createGroup( "foo", [], [], false );
            const state_manager = createStateManager();

            const content = createContent();
            const box_content = createContent();
            box_content.querySelector = () => content;

            const quote = createQuote();

            quote.getDataByName
                .withArgs( selected_list_key )
                .returns( mock_data );

            quote.getDataByName
                .withArgs( selected_current_key )
                .returns( mock_data );

            quote.setData = ( data: any ) =>
            {
                set_data_calls++;
                expect( data ).to.deep.equal( expected_data );
            };

            content.getAttribute
                .withArgs( 'data-selected-current-key' )
                .returns( selected_current_key );

            content.getAttribute
                .withArgs( 'data-selected-list-key' )
                .returns( selected_list_key );

            content.getAttribute
                .withArgs( 'data-selected-value' )
                .returns( selected_value );

            // Mock state manager sets disabled state
            state_manager.observes = sinon.stub().returns( true );
            state_manager.is = sinon.stub().returns( true );

            const sut = createSut( Sut,
            {
                content: box_content,
                state_manager: state_manager,
                group: group
            } );

            sut.init( quote );

            // Simulate calling select first
            sut.select();
            sut.visit();

            expect( set_data_calls ).to.equal( 1 );
            expect( sut.isSelected() ).to.be.false;
        } );


        it( "does not set a group to deselected if disabled state is true as an internal user", () =>
        {
            const selected_current_key = 'cur';
            const selected_list_key = 'foo';
            const selected_value = 'bar';
            const mock_data = [ selected_value ];

            const expected_data = {
                'foo': [ null ],
                'cur': []
            };

            let set_data_calls = 0;

            const group = createGroup( "foo", [], [], true );
            const state_manager = createStateManager();

            const content = createContent();
            const box_content = createContent();
            box_content.querySelector = () => content;

            const quote = createQuote();

            quote.getDataByName
                .withArgs( selected_list_key )
                .returns( mock_data );

            quote.getDataByName
                .withArgs( selected_current_key )
                .returns( mock_data );

            quote.setData = ( data: any ) =>
            {
                set_data_calls++;
                expect( data ).to.deep.equal( expected_data );
            };

            content.getAttribute
                .withArgs( 'data-selected-current-key' )
                .returns( selected_current_key );

            content.getAttribute
                .withArgs( 'data-selected-list-key' )
                .returns( selected_list_key );

            content.getAttribute
                .withArgs( 'data-selected-value' )
                .returns( selected_value );

            // Mock state manager sets disabled state
            state_manager.observes = sinon.stub().returns( true );
            state_manager.is = sinon.stub().returns( true );

            const sut = createSut( Sut,
            {
                content: box_content,
                state_manager: state_manager,
                group: group
            } );

            sut.init( quote );

            // Simulate calling select first
            sut.select();
            sut.visit();

            expect( set_data_calls ).to.equal( 0 );
        } );
    } );

    describe ( "select", () =>
    {
        [
            {
                label: "updates bucket data with selected value, multiple selected",
                selected_current_key: 'view',
                selected_list_key: 'name',
                selected_value: 'foo-bar',
                existing_list_value: [ 'baz' ],
                expected_set_data_calls: 1,
                expected_data: {
                    'name': [ 'baz', 'foo-bar', null ],
                    'view': [ 'foo-bar' ]
                },
            },
            {
                label: "updates bucket data with selected value, single selected",
                selected_current_key: 'view',
                selected_list_key: 'name',
                selected_value: 'bar',
                existing_list_value: [ '' ],
                expected_set_data_calls: 1,
                expected_data: {
                    'name': [ 'bar', null ],
                    'view': [ 'bar' ]
                },
            },
            {
                label: "does not update bucket data with missing data attributes",
                selected_current_key: '',
                selected_list_key: '',
                selected_value: '',
                existing_list_value: [ '' ],
                expected_set_data_calls: 0,
                expected_data:  {},
            },
        ].forEach( ( {
            label,
            selected_current_key,
            selected_list_key,
            selected_value,
            existing_list_value,
            expected_data,
            expected_set_data_calls
        } ) =>
        {
            it( label, () =>
            {
                let set_data_calls = 0;

                const content = createContent();
                const box_content = createContent();
                box_content.querySelector = () => content;

                const quote = createQuote();

                content.getAttribute
                    .withArgs( 'data-selected-current-key' )
                    .returns( selected_current_key );

                content.getAttribute
                    .withArgs( 'data-selected-list-key' )
                    .returns( selected_list_key );

                content.getAttribute
                    .withArgs( 'data-selected-value' )
                    .returns( selected_value );

                box_content.classList.contains = sinon.stub().returns( true );

                const sut = createSut( Sut, { content: box_content } );

                sut.init( quote );
                sut.visit();

                quote.setData = ( data: any ) =>
                {
                    set_data_calls++;
                    expect( data ).to.deep.equal( expected_data );
                };

                sut.select( existing_list_value );

                expect( set_data_calls ).to.equal( expected_set_data_calls );
            } );
        } );
    } );


    describe ( "deselect", () =>
    {
        [
            {
                label: "updates bucket data to remove selected value, multiple selected",
                selected_current_key: 'view',
                selected_list_key: 'name',
                selected_value: 'foo-bar',
                existing_current_value: [ 'baz' ],
                existing_list_value: [ 'baz' ],
                expected_set_data_calls: 1,
                expected_data:  {
                    'name': [ 'baz', null ],
                    'view': [ 'baz' ]
                },
            },
            {
                label: "updates bucket data to remove selected value, single selected",
                selected_current_key: 'view',
                selected_list_key: 'name',
                selected_value: 'foo-bar',
                existing_current_value: [ '' ],
                existing_list_value: [ '' ],
                expected_set_data_calls: 1,
                expected_data: {
                    'name': [ null ],
                    'view': [ '' ]
                },
            },
            {
                label: "does not update bucket data with undefined selected values",
                selected_current_key: 'view',
                selected_list_key: 'name',
                selected_value: 'foo-bar',
                existing_current_value: [ '' ],
                existing_list_value: undefined,
                expected_set_data_calls: 0,
                expected_data:  {},
            },
            {
                label: "does not update bucket data with missing data attributes",
                selected_current_key: '',
                selected_list_key: '',
                selected_value: '',
                existing_current_value: [ '' ],
                existing_list_value: [ '' ],
                expected_set_data_calls: 0,
                expected_data:  {},
            },
        ].forEach( ( {
            label,
            selected_current_key,
            selected_list_key,
            selected_value,
            existing_current_value,
            existing_list_value,
            expected_data,
            expected_set_data_calls
        } ) =>
        {
            it( label, () =>
            {
                let set_data_calls = 0;

                const content = createContent();
                const box_content = createContent();
                box_content.querySelector = () => content;

                const quote = createQuote();

                content.getAttribute
                    .withArgs( 'data-selected-current-key' )
                    .returns( selected_current_key );

                content.getAttribute
                    .withArgs( 'data-selected-list-key' )
                    .returns( selected_list_key );

                content.getAttribute
                    .withArgs( 'data-selected-value' )
                    .returns( selected_value );

                const sut = createSut( Sut, { content: box_content } );

                sut.init( quote );
                sut.visit();

                // Simulate calling select first
                sut.select();

                quote.getDataByName
                    .withArgs( selected_current_key )
                    .returns( existing_current_value );

                quote.setData = ( data: any ) =>
                {
                    set_data_calls++;
                    expect( data ).to.deep.equal( expected_data );
                };

                sut.deselect( existing_list_value );

                expect( set_data_calls ).to.equal( expected_set_data_calls );
            } );
        } );
    } );


    describe ( "areDetailsOpen", () =>
    {
        it( "detects when the details pane is open", () =>
        {
            const content = createBoxContent();

            content.classList.contains = sinon.stub().returns( false );

            const sut = createSut( Sut, { content: content } );

            expect( sut.areDetailsOpen() ).to.be.false;

            sut.init( createQuote() );
            sut.visit();

            content.classList.contains = sinon.stub().returns( true );

            expect( sut.areDetailsOpen() ).to.be.true;
        } );

        it( "detects when the group is closed", () =>
        {
            const sut = createSut( Sut, { content: createBoxContent() } );

            expect( sut.areDetailsOpen() ).to.be.false;

            sut.init( createQuote() );
            sut.visit();

            expect( sut.areDetailsOpen() ).to.be.false;
        } );
    } );
} );

