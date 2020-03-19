/**
 * Test case for GroupUi
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

var Sut     = require( '../../../' ).ui.group.GroupUi,
    expect  = require( 'chai' ).expect,
    sinon   = require( 'sinon' ),
    Class   = require( 'easejs' ).Class;


describe( 'ui.group.GroupUi', () =>
{
    describe( '#init', function()
    {
        [
            {
                fields: [ 'foo', 'baz' ],
            },
        ].forEach( ( { fields } ) =>
        {
            it( 'initializes Group Context with exclusive fields', () =>
            {
                let context_called = false;

                const context = {
                    createFieldCache: function()
                    {
                        context_called = true;
                    }
                };

                const group = {
                    getIndexFieldName: sinon.stub().returns( 'foo' ),
                    getUserFieldNames: sinon.stub().returns( fields ),
                    getExclusiveFieldNames: sinon.stub().returns( fields ),
                }

                const content = createContent();
                const $content = {};

                $content.hide = sinon.stub();
                $content.find = sinon.stub()
                    .returns( { click: sinon.stub() });

                const jquery = sinon.stub();

                jquery.withArgs( content )
                    .returns( $content );

                const sut = new Sut(
                    group,
                    content,
                    null,
                    jquery,
                    context,
                    null,
                    null
                );

                const quote = createQuote();
                sut.init( quote );

                expect( context_called ).to.equal( true );
            } );
        } );
    } );
} );


function createContent()
{
    return {
        querySelector: sinon.stub(),
        getAttribute: sinon.stub().returns( null )
    };
}


function createQuote()
{
    return {
        on: sinon.stub(),
        onClassifyAndNow: sinon.stub()
    };
}

