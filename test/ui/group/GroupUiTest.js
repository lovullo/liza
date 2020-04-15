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
                    init: function()
                    {
                        context_called = true;
                    },
                    detachStoreContent: function(){}
                };

                const feature_flag = {
                    getDomPerfFlag: () => { return false; }
                };

                const group = {
                    getIndexFieldName: sinon.stub().returns( 'foo' ),
                    getUserFieldNames: sinon.stub().returns( fields ),
                    getExclusiveFieldNames: sinon.stub().returns( fields ),
                    getExclusiveCmatchFieldNames: sinon.stub().returns( [] ),
                    isInternal: sinon.stub().returns( true ),
                }

                const content = createContent();

                const $content = {};

                $content.hide = sinon.stub();
                $content.find = sinon.stub()
                    .returns( { live: sinon.stub() });

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
                    null,
                    feature_flag
                );

                const quote = createQuote();
                sut.init( quote );

                expect( context_called ).to.equal( true );
            } );
        } );
    } );


    [
        {
            label: 'when feature flag is on, use new GroupContext',
            flag: true,
            show_expected: true,
            revoke_style_expected: false,
            hide_expected: true,
            apply_style_expected: false,
            styler_options_expected: false,
            context_options_expected: true,
            detach_store_content_expected : true,
        },
        {
            label: 'when feature flag is off, use the old styler',
            flag: false,
            show_expected: false,
            revoke_style_expected: true,
            hide_expected: false,
            apply_style_expected: true,
            styler_options_expected: true,
            context_options_expected: false,
            detach_store_content_expected : false,
        },
    ].forEach( ( {
                label,
                flag,
                show_expected,
                revoke_style_expected,
                hide_expected,
                apply_style_expected,
                styler_options_expected,
                context_options_expected,
                detach_store_content_expected
        } ) => {
        it( label, () =>
        {
            const fields = [ 'bar', 'foo', 'baz' ];
            const cmatch_fields = [ 'baz', 'bar' ];
            const field_name = "bar";
            const field_index = 0;
            const group = createGroup( 'foo', fields, cmatch_fields );
            const content = createContent();
            const $content = {};

            $content.hide = sinon.stub();
            $content.find = sinon.stub()
                .returns( { live: sinon.stub() });

            const jquery = sinon.stub();
            jquery.withArgs( content ).returns( $content );

            let show_is_called = false;
            let revoke_style_is_called = false;
            let apply_style_is_called = false;
            let hide_is_called = false;
            let styler_set_options_called = false;
            let context_set_options_called = false;
            let detach_store_content_called = false;

            const feature_flag = {
                getDomPerfFlag: () => { return flag; }
            };

            const styler = {
                setOptions: function(){
                    styler_set_options_called = true;
                    return;
                }
            };

            const rcontext = getRContext();
            const context = getFieldContext();

            context.show = () => { show_is_called = true; };
            context.hide = () => { hide_is_called = true; };
            context.setOptions = () => { context_set_options_called = true; };
            context.detachStoreContent = () => { detach_store_content_called = true; };

            rcontext.getFieldByName = () =>
            {
                return {
                    revokeStyle: function () {
                        revoke_style_is_called = true;
                    },
                    applyStyle: function () {
                        apply_style_is_called = true;
                    },
                }
            };

            const sut = new Sut(
                group,
                content,
                styler,
                jquery,
                context,
                rcontext,
                null,
                feature_flag
            );

            const quote = createQuote();
            sut.init( quote );
            sut.getCurrentIndex = sinon.stub().returns( 10 );

            expect( detach_store_content_called ).to.equal( detach_store_content_expected );

            sut.showField( field_name, field_index );
            expect( revoke_style_is_called ).to.equal( revoke_style_expected );
            expect( show_is_called ).to.equal( show_expected );

            sut.hideField( field_name, field_index );
            expect( apply_style_is_called ).to.equal( apply_style_expected );
            expect( hide_is_called ).to.equal( hide_expected );

            sut.setOptions( field_name, field_index, {}, '' );
            expect( styler_set_options_called ).to.equal( styler_options_expected );
            expect( context_set_options_called ).to.equal( context_options_expected );
        } );
    } );
} );

function getRContext() {
    return {
        getFieldByName: function () {
            return {
                revokeStyle: function () {
                },
                applyStyle: function () {
                },
            }
        },
    };
}


function getFieldContext()
{
    return {
        init: function(){},
        detachStoreContent: function(){},
        show: function(){},
        detachFields: function(){},
        hide: function(){},
        setOptions: function(){},
        detachStoreContent: function(){},
    };
}


function createContent()
{
    return {
        querySelector: sinon.stub(),
        querySelectorAll: sinon.stub(),
        getAttribute: sinon.stub().returns( null )
    };
}


function createGroup(
    field_name = 'foo',
    fields = [],
    cmatch_fields = [],
    is_internal = true
)
{
    const group = {
        getIndexFieldName: sinon.stub().returns( field_name ),
        getUserFieldNames: sinon.stub().returns( fields ),
        getExclusiveFieldNames: sinon.stub().returns( fields ),
        getExclusiveCmatchFieldNames: sinon.stub().returns( cmatch_fields ),
        isInternal: sinon.stub().returns( is_internal ),
    }

    return group;
}



function createQuote()
{
    return {
        on: sinon.stub(),
        onClassifyAndNow: sinon.stub()
    };
}

