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
        const field_positions = [ 0, 0 ];

        let stubs = <ContextCache>{
            'foo': [ getFieldContextStub( 'foo', 0, false ) ],
            'baz': [ getFieldContextStub( 'baz', 0, false ) ],
        }

        let parser_fields: string[] = [];
        let factory_field_position: number[] = [];

        let foo_position_is_called = false;
        let baz_position_is_called = false;

        const parser = <ContextParser>{
            'parse': ( _element_id: any, __: any ) => {
                parser_fields.push( _element_id );
                return <ContextContent>document.createElement( "dd" );
            },
        };

        const factory = <FieldContextFactory>{
            'create': (
                field: string,
                index: PositiveInteger,
                position: PositiveInteger,
                _:any,
                __:any ) =>
            {
                factory_field_position.push( position );
                return stubs[ field ][ index ];
            },
        };

        stubs[ 'foo' ][ 0 ].getPosition = () =>
        {
            foo_position_is_called = true;
            return <PositiveInteger>0;
        };

        stubs[ 'baz' ][ 0 ].getPosition = () =>
        {
            baz_position_is_called = true;
            return <PositiveInteger>0;
        };

        const sut = new Sut( parser, factory );

        const dummy_content = document.createElement( "dl" );

        sut.createFieldCache( fields, dummy_content );

        expect( parser_fields )
            .to.deep.equal( fields );

        expect( field_positions )
            .to.deep.equal( factory_field_position );

        expect( foo_position_is_called ).to.be.true;
        expect( baz_position_is_called ).to.be.true;
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
            'create': ( _: string, __: any, ___:any, ____:any, _____:any ) => {
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

        const parser = getContextParserStub();

        let detach_is_called = false;
        const stub = getFieldContextStub();
        const factory = getFieldContextFactory( stub );

        stub.detach = () =>
        {
            detach_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldCache( fields, dummy_content );
        sut.detach( 'foo', <PositiveInteger>0 );
        expect( detach_is_called ).to.be.true;
    } );


    it( "does not detach field if field doesn't exist in cache", () =>
    {
        const fields = [ 'foo', 'baz' ];

        const parser = getContextParserStub();

        let detach_is_called = false;

        const stub = getFieldContextStub();
        const factory = getFieldContextFactory( stub );

        stub.detach = () =>
        {
            detach_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldCache( fields, dummy_content );
        sut.detach( 'bar', <PositiveInteger>0 );
        expect( detach_is_called ).to.be.false;
    } );


    it( "attach field supplies previous element to attach to", () =>
    {
        const fields = [ 'moo', 'foo', 'bar', 'baz', 'qux' ];
        let stubs = <ContextCache>{
            'moo': [ getFieldContextStub( 'moo', 0, false ) ],
            'foo': [ getFieldContextStub( 'foo', 1, false ) ],
            'bar': [ getFieldContextStub( 'bar', 2, false ) ],
            'baz': [ getFieldContextStub( 'baz', 3,  true ) ],
            'qux': [ getFieldContextStub( 'qux', 4,  true ) ]
        }

        let attach_is_called = false;
        const parser = getContextParserStub();

        const factory = <FieldContextFactory>{
            'create': ( field: string, __:any, ___:any, ____:any, _____:any ) => {
                return stubs[ field ][ 0 ];
            },
        };

        const baz_content = document.createElement( "div" );
        stubs[ 'baz' ][ 0 ].getFirstOfContentSet = () =>
        {
            return baz_content;
        };

        stubs[ 'foo' ][ 0 ].attach = (
            to: ContextContent,
            next_element: NullableContextContent
        ) =>
        {
            expect( to ).to.equal( dummy_content );
            // it should be attaching to baz which is the next attached element
            expect( next_element ).to.equal( baz_content );
            attach_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldCache( fields, dummy_content );
        sut.attach( 'foo', <PositiveInteger>0, dummy_content );
        expect( attach_is_called ).to.be.true;
    } );


    it( "attach field creates new FieldContext when not created yet for a new index", () =>
    {
        const fields = [ 'foo', 'bar', 'baz' ];

        // Simulate that "bar" with index 1 is attached
        // but currently does not exist in context cache
        // No other fields exist yet for that index
        let stubs = <ContextCache>{
            'foo': [ getFieldContextStub( 'foo', 0, false ) ],
            'bar': [
                getFieldContextStub( 'bar', 1, false ),
                getFieldContextStub( 'bar', 1, false )
            ],
            'baz': [ getFieldContextStub( 'baz', 2,  true ) ],
        }

        let attach_is_called = false;
        let get_clone_is_called = false;
        let get_sibling_clone_is_called = false;
        let get_position_is_called = false;

        const parser = getContextParserStub();

        const factory = <FieldContextFactory>{
            create: ( field: string, index: PositiveInteger, ___:any, ____:any, _____:any ) => {
                return stubs[ field ][ index ];
            },
        };

        stubs[ 'bar' ][ 1 ].attach = (
            to: ContextContent,
            next_element: NullableContextContent
        ) =>
        {
            expect( to ).to.equal( dummy_content );
            // There is no next element with index 1
            expect( next_element ).to.equal( null );
            attach_is_called = true;
        };

        stubs[ 'bar' ][ 0 ].getContentClone = () =>
        {
            get_clone_is_called = true;
            return document.createElement( "dd" );
        };

        stubs[ 'bar' ][ 0 ].getSiblingContentClone = () =>
        {
            get_sibling_clone_is_called = true;
            return document.createElement( "dd" );
        };

        stubs[ 'bar' ][ 0 ].getPosition = () =>
        {
            get_position_is_called = true;
            return <PositiveInteger>1;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldCache( fields, dummy_content );

        sut.attach( 'bar', <PositiveInteger>1, dummy_content );

        expect( attach_is_called ).to.be.true;
        expect( get_clone_is_called ).to.be.true;
        expect( get_sibling_clone_is_called ).to.be.true;
        expect( get_position_is_called ).to.be.true;
    } );


    it( "does not attach field if field doesn't exist in cache", () =>
    {
        const fields = [ 'foo', 'baz' ];

        const parser = getContextParserStub();

        let attach_is_called = false;

        const stub = getFieldContextStub();
        const factory = getFieldContextFactory( stub );

        stub.attach = ( _:any, __:any ) =>
        {
            attach_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldCache( fields, dummy_content );

        sut.detach( 'bar', <PositiveInteger>0 );

        expect( attach_is_called ).to.be.false;
    } );


    [
        {
            label: 'setOptions sets options when field is cached',
            fields: [ 'foo', 'bar' ],
            field_to_set: 'bar',
            call_expected: true
        },
        {
            label: 'setOptions sets options when field is cached',
            fields: [ 'foo', 'bar' ],
            field_to_set: 'baz',
            call_expected: false
        },
    ].forEach( ( { label, fields, field_to_set, call_expected } ) => {
    it( label, () =>
    {
        const stub_options = [ { value: 'foo', label: 'foo', label_id: 'foo' } ];
        const stub_value = 'bar';

        const parser = getContextParserStub();
        const stub = getFieldContextStub();

        const factory = <FieldContextFactory>{
            create: ( _: string, __: any, ___:any, ____:any, _____:any ) => {
                return stub;
            },
        };

        let set_options_is_called = false;
        stub.setOptions = ( options :any, value :any ) =>
        {
            expect( options ).to.equal( stub_options );
            expect( value ).to.equal( stub_value );
            set_options_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldCache( fields, dummy_content );
        sut.setOptions( field_to_set, <PositiveInteger>0, stub_options, stub_value );
        expect( set_options_is_called ).to.equal( call_expected );
        } );
    } );

} );


function getContextParserStub()
{
    return <ContextParser>{
        'parse': ( _: any, __: any ) => {
            return <ContextContent>document.createElement("dd");
        },
    };
}


function getFieldContextFactory( stub: FieldContext )
{
    return <FieldContextFactory>{
        'create': ( _: any, __:any, ___:any, ____:any, _____:any ) => {
            return stub;
        },
    };
}

function getFieldContextStub(
    name: string = '',
    position = 0,
    is_attached = false
)
{
    return <FieldContext>{
        'getName': () => { return name },
        'setSiblingContent': () => {},
        'getContentClone': () => {},
        'getSiblingContentClone': () => {},
        'getPosition': () => { return position; },
        'isAttached': () => { return is_attached; },
        'getFirstOfContentSet': () => {}
    };
}