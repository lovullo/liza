/**
 * Test case for FieldVisibilityEventHandler
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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

const event  = require( '../../' ).client.event;
const expect = require( 'chai' ).expect;
const Class  = require( 'easejs' ).Class;

const {
    FieldVisibilityEventHandler: Sut,
    UnknownEventError
} = event;


describe( 'FieldVisibilityEventHandler', () =>
{
    it( 'shows/hides each element index', done =>
    {
        const name   = 'field_name';
        const shown  = { [name]: [] };
        const hidden = { [name]: [] };

        const sut = Sut(
            createMockStepUi(
                name,
                ( field, index ) => shown[ field ].push( index ),
                ( field, index ) => hidden[ field ].push( index )
            ),
            createStubDataProvider()
        );

        // purposefully sparse indexes
        const show_indexes   = [ 2, 4, ];
        const hide_indexes = [ 0, 3, ];

        const show_data = {
            elementName: name,
            indexes:     show_indexes,
        };

        const hide_data = {
            elementName: name,
            indexes:     hide_indexes,
        };

        sut.handle( 'show', () =>
        {
            // implicitly ensures proper name is passed
            expect( shown[ name ] ).to.deep.equal( show_indexes );

            sut.handle( 'hide', () =>
            {
                expect( hidden[ name ] ).to.deep.equal( hide_indexes );
                done();
            }, hide_data );
        }, show_data );
    } );


    it( 'throws error given unknown event', () =>
    {
        expect( () =>
        {
            Sut( createMockStepUi() ).handle( 'unknown', () => {}, {} );
        } ).to.throw( UnknownEventError );
    } );


    it( 'ignores unknown groups', done =>
    {
        expect( () =>
        {
            Sut( {
                getCurrentStep: () => ( { getElementGroup: () => null } )
            } ).handle( 'hide', done, {} )
        } ).to.not.throw( Error );
    } );


    it( 'clears failures on hidden fields', done =>
    {
        const name         = 'foo_bar';
        const fail_indexes = [ 0, 3 ];

        const hide_data = {
            elementName: name,
            indexes:     fail_indexes,
        };

        Sut(
            createMockStepUi( name, () => {}, () => {} ),
            createStubDataProvider( failures =>
            {
                expect( failures )
                    .to.deep.equal( { [name]: fail_indexes } );

                // we don't care about the rest of the processing at this
                // point
                done();
            } )
        ).handle( 'hide', () => {}, hide_data );
    } );
} );


function createMockStepUi( expected_name, showf, hidef )
{
    return {
        getCurrentStep: () => ( {
            getElementGroup( field_name )
            {
                expect( field_name ).to.equal( expected_name );

                return {
                    showField: showf,
                    hideField: hidef,
                };
            }
        } ),
    };
}


function createStubDataProvider( fail_callback )
{
    return {
        clearFailures: fail_callback || () => {},
    };
}
