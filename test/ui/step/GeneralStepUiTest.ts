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

import { GeneralStepUi as Sut } from "../../../src/ui/step/GeneralStepUi";
import { GroupUi } from "../../../src/ui/group/GroupUi";

var expect  = require( 'chai' ).expect,
    sinon   = require( 'sinon' );

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

            createSut( formatter, createElementStyler( function( name: any, value: any )
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


        [
            {
                label: 'group will style answer when feature flag is on',
                field_refs: [ 'foo_d1022e47903' ],
                data: { foo: [ 'bar' ] },
                expected_names: [ 'foo_d1022e47903' ],
                expected_indexes: [ 0 ],
                expected_values: [ 'bar' ],
                expected_calls: 1
            },
            {
                label: 'group will style multiple answers when feature flag is on',
                field_refs: [ 'foo_d1022e47903', 'foo_d222222222' ],
                data: { foo: [ 'bar' ] },
                expected_names: [ 'foo_d1022e47903', 'foo_d222222222' ],
                expected_indexes: [ 0, 0 ],
                expected_values: [ 'bar', 'bar' ],
                expected_calls: 2
            },
        ].forEach( ( {
            label,
            field_refs,
            data,
            expected_names,
            expected_indexes,
            expected_values,
            expected_calls }
        ) => {
            it( label, function( done )
            {
                const formatter = createFormatter( data );
                const feature_flag = createFeatureFlag( true );
                const group = createGroupUi();

                let group_set_value_calls   = 0;
                let given_values: string[]  = [];
                let given_names: string[]   = [];
                let given_indexes: number[] = [];
                let answer_field_ref_calls  = 0;
                let async_flag              = false;

                const styler = createElementStyler( function(){} );
                styler.styleAnswer = ( _: any ) => {
                    done( new Error( 'ElementStyler should not be called with feature flag on' ) );
                };

                group.setValueByName = ( name, index, value, _ ) =>
                {
                    group_set_value_calls++;
                    given_values.push( value );
                    given_names.push( name );
                    given_indexes.push( index );

                    if ( async_flag && group_set_value_calls === expected_calls )
                    {
                        // value is set w/answer ref
                        expect( given_names ).to.deep.equal( expected_names );
                        expect( given_indexes ).to.deep.equal( expected_indexes );
                        expect( given_values ).to.deep.equal( expected_values );
                        expect( answer_field_ref_calls ).to.equal( 1 );
                        done();
                    }

                    return group;
                }

                const sut = createSut( formatter, styler, {}, group, feature_flag );
                sut.getAnswerFieldRefs = ( _ ) =>
                {
                    answer_field_ref_calls++;
                    return field_refs;
                };

                let get_group_call_count = 0;
                sut.getElementGroup = ( name ) =>
                {
                    expect( name ).to.equal( field_refs[ get_group_call_count ] );
                    get_group_call_count++;
                    return group;
                };

                sut.answerDataUpdate( data );
                async_flag = true;
            } );
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

                sut.scrollTo( <string>args.field, <number>args.index, false, <string>args.cause );
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
                    var element = {
                        is: ( selector: string ) =>
                        {
                            expect( selector ).to.equal( ':visible' );
                            return false;
                        }
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
                showm        = true,
                message      = 'whatacluster',
                element      = {
                    0: {
                        attributes: [],
                    },
                    is: ( selector: any ) =>
                    {
                        expect( selector ).to.equal( ':visible' );
                        return true;
                    }
                };

            var styler = {
                getProperIndex:  () => {},
                getWidgetByName: () => element,
                focus:           ( _: any, __: any, ___: any ) => {},
            };

            var content = {
                parent: function()
                {
                    return {
                        scrollTo: scroll_mock
                    };
                },
            };

            function scroll_mock( given_element: any, duration: any, options: any )
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
function createSut(
    formatter:     any,
    styler:        any,
    step?:         any,
    _group?:       any,
    feature_flag?: any,
): Sut
{
    const sut = new Sut(
        step || {},
        styler,
        formatter,
        feature_flag || createFeatureFlag(),
        undefined
    );

    // sut.answerDataUpdate   = ( data ) => { return sut.__super( data ) };
    sut.getAnswerContext   = ( _ ) => { return {} };
    sut.getAnswerFieldRefs = ( _ ) => { return [] };
    sut.getElementGroup    = ( _ ) => <GroupUi>{};

    return sut;
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
function createGroupUi(): GroupUi
{
    return <GroupUi>{
        setValueByName: ( _: any, __: any, ___: any, ____: any ) => {}
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
function createElementStyler( style_callback: any )
{
    return {
        getAnswerElementByName: function()
        {
            // jQuery element
            const $element = {
                0: {
                    attributes: [],
                },
                length: 1,
                text:   () => {},
            };

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
function createFormatter( return_data?: any ): any
{
    return {
        format: function( _: any )
        {
            return return_data;
        },
    }
}

