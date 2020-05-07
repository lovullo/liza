/**
 * Test case for ElementStyler
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

var Sut     = require( '../../' ).ui.ElementStyler,
    expect  = require( 'chai' ).expect,
    sinon   = require( 'sinon' ),
    Class   = require( 'easejs' ).Class;


describe( 'ui.ElementStyler', () =>
{
    [
        {
            name:            'business_city',
            css_class:       '',
            index:           '0',
            qtypes:          {
                business_city: {
                    type:  'text',
                }
            },
            expected_id:     'q_business_city_0',
        },

        {
            name:            'business_city',
            css_class:       '',
            index:           '1',
            qtypes:          {
                business_city: {
                    type:  'text',
                }
            },
            expected_id:    'q_business_city_1',
        },

        {
            name:            'sgo_foo',
            css_class:       'checkbox',
            index:           '0',
            qtypes:          {
                sgo_foo: {
                    type:  'checkbox',
                }
            },
            expected_id:   'q_sgo_foo_n_0',
        },

        {
            name:            'noyes_foo',
            css_class:       'noyes',
            index:           '0',
            qtypes:          {
                noyes_foo: {
                    type:  'noyes',
                }
            },
            expected_id:   'q_noyes_foo_n_0',
        },

        {
            name:            'noyes_foo',
            css_class:       'noyes',
            index:           '1',
            qtypes:          {
                noyes_foo: {
                    type:  'noyes',
                }
            },
            expected_id:   'q_noyes_foo_y_0',
        },

        {
            name:            'noyes_baz',
            css_class:       'noyes',
            index:           '4',
            qtypes:          {
                noyes_baz: {
                    type:  'noyes',
                }
            },
            expected_id:   'q_noyes_baz_n_2',
        },

        {
            name:            'noyes_baz',
            css_class:       'noyes',
            index:           '5',
            qtypes:          {
                noyes_baz: {
                    type:  'noyes',
                }
            },
            expected_id:   'q_noyes_baz_y_2',
        },
    ].forEach( ( { name, css_class, qtypes, index, expected_id } ) =>
    {
        it( "determines the correct element id for " + name, () =>
        {
            // Stub document and jQuery calls
            $      = sinon.stub();
            jQuery = sinon.stub();

            const document = {
                getElementById: sinon.stub()
            };

            jQuery.withArgs( 'body' ).returns( { context: document } );

            const sut = Sut( jQuery );

            sut.setTypeData( qtypes );

            const node = '<input id="' + expected_id
                + '" class="' + css_class + '" name="' + name
                + '[]" data-field-name="' + name
                + '" data-index="' + index
                + '"></input>';

            const html = '<div class="foo">' + node +  '</div>';

            const context = {
                html: html,
            };

            document.getElementById.returns( node );

            sut.getWidgetByName( name, index, null, context );

            const actual_id = document.getElementById.getCall( 0 ).args[ 0 ];

            expect( actual_id )
                .to.equal( expected_id );
        } );
    } );


    [

        {
            label:        'returns multiple elements when index not defined for',
            name:         'noyes_foo',
            index:        undefined,
            single_index: false,
            qtypes:       {
                noyes_foo: {
                    type:  'noyes',
                }
            },
            expected: [ 'bar', 'foo' ],
        },

        {
            label:        'returns multiple indexes when index is defined and singleIndex is true',
            name:         'noyes_bar',
            index:        '1',
            single_index: true,
            qtypes:       {
                noyes_baz: {
                    type:  'noyes',
                }
            },
            expected: [ 'bar', 'foo' ],
        },

        {
            label:        'returns first element of array when id is not found but index is defined',
            name:         'noyes_baz',
            index:        '0',
            single_index: false,
            qtypes:       {
                noyes_baz: {
                    type:  'noyes',
                }
            },
            expected: 'bar',
        },

        {
            label:        'returns second element of array when id is not found but index is defined',
            name:         'noyes_baz',
            index:        '1',
            single_index: false,
            qtypes:       {
                noyes_baz: {
                    type:  'noyes',
                }
            },
            expected: 'foo',
        },
    ].forEach( ( { label, name, qtypes, index, single_index, expected } ) =>
    {
        it( label + " " + name, () =>
        {
            // Stub document and jQuery calls
            $      = sinon.stub();
            jQuery = sinon.stub();

            const document = {
                getElementById: sinon.stub().returns( null )
            };

            jQuery.withArgs( 'body' ).returns( { context: document } );

            const sut = Sut( jQuery );

            sut.setTypeData( qtypes );

            const stubbedSelectorResults = [ 'bar', 'foo' ];

            const context = {
                singleIndex: single_index,
                querySelectorAll: sinon.stub().returns( stubbedSelectorResults )
            };

            jQuery.withArgs( expected ).returns( expected );

            var results = sut.getWidgetByName( name, index, null, context );

            sinon.assert.calledOnce( context.querySelectorAll );

            expect( results ).to.equal( expected );
        } );
    } );


    it( "displays internal fields if user is internal", () =>
    {
        const content = document.createElement( "dl" );
        content.innerHTML = '<dt id="qlabel_internal_field" class="hidden i">Test Ind</dt>' +
                '<dd id="qcontainer_internal_field" class="hidden i">' +
                '<input type="text" class="hidden i" id="foo_bar_0">' +
            '</dd>';
        const expected_content = '<dl><dt id="qlabel_internal_field" class="i">Test Ind</dt>' +
                '<dd id="qcontainer_internal_field" class="i">' +
                '<input type="text" class="i" id="foo_bar_0">' +
            '</dd></dl>';

        jQuery = sinon.stub();
        jQuery.withArgs( 'body' ).returns( { context: {} } );

        const sut = Sut( jQuery );

        // set to internal
        sut.showInternal();

        sut.apply( content );

        expect( content.outerHTML ).to.equal( expected_content );
    } );

} );

