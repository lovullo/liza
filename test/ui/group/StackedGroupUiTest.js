/**
 * Test case for StackedGroupUi
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

var Sut     = require( '../../../' ).ui.group.StackedGroupUi,
    expect  = require( 'chai' ).expect,
    sinon   = require( 'sinon' ),
    Class   = require( 'easejs' ).Class;


describe( 'ui.group.StackedGroupUi', () =>
{
    describe( '#showField', function()
    {
        [
            {
                field: 'foo_bar',
                index: 0,
            },

            {
                field: 'bar_foo',
                index: 1,
            },
        ].forEach( ( { field, index } ) =>
        {
            it( 'it shows the header for ' + field + ' when group fields are visible', () =>
            {
                const container = createContainer();
                const content   = createContent();

                content.querySelector
                    .withArgs( 'div.stacked-container' )
                    .returns( container );

                const sut = createSut( content, field );

                const removeClass = sinon.stub();

                const header = {
                    classList: {
                        remove: removeClass
                    },
                };

                sut.getCurrentIndex = sinon.stub().returns( 10 );
                sut.hasVisibleField = sinon.stub()
                    .withArgs( index )
                    .returns( true );

                container.querySelectorAll
                    .withArgs( 'dl' )
                    .returns( [ header, header ] );

                const quote = createQuote();

                content.querySelectorAll
                    .withArgs( 'dl' )
                    .returns( [ header, header ] );

                sut.init( quote );
                sut.showField( field, index );

                expect( removeClass.calledOnce ).to.be.true;
            } );
        } );
    } );


    describe( '#hideField', function()
    {
        [
            {
                field: 'foo_baz',
                index: 0,
            },

            {
                field: 'baz_foo',
                index: 1,
            },
        ].forEach( ( { field, index } ) =>
        {
            it( 'it hides the header for ' + field + ' when no group fields are visible', () =>
            {
                const container = createContainer();
                const content   = createContent();

                content.querySelector
                    .withArgs( 'div.stacked-container' )
                    .returns( container );

                const sut = createSut( content, field );

                const addClass = sinon.stub();

                const header = {
                    classList: {
                        add: addClass
                    },
                };

                sut.getCurrentIndex = sinon.stub().returns( 10 );
                sut.hasVisibleField = sinon.stub()
                    .withArgs( index )
                    .returns( false );

                container.querySelectorAll
                    .withArgs( 'dl' )
                    .returns( [ header, header ] );

                const quote = createQuote();

                content.querySelectorAll
                    .withArgs( 'dl' )
                    .returns( [ header, header ] );

                sut.init( quote );
                sut.hideField( field, index );

                expect( addClass.calledOnce ).to.be.true;
            } );
        } );
    } );
} );


/**
 * Create new SUT
 *
 * @param {Object} content mock content
 * @param {string} field   mock field
 *
 * @return {Sut}
 */
function createSut( content, field )
{
    const rcontext = {
        getFieldByName: function(){
            return {
                revokeStyle: function(){},
                applyStyle: function(){},
            }
        },
    };

    const context = {
        createFieldStores: function(){},
        detachStoreContent: function(){},
        show: function(){},
        detachFields: function(){},
        hide: function(){},
    };

    const group = {
        getIndexFieldName: sinon.stub().returns( field ),
        getUserFieldNames: sinon.stub().returns( [ field ] ),
        getExclusiveFieldNames: sinon.stub().returns( [] ),
        getExclusiveCmatchFieldNames: sinon.stub().returns( [] ),
    }

    // Mock jquery content object
    const $content = {};

    $content.hide = sinon.stub();
    $content.find = sinon.stub()
        .returns( { click: sinon.stub() });

    const jquery = sinon.stub();

    jquery.withArgs( content )
        .returns( $content );

    return Sut( group, content, null, jquery, context, rcontext, null );
}


function createContent()
{
    return {
        querySelector: sinon.stub(),
        querySelectorAll: sinon.stub(),
        getAttribute: sinon.stub().returns( null )
    };
}


function createContainer()
{
    const container = {
        querySelectorAll: sinon.stub(),
        querySelector: sinon.stub()
    };

    const dlist = {
        parentNode: { removeChild: function(){ return; } }
    };

    container.querySelector
        .withArgs( 'dl' )
        .returns( dlist );

    return container;
}


function createQuote()
{
    return {
        on: sinon.stub(),
        onClassifyAndNow: sinon.stub()
    };
}

