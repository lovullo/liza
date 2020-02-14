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
            // Stub all objects
            $        = sinon.stub();
            jQuery   = sinon.stub();
            document = sinon.stub();

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

            document.getElementById = sinon.stub();
            document.getElementById.returns( node );

            sut.getWidgetByName( name, index, null, context );

            const actual_id = document.getElementById.getCall(0).args[0];

            expect( actual_id )
                .to.equal( expected_id );
        } );
    } );
} );
