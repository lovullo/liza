/**
 * Test case for GeneralStepUi
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

var Sut     = require( '../../../' ).ui.step.GeneralStepUi,
    expect  = require( 'chai' ).expect,
    sinon   = require( 'sinon' ),
    Class   = require( 'easejs' ).Class;


describe( 'ui.GeneralStepUi', function()
{
    describe( 'on answer data change', function()
    {
        it( 'will attempt pre-style with formatter', function( done )
        {
            var orig_data = {
                    foo: [ "orig" ],
                },
                fmt_data  = {
                    foo: [ "formatted" ],
                };

            var formatter = createFormatter(),
                mock_fmt  = sinon.mock( formatter );

            mock_fmt.expects( 'format' )
                .once()
                .withExactArgs( orig_data )
                .returns( fmt_data );

            createSut( formatter, createElementStyler( function( name, value )
            {
                // by the time the answer data makes its way to the
                // element styler, it should have already been
                // formatted
                expect( name ).to.equal( 'foo' );
                expect( value ).to.equal( fmt_data.foo[ 0 ] );

                mock_fmt.verify();
                done();
            } ) ).answerDataUpdate( orig_data );
        } );

        it( 'group will style answers when feature flag is on', function( done )
        {
            const data = { foo: [ 'bar' ] };
            const formatter = createFormatter( data, data );
            const feature_flag = createFeatureFlag( true );
            const group = createGroupUi();

            let group_set_value_calls = 0;
            let answer_field_name_calls = 0;
            let async_flag = false;
            const field_name = 'foo_d1022e47903';

            const styler = createElementStyler( function(){} );
            styler.styleAnswer = ( name ) => {
                done( new Error( 'ElementStyler should not be called with feature flag on' ) );
            };

            group.setValueByName = ( name, index, value, change_event ) =>
            {
                group_set_value_calls++;

                if ( async_flag )
                {
                    // value is set w/answer ref
                    expect( name ).to.equal( field_name );
                    expect( value ).to.equal( 'bar' );
                    expect( index ).to.equal( 0 );
                    expect( group_set_value_calls ).to.equal( 1 );
                    expect( answer_field_name_calls ).to.equal( 1 );
                    done();
                }
            }

            const sut = createSut( formatter, styler, {}, group, feature_flag );
            sut.getAnswerFieldName = ( name ) =>
            {
                answer_field_name_calls++;
                return field_name;
            };

            sut.getElementGroup = ( name ) =>
            {
                expect( name ).to.equal( field_name );
                return group;
            };

            sut.answerDataUpdate( data );
            async_flag = true;
        } );
    } );


    describe( '#scrollTo', function()
    {
        [
            {
                field:  '',
                index:  0,
                cause: 'foocause',
            },
            {
                field:  undefined,
                index:  0,
                cause: 'foocause2',
            },
            {
                field:  '',
                index:  0,
                cause: '',
            },
            {
                field:  '',
                index:  0,
                cause:  undefined,
            },
            {
                field:  'foo',
                index:  -1,
                cause:  undefined,
            },
            {
                field:  'foo',
                index:  undefined,
                cause:  undefined,
            },
            {
                field:  'foo',
                index:  undefined,
                cause:  'index cause',
            },
        ].forEach( function( args, i )
        {
            it( 'emits error given invalid field (' + i + ')', function( done )
            {
                var step = {
                    getValidCause: function()
                    {
                        return args.cause;
                    }
                };

                var sut  = createSut( {}, {}, step );

                // should only throw a single error
                sut.once( 'error', function( error )
                {
                    expect( error ).to.be.instanceof( Error );
                    expect( error.message ).to.have.string( 'Could not scroll' );

                    if ( args.cause )
                    {
                        expect( error.message ).to.have.string( 'cause: ' );
                        expect( error.message ).to.have.string( args.cause );
                    }
                    else
                    {
                        expect( error.message ).to.not.have.string( 'cause:' );
                    }

                    done();
                } );

                sut.scrollTo( args.field, args.index, false, args.cause );
            } );
        } );


        it( 'emits error when element is not found', function( done )
        {
            var field = 'foo',
                index = 5;

            var styler = {
                getProperIndex: function()
                {
                },

                getWidgetByName: function()
                {
                    // no element
                    return [];
                },
            };

            var sut = createSut( {}, styler, {} );

            sut.once( 'error', function( error )
            {
                expect( error ).to.be.instanceof( Error );
                expect( error.message ).to.have.string( 'Could not scroll' );
                expect( error.message ).to.have.string( 'could not locate' );

                expect( error.message ).to.have.string(
                    field + '[' + index + ']'
                );

                done();
            } );

            sut.scrollTo( field, index, false, '' );
        } );


        it( 'emits error when element is not visible', function( done )
        {
            var field = 'foo',
                index = 5;

            var styler = {
                getProperIndex: function()
                {
                },

                getWidgetByName: function()
                {
                    // jQuery-ish
                    var element = [ 0 ];

                    element.is = function( selector )
                    {
                        expect( selector ).to.equal( ':visible' );
                        return false;
                    };

                    return element;
                },
            };

            var sut = createSut( {}, styler, {} );

            sut.once( 'error', function( error )
            {
                expect( error ).to.be.instanceof( Error );
                expect( error.message ).to.have.string( 'Could not scroll' );
                expect( error.message ).to.have.string( 'not visible' );

                expect( error.message ).to.have.string(
                    field + '[' + index + ']'
                );

                done();
            } );

            sut.scrollTo( field, index, false, '' );
        } );


        it( 'scrolls to the failed element', function( done )
        {
            var field        = 'foo',
                index        = 5,
                content_html = '<html>something</html>',
                element      = [ 0 ],
                showm        = true,
                message      = 'whatacluster';

            var styler = {
                getProperIndex: function()
                {
                },

                getWidgetByName: function()
                {
                    element.is = function( selector )
                    {
                        expect( selector ).to.equal( ':visible' );
                        return true;
                    };

                    return element;
                },
            };

            var content = {
                parent: function()
                {
                    return {
                        scrollTo: scroll_mock
                    };
                },
            };

            function scroll_mock( given_element, duration, options )
            {
                expect( given_element ).to.equal( element );
                expect( duration ).to.equal( 100 );
                expect( options.offset.top ).to.equal( -150 );

                styler.focus = function( given_element, given_showm, given_msg )
                {
                    expect( given_element ).to.equal( element );
                    expect( given_showm ).to.equal( showm );
                    expect( given_msg ).to.equal( message );

                    done();
                };

                options.onAfter();
            };

            var sut = createSut( {}, styler, {} );

            // XXX: SUT needs refactoring!
            sut.$content = content;

            var result = sut.scrollTo( field, index, true, message );
            expect( result ).to.equal( sut );
        } );
    } );
} );



/**
 * Create new SUT with formatter FORMATTER and generated element
 * styler
 *
 * @param {Object} formatter    validator/formatter mock
 * @param {Object} styler       mock ElementStyler
 * @param {Object} step         mock step
 * @param {Object} group        mocked Group Ui
 * @param {Object} feature_flag mocked feature flag
 *
 * @return {Sut}
 */
