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


        it( 'does not set class on subfield parents', function()
        {
            var element = {
                className: '',
                parentElement: { className: 'widget' }
            };

            var r1      = { className: '' },
                r2      = { className: '' },
                row     = [ r1, r2 ];

            Sut().applyStyle( {}, element, row );

            expect( element.className ).to.match( /\bhidden\b/ );

            [ r1, r2 ].forEach( function( ele )
            {
                expect( ele.className ).to.equal( '' );
            } );
        } );


        it( 'does not clears style subfield parents', function()
        {
            var element = {
                style: 'foo',
                parentElement: { className: 'widget' }
            };

            var r1      = { style: 'foo' },
                r2      = { style: 'foo' },
                row     = [ r1, r2 ];

            Sut().applyStyle( {}, element, row );

            expect( element.style ).to.equal( '' );

            [ r1, r2 ].forEach( function( ele )
            {
                expect( ele.style ).to.equal( 'foo' );
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


        it( 'does not remove hidden class on subfield parents', function()
        {
            var element = {
                className: 'foo hidden',
                parentElement: { className: 'widget' }
            };

            var r1      = { className: 'foo hidden' },
                r2      = { className: 'foo hidden' },
                row     = [ r1, r2 ];

            Sut().revokeStyle( {}, element, row );

            expect( element.className ).to.not.match( /\bhidden\b/ );
            expect( element.className ).to.match( /foo/ );

            [ r1, r2 ].forEach( function( ele )
            {
                expect( ele.className ).to.equal( 'foo hidden' );
            } );
        } );
    } );


    describe( 'protected API', function()
    {
        describe( '#isSubField', function()
        {
            it( 'recognizes parent widget class as subfield', function()
            {
                var element = {
                    className: '',
                    parentElement: { className: 'widget' }
                };

                expect( protSut().protIsSubField( element ) )
                    .to.be.true;
            } );


            it( 'missing parent widget class is non-subfield', function()
            {
                var element = {
                    className: '',
                };

                expect( protSut().protIsSubField( element ) )
                    .to.be.false;
            } );
        } );
    } );
} );


function protSut()
{
    return Class.extend( Sut, {
        protIsSubField: function( element )
        {
            return this.isSubField( element );
        }
    } )();
}
