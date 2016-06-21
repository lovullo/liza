/**
 * Test case for GeneralStepUi
 *
 *  Copyright (C) 2016 LoVullo Associates, Inc.
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

            createSut( formatter, function( name, value )
            {
                // by the time the answer data makes its way to the
                // element styler, it should have already been
                // formatted
                expect( name ).to.equal( 'foo' );
                expect( value ).to.equal( fmt_data.foo[ 0 ] );

                mock_fmt.verify();
                done();
            } ).answerDataUpdate( orig_data );
        } );
    } );
} );



/**
 * Create new SUT with formatter FORMATTER and generated element
 * styler
 *
 * @param {Object}             formatter      validator/formatter mock
 * @param {function(string,*)} style_callback styler styleAnswer method dfn
 *
 * @return {Sut}
 */
function createSut( formatter, style_callback )
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
    } )(
        {},
        createElementStyler( style_callback ),
        formatter
    );
}


/**
 * Create mock ElementStyler
 *
 * styleAnswer method is defined by STYLE_CALLBACK
 *
 * @return {Object} ElementStyler mock
 */
function createElementStyler( style_callback )
{
    return {
        getAnswerElementByName: function()
        {
            // jQuery element
            return {
                attributes: [],
                length:     1,

                text: function() {},
            }
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
        format: function()
        {
        },
    }
}
