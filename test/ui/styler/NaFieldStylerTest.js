/**
 * Test case for NaFieldStyler
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

var styler  = require( '../../../' ).ui.styler,
    expect  = require( 'chai' ).expect,
    Class   = require( 'easejs' ).Class,
    Sut     = styler.NaFieldStyler;


describe( 'ui.styler.NaFieldStyler', function()
{
    describe( '#getId', function()
    {
        it( 'returns unique identifier', function()
        {
            expect( Sut().getId() ).to.equal( 'na' );
        } );
    } );


    describe( '#applyStyle', function()
    {
        it( 'sets hidden class on all elements', function()
        {
            var element = { className: '' },
                r1      = { className: '' },
                r2      = { className: '' },
                row     = [ r1, r2 ];

            Sut().applyStyle( {}, element, row );

            [ element, r1, r2 ].forEach( function( ele )
            {
                expect( ele.className ).to.match( /\bhidden\b/ );
            } );
        } );


        it( 'clears style on all elements', function()
        {
            var element = { style: 'foo' },
                r1      = { style: 'foo' },
                r2      = { style: 'foo' },
                row     = [ r1, r2 ];

            Sut().applyStyle( {}, element, row );

            [ element, r1, r2 ].forEach( function( ele )
            {
                expect( ele.style ).to.equal( '' );
            } );
        } );
    } );


    describe( '#revokeStyle', function()
    {
        it( 'removes hidden class on all elements', function()
        {
            var element = { className: 'foo hidden' },
                r1      = { className: 'foo hidden' },
                r2      = { className: 'foo hidden' },
                row     = [ r1, r2 ];

            Sut().revokeStyle( {}, element, row );

            [ element, r1, r2 ].forEach( function( ele )
            {
                expect( ele.className ).to.not.match( /\bhidden\b/ );
                expect( ele.className ).to.match( /foo/ );
            } );
        } );


        it( 'does not clear style on all elements', function()
        {
            var element = { style: 'foo' },
                r1      = { style: 'foo' },
                r2      = { style: 'foo' },
                row     = [ r1, r2 ];

            Sut().revokeStyle( {}, element, row );

            [ element, r1, r2 ].forEach( function( ele )
            {
                expect( ele.style ).to.equal( 'foo' );
            } );
        } );
    } );
} );
