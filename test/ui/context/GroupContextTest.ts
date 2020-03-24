/**
 * Test case for GroupContext
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

import { ContextCache, GroupContext as Sut } from "../../../src/ui/context/GroupContext";
import { FieldContextFactory } from "../../../src/ui/context/FieldContextFactory";
import { ContextContent, FieldContext, NullableContextContent } from "../../../src/ui/context/FieldContext";
import { ContextParser } from "../../../src/ui/context/ContextParser";
import { PositiveInteger } from "../../../src/numeric";

import { expect } from 'chai';



describe( "GroupContext", () =>
{
    it( "createFieldCache calls parser and field context factory for each field", () =>
    {
        const fields          = [ 'foo', 'baz' ];
        const field_positions = [ 0, 1 ];

        let parser_fields: string[] = [];
        let factory_field_position: number[] = [];

        const parser = <ContextParser>{
            'parse':( _element_id: string, _: any ) => {
                parser_fields.push( _element_id );
                return document.createElement( "dd" );
            },
        };

        const factory = <FieldContextFactory>{
            'create': ( _: string, __: any, position: PositiveInteger ) => {
                factory_field_position.push( position );
                return getFieldContextStub();
            },
        };

        const sut = new Sut( parser, factory );

        const dummy_content = document.createElement( "dl" );

        sut.createFieldCache( fields, dummy_content );

        expect( parser_fields )
            .to.deep.equal( fields );

        expect( factory_field_position )
            .to.deep.equal( field_positions );
    } );


    it( "createFieldCache does not call field factory when parser returns null", () =>
    {
        const fields = [ 'foo', 'baz' ];

        let factory_call_count  = 0;

        const parser = <ContextParser>{
            'parse':( _: any, __: any ) => {
                return null;
            },
        };

        const factory = <FieldContextFactory>{
            'create': ( _: string, __: any, ___:any ) => {
                factory_call_count++;
                return getFieldContextStub();
            },
        };

        const sut = new Sut( parser, factory );

        const dummy_content = document.createElement( "dl" );

        sut.createFieldCache( fields, dummy_content );

        expect( factory_call_count ).to.equal( 0 );
    } );


    it( "detaches field", () =>
    {
        const fields = [ 'foo', 'baz' ];

        const parser = <ContextParser>{
            'parse':( _: any, __: any ) => {
                return document.createElement( "dd" );
            },
        };

        let detach_is_called = false;
        const stub = getFieldContextStub();
        const factory = <FieldContextFactory>{
            'create': ( _: string, __: any, ___:any ) => {
                return stub;
            },
        };

        stub.detach = ( from: ContextContent ) =>
        {
            expect( from ).to.equal( dummy_content );
            detach_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldCache( fields, dummy_content );
        sut.detach( 'foo', dummy_content );
        expect( detach_is_called ).to.be.true;
    } );


    it( "attach field supplies previous element to attach to", () =>
    {
        const fields = [ 'moo', 'foo', 'bar', 'baz', 'qux' ];
        let stubs = <ContextCache>{
            'moo': getFieldContextStub('moo', 0, false ),
            'foo': getFieldContextStub('foo', 1, false ),
            'bar': getFieldContextStub('bar', 2, false ),
            'baz': getFieldContextStub('baz', 3,  true ),
            'qux': getFieldContextStub('qux', 4,  true )
        }

        let attach_is_called = false;
        const parser = <ContextParser>{
            'parse':( _: any, __: any ) => {
                return document.createElement( "dd" );
            },
        };

        const factory = <FieldContextFactory>{
            'create': ( field: string, __: any, ___:any ) => {
                return stubs[ field ];
            },
        };

        const baz_content = document.createElement( "div" );
        stubs[ 'baz' ].getFirstOfContentSet = () =>
        {
            return baz_content;
        };

        stubs[ 'foo' ].attach = (
            to: ContextContent,
            prev_element: NullableContextContent
        ) =>
        {
            expect( to ).to.equal( dummy_content );
            // it should be attaching to baz which is the next attached element
            expect( prev_element ).to.equal( baz_content );
            attach_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldCache( fields, dummy_content );
        sut.attach( 'foo', dummy_content );
        expect( attach_is_called ).to.be.true;
    } );


} );


function getFieldContextStub(
    name: string = '',
    position = 0,
    is_attached = false
)
{
    return <FieldContext>{
        'getName': () => { return name },
        'setSiblingContent': () => {},
        'getSiblingContent': () => {},
        'getPosition': () => { return position; },
        'isAttached': () => { return is_attached; },
        'getFirstOfContentSet': () => {}
    };
}