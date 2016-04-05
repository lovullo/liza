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
    function testApplyHidden()
    {
        var element = stubEle( { className: '' } ),
            r1      = stubEle( { className: '' } ),
            r2      = stubEle( { className: '' } ),
            row     = [ r1, r2 ];

        Sut().applyStyle( getStubField( element ), element, row );

        [ element, r1, r2 ].forEach( function( ele )
        {
            expect( ele.className ).to.match( /\bhidden\b/ );
        } );
    }


    function testApplyClear()
    {
        var element = stubEle( { style: 'foo' } ),
            r1      = stubEle( { style: 'foo' } ),
            r2      = stubEle( { style: 'foo' } ),
            row     = [ r1, r2 ];

        Sut().applyStyle( getStubField( element ), element, row );

        [ element, r1, r2 ].forEach( function( ele )
        {
            expect( ele.style ).to.equal( '' );
        } );
    }


    function testRevokeHidden()
    {
        var element = stubEle( { className: 'foo hidden' } ),
            r1      = stubEle( { className: 'foo hidden' } ),
            r2      = stubEle( { className: 'foo hidden' } ),
            row     = [ r1, r2 ];

        Sut().revokeStyle( getStubField( element ), element, row );

        [ element, r1, r2 ].forEach( function( ele )
        {
            expect( ele.className ).to.not.match( /\bhidden\b/ );
            expect( ele.className ).to.match( /foo/ );
        } );
    }


    function testRevokeStyle()
    {
        var element = stubEle( { style: 'foo' } ),
            r1      = stubEle( { style: 'foo' } ),
            r2      = stubEle( { style: 'foo' } ),
            row     = [ r1, r2 ];

        Sut().revokeStyle( getStubField( element ), element, row );

        [ element, r1, r2 ].forEach( function( ele )
        {
            expect( ele.style ).to.equal( 'foo' );
        } );
    }


    describe( '#getId', function()
    {
        it( 'returns unique identifier', function()
        {
            expect( Sut().getId() ).to.equal( 'na' );
        } );
    } );


    describe( '#applyStyle', function()
    {
        it( 'sets hidden class on all elements', testApplyHidden );
        it( 'clears style on all elements', testApplyClear );


        it( 'does not set class on subfield parents', function()
        {
            var element = stubEle( {
                className: '',
                parentElement: {
                    className: 'widget',
                    removeChild: function() {},
                }
            } );

            var r1      = stubEle( { className: '' } ),
                r2      = stubEle( { className: '' } ),
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
            var element = stubEle( {
                style: 'foo',
                parentElement: {
                    className: 'widget',
                    removeChild: function() {},
                }
            } );

            var r1      = stubEle( { style: 'foo' } ),
                r2      = stubEle( { style: 'foo' } ),
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
            var element = stubEle( {
                style: '',
                parentElement: {
                    className: 'widget',
                    removeChild: function( ele )
                    {
                        expect( ele ).to.equal( element );
                        done();
                    },
                }
            } );

            Sut().applyStyle( getStubField( element ), element, [] );
        } );
    } );


    describe( '#revokeStyle', function()
    {
        it( 'removes hidden class on all elements', testRevokeHidden );
        it( 'does not clear style on all elements', testRevokeStyle );


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
            var element = stubEle( {
                className: '',
            } );

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


        describe( '#hideField', function()
        {
            it( 'sets hidden class on all elements', testApplyHidden );
            it( 'clears style on all elements', testApplyClear );
        } );


        describe( '#showField', function()
        {
            it( 'removes hidden class on all elements', testRevokeHidden );
            it( 'does not clear style on all elements', testRevokeStyle );
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


function stubEle( obj )
{
    obj.setAttribute = function( name, value )
    {
        obj[ name ] = value;
    }

    return obj;
}