function createSut( formatter, styler, step, group, feature_flag )
{

    return Sut.extend(
    {
        // visibility escalation
        'override answerDataUpdate': function( data )
        {
            return this.__super( data );
        },

        'override getAnswerContext': function( name )
        {
            return {};
        },

        'override getAnswerFieldName': function( name ){},
        'override getElementGroup': function( name ){},
    } )(
        step || {},
        styler,
        formatter,
        feature_flag || createFeatureFlag()
    );
}


/**
 * Create mock FeatureFlag
 *
 * @param {boolean} flag_ind
 *
 * @return {Object} FeatureFlag
 */
function createFeatureFlag( flag_ind = false )
{
    return {
        getDomPerfFlag: () => { return !!flag_ind; }
    };
}


/**
 * Create mock GroupUi
 *
 * @return {Object} GroupUi
 */
function createGroupUi()
{
    return {
        setValueByName: ( name, index, value, change_event ) => {}
    };
}


/**
 * Create mock ElementStyler
 *
 * styleAnswer method is defined by STYLE_CALLBACK
 *
 * @param {function(string,*)} style_callback styler styleAnswer method dfn
 *
 * @return {Object} ElementStyler mock
 */
function createElementStyler( style_callback )
{
    return {
        getAnswerElementByName: function()
        {
            // jQuery element
            const $element = [ {
                attributes: [],
            } ];

            $element.length = 1;
            $element.text   = () => {};

            return $element;
        },

        getProperIndex: function()
        {
        },

        getWidgetByName: function()
        {
            return [];
        },

        styleAnswer: style_callback,
    };
}


/**
 * Create mock validator/formatter
 *
 * The only method provided is `format', which contains no definition;
 * it is expected to be mocked by the caller.
 *
 * @param {Object}
 */
function createFormatter( expected, return_data )
{
    return {
        format: function( expected )
        {
            return return_data;
        },
    }
}


function createStep()
{
    return {
        getValidCause: function()
        {
        }
    };
}
