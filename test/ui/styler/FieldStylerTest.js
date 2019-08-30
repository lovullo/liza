/**
 * Test case for FieldStyler
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

const { expect } = require( 'chai' );
const { Class }  = require( 'easejs' );
const styler     = require( '../../../' ).ui.styler;

const Sut = styler.FieldStyler.extend(
{
    getId() {},
    isApplied( field, element ) {},
    applyStyle( field, element, row ) {},
    revokeStyle( field, element, row ) {},
    add( element, cls ) { this.addClass( element, cls ); },
    remove( element, cls ) { this.removeClass( element, cls ); },
} );


describe( 'ui/styler/FieldStyler', () =>
{
    [
        {
            label:    'adds class using #addClass on empty',
            given:    '',
            add:      'foo',
            expected: ' foo',
        },

        {
            label:    'adds class using #addClass with existing',
            given:    'foo bar',
            add:      'baz',
            expected: 'foo bar baz',
        },

        {
            label:    'removes class added by #addClass',
            given:    'cow',
            add:      'moo',
            remove:   'moo',
            expected: 'cow',
        },

        {
            label:    'removes class added by #addClass on empty',
            given:    '',
            add:      'moo',
            remove:   'moo',
            expected: '',
        },

        {
            label:    'removes classes added externally',
            given:    'cow moo',
            remove:   'cow',
            expected: ' moo',
        },

        {
            label:    'removes duplicate classes',
            given:    'moo cow cow and',
            remove:   'cow',
            expected: 'moo and',
        },
    ].forEach( ( { label, given, add, remove, expected } ) =>
    {
        it( label, () =>
        {
            const element = { className: given };
            const sut     = Sut();

            // #addClass and #removeClass respectively
            add && sut.add( element, add )
            remove && sut.remove( element, remove );

            expect( element.className )
                .to.equal( expected );
        } );
    } );
} );
