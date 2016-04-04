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

            Sut().applyStyle( getStubField( element ), element, row );

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

            Sut().applyStyle( getStubField( element ), element, row );

            [ element, r1, r2 ].forEach( function( ele )
            {
                expect( ele.style ).to.equal( '' );
            } );
        } );


        it( 'does not set class on subfield parents', function()
        {
            var element = {
                className: '',
                parentElement: {
                    className: 'widget',
                    removeChild: function() {},
                }
            };

            var r1      = { className: '' },
                r2      = { className: '' },
                row     = [ r1, r2 ];

            Sut().applyStyle( getStubField( element ), element, row );

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
                parentElement: {
                    className: 'widget',
                    removeChild: function() {},
                }
            };

            var r1      = { style: 'foo' },
                r2      = { style: 'foo' },
                row     = [ r1, r2 ];

            Sut().applyStyle( getStubField( element ), element, row );

            expect( element.style ).to.equal( '' );

            [ r1, r2 ].forEach( function( ele )
            {
                expect( ele.style ).to.equal( 'foo' );
            } );
        } );


        // f@#(& IE
        it( 'removes subfield from DOM', function( done )
        {
            var element = {
                style: '',
                parentElement: {
                    className: 'widget',
                    removeChild: function( ele )
                    {
                        expect( ele ).to.equal( element );
                        done();
                    },
                }
            };

            Sut().applyStyle( getStubField( element ), element, [] );
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

            Sut().revokeStyle( getStubField( element ), element, row );

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

            Sut().revokeStyle( getStubField( element ), element, row );

            [ element, r1, r2 ].forEach( function( ele )
            {
                expect( ele.style ).to.equal( 'foo' );
            } );
        } );


        it( 'does not remove hidden class on subfield parents', function()
        {
            var element = {
                className: 'foo hidden',
                parentElement: {
                    className: 'widget',
                    appendChild: function() {},
                }
            };

            var r1      = { className: 'foo hidden' },
                r2      = { className: 'foo hidden' },
                row     = [ r1, r2 ];

            Sut().revokeStyle( getStubField( element ), element, row );

            expect( element.className ).to.not.match( /\bhidden\b/ );
            expect( element.className ).to.match( /foo/ );

            [ r1, r2 ].forEach( function( ele )
            {
                expect( ele.className ).to.equal( 'foo hidden' );
            } );
        } );


        // we eventually need to care about where it's re-attached
        it( 're-attaches subfield to DOM', function( done )
        {
            var element = {
                className: '',
                parentElement: {
                    className: 'widget',
                    appendChild: function( ele )
                    {
                        expect( ele ).to.equal( element );
                        done();
                    },
                }
            };

            Sut().revokeStyle( getStubField( element ), element, [] );
        } );
    } );


    describe( '#isApplied', function()
    {
        it( 'recognizes when applied', function()
        {
            var element = {
                className: '',
            };

            var sut   = Sut(),
                field = getStubField( element );

            sut.applyStyle( field, element, [] );

            expect( sut.isApplied( field, element ) )
                .to.be.true;

            sut.revokeStyle( field, element, [] );

            expect( sut.isApplied( field, element ) )
                .to.be.false;
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
                    parentElement: {
                        className: 'widget',
                        removeChild: function() {},
                    }
                };

                expect( protSut().protIsSubField( getStubField( element ) ) )
                    .to.be.true;
            } );


            it( 'missing parent widget class is non-subfield', function()
            {
                var element = {
                    className: '',
                };

                expect( protSut().protIsSubField( getStubField( element ) ) )
                    .to.be.false;
            } );
        } );
    } );
} );


function getStubField( element )
{
    return {
        getParent: function()
        {
            return element.parentElement;
        }
    };
}


function protSut()
{
    return Class.extend( Sut, {
        protIsSubField: function( element )
        {
            return this.isSubField( element );
        }
    } )();
}
