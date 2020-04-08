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

import { ContextCache, ContextStores, GroupContext as Sut } from "../../../src/ui/context/GroupContext";
import { FieldContextFactory } from "../../../src/ui/context/FieldContextFactory";
import { FieldContextStore } from "../../../src/ui/context/FieldContextStore";
import { ContextContent, FieldContext, NullableContextContent } from "../../../src/ui/context/FieldContext";
import { ContextParser } from "../../../src/ui/context/ContextParser";
import { PositiveInteger } from "../../../src/numeric";

import { expect } from 'chai';



describe( "GroupContext", () =>
{
    it( "createFieldStores calls parser and creates a store for each field", () =>
    {
        const fields = [ 'foo', 'baz_subfield' ];

        let stores = <ContextStores>{
            'foo': getFieldContextStoreStub( 0 ),
            'baz_subfield': getFieldContextStoreStub( 0 ),
        }

        let parser_fields: string[] = [];

        let find_sibling_called = false;
        let foo_position_is_called = false;
        let baz_subfield_position_is_called = false;

        const parser = <ContextParser>{
            'parse': ( _element_id: any, __: any ) => {
                parser_fields.push( _element_id );
                return <ContextContent>document.createElement( "dd" );
            },
            'findSiblingContent': ( _: any ) => {
                find_sibling_called = true;
                return <ContextContent>document.createElement("dt");
            },
        };

        const factory = <FieldContextFactory>{
            'create': ( _:any, __:any, ___:any, ____:any ) => {},
            'createStore': ( field: any, __:any, ___:any ) => {
                return stores[ field ];
            }
        };

        stores[ 'foo' ].getPosition = () =>
        {
            foo_position_is_called = true;
            return <PositiveInteger>0;
        };

        stores[ 'baz_subfield' ].isSubField = () =>
        {
            return true;
        };

        stores[ 'baz_subfield' ].getPosition = () =>
        {
            baz_subfield_position_is_called = true;
            return <PositiveInteger>0;
        };

        const sut = new Sut( parser, factory );

        const dummy_content = document.createElement( "dl" );

        sut.createFieldStores( fields, dummy_content );

        expect( parser_fields )
            .to.deep.equal( fields );

        expect( find_sibling_called ).to.be.true;

        expect( foo_position_is_called ).to.be.true;
        expect( baz_subfield_position_is_called ).to.be.false;
    } );


    it( "createFieldStores does not create store when parser returns null", () =>
    {
        const fields = [ 'foo', 'baz' ];

        let factory_call_count  = 0;

        const parser = <ContextParser>{
            'parse':( _: any, __: any ) => {
                return null;
            },
        };

        const factory = <FieldContextFactory>{
            'create': ( _:any, __:any, ___:any, ____:any ) => {},
            'createStore': ( _: any, __:any, ___:any ) => {
                factory_call_count++;
                return getFieldContextStoreStub();
            }
        };

        const sut = new Sut( parser, factory );

        const dummy_content = document.createElement( "dl" );

        sut.createFieldStores( fields, dummy_content );

        expect( factory_call_count ).to.equal( 0 );
    } );


    it( "detach FieldContextStore content", () =>
    {
        const fields        = [ 'foo', 'baz', 'bar' ];
        const cmatch_fields = [ 'foo', 'bar' ];

        let detach_is_called_num_times = 0;

        const parser = getContextParserStub();
        const store = getFieldContextStoreStub();

        const factory = <FieldContextFactory>{
            'create': ( _: string, __: any, ___:any, ____:any ) => {
                return getFieldContextStub();
            },
            'createStore': ( _: any, __:any, ___:any ) => {
                return store;
            }
        };

        store.detach = () =>
        {
            detach_is_called_num_times++;
            return;
        }

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );

        sut.detachStoreContent( cmatch_fields );

        expect( detach_is_called_num_times ).to.equal( cmatch_fields.length );
    } );


    it( "isFieldAttached returns false if field doesn't exist in cache", () =>
    {
        const fields = [ 'foo', 'baz' ];

        const parser = getContextParserStub();

        const stub = getFieldContextStub();
        const factory = getFieldContextFactory( stub );

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );

        const given = sut.isFieldAttached( 'bar', <PositiveInteger>0 );

        expect( given ).to.be.false;
    } );


    it( "isFieldAttached returns true if field in cache is attached", () =>
    {
        const fields = [ 'foo', 'baz' ];

        const parser = getContextParserStub();

        let show_is_called = false;

        const stub = getFieldContextStub();
        const factory = getFieldContextFactory( stub );

        stub.isAttached = ( ) =>
        {
            show_is_called = true;
            return true;
        };

        stub.show = ( _: any, __: any) => { };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );

        sut.show( 'baz', <PositiveInteger>0, dummy_content );

        const given = sut.isFieldAttached( 'baz', <PositiveInteger>0 );

        expect( show_is_called ).to.be.true;
        expect( given ).to.be.true;
    } );


    it( "hides field when the field exists in the cache", () =>
    {
        const fields = [ 'foo', 'baz' ];

        const parser = getContextParserStub();

        let hide_is_called = false;
        const stub = getFieldContextStub();
        const factory = getFieldContextFactory( stub );

        stub.show = ( _: any, __: any) => { };

        stub.hide = () =>
        {
            hide_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );

        // show to put the field in the cache
        sut.show( 'foo', <PositiveInteger>0, dummy_content );

        // now hide
        sut.hide( 'foo', <PositiveInteger>0 );

        expect( hide_is_called ).to.be.true;
    } );


    it( "does not hide field if field doesn't exist in cache", () =>
    {
        const fields = [ 'foo', 'baz' ];

        const parser = getContextParserStub();

        let hide_is_called = false;

        const stub = getFieldContextStub();
        const factory = getFieldContextFactory( stub );

        stub.hide = () =>
        {
            hide_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );

        sut.hide( 'bar', <PositiveInteger>0 );
        expect( hide_is_called ).to.be.false;
    } );


    it( "hides subfield and creates parent context is not defined", () =>
    {
        const fields = [ 'baz', 'baz_subfield' ];

        let stubs = <ContextCache>{
            'baz': [ getFieldContextStub( 'baz', false ) ],
            'baz_subfield': [ getFieldContextStub( 'baz_subfield', false ) ],
        }

        let stores = <ContextStores>{
            'baz': getFieldContextStoreStub( 0 ),
            'baz_subfield': getFieldContextStoreStub( 1 ),
        }

        const parser = getContextParserStub();

        let hide_is_called = false;
        let get_content_called = false;

        const factory = <FieldContextFactory>{
            'create': ( field: string, __:any, ___:any, ____:any ) => {
                return stubs[ field ][ 0 ];
            },
            'createStore': ( field: string, __:any, ___:any ) => {
                return stores[ field ];
            }
        };

        stores[ 'baz_subfield' ].isSubField = () =>
        {
            return true;
        };

        stores[ 'baz_subfield' ].getSubFieldParentName = () =>
        {
            return 'baz';
        };

        stubs[ 'baz_subfield' ][ 0 ].hide = () =>
        {
            hide_is_called = true;
        };

        stubs[ 'baz' ][ 0 ].getContent = () =>
        {
            get_content_called = true;
            return <ContextContent>{};
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );

        sut.hide( 'baz_subfield', <PositiveInteger>0 );

        expect( hide_is_called ).to.be.true
        expect( get_content_called ).to.be.true;
    } );



    it( "show field supplies previous element to attach to", () =>
    {
        const fields = [ 'moo', 'foo', 'bar', 'baz', 'qux' ];
        let stubs = <ContextCache>{
            'moo': [ getFieldContextStub( 'moo', false, false ) ],
            'foo': [ getFieldContextStub( 'foo', false, false ) ],
            'bar': [ getFieldContextStub( 'bar', false, false ) ],
            'baz': [ getFieldContextStub( 'baz', true, true ) ],
            'qux': [ getFieldContextStub( 'qux', true, true ) ]
        }

        let stores = <ContextStores>{
            'moo': getFieldContextStoreStub( 0 ),
            'foo': getFieldContextStoreStub( 1 ),
            'bar': getFieldContextStoreStub( 2 ),
            'baz': getFieldContextStoreStub( 3 ),
            'qux': getFieldContextStoreStub( 4 ),
        }

        let show_is_called = false;

        const parser = getContextParserStub();

        const factory = <FieldContextFactory>{
            'create': ( field: string, __:any, ___:any, ____:any ) => {
                return stubs[ field ][ 0 ];
            },
            'createStore': ( field: string, __:any, ___:any ) => {
                return stores[ field ];
            }
        };

        const baz_content = document.createElement( "div" );

        stubs[ 'baz' ][ 0 ].getFirstOfContentSet = () =>
        {
            return baz_content;
        };

        stubs[ 'foo' ][ 0 ].show = (
            to: ContextContent,
            next_element: NullableContextContent
        ) =>
        {
            expect( to ).to.equal( dummy_content );
            // it should be attaching to baz which is the next attached element
            expect( next_element ).to.equal( baz_content );
            show_is_called = true;
        };

        stubs[ 'moo' ][ 0 ].show = ( _:any, __: any ) => {};
        stubs[ 'baz' ][ 0 ].show = ( _:any, __: any ) => {};

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );

        // first add two fields, and baz added before foo
        sut.show( 'moo', <PositiveInteger>0, dummy_content );
        sut.show( 'baz', <PositiveInteger>0, dummy_content );

        // now add the foo field to assert on
        sut.show( 'foo', <PositiveInteger>0, dummy_content );

        expect( show_is_called ).to.be.true;
    } );


    it( "show field creates new FieldContext when not created yet for a new index", () =>
    {
        const fields = [ 'foo', 'bar', 'baz' ];

        // Simulate that "bar" with index 1 is attached
        // but currently does not exist in context cache
        // No other fields exist yet for that index
        let stubs = <ContextCache>{
            'foo': [ getFieldContextStub( 'foo', false ) ],
            'bar': [
                getFieldContextStub( 'bar', false ),
                getFieldContextStub( 'bar', false )
            ],
            'baz': [ getFieldContextStub( 'baz', true ) ],
        }

        let show_is_called = false;
        let get_clone_is_called = false;
        let get_sibling_clone_is_called = false;
        let get_position_is_called = false;

        const parser = getContextParserStub();
        const store = getFieldContextStoreStub();
        const factory = <FieldContextFactory>{
            create: ( field: string, index: PositiveInteger, ___:any, ____:any ) => {
                return stubs[ field ][ index ]
            },
            'createStore': ( _: any, __:any, ___:any ) => {
                return store;
            }
        };

        store.getSiblingContentClone = ( _:any ) =>
        {
            get_sibling_clone_is_called = true;
            return null;
        }

        store.getContentClone = ( _:any ) =>
        {
            get_clone_is_called = true;
            return <ContextContent>{};
        }

        store.getPosition = () =>
        {
            get_position_is_called = true;
            return <PositiveInteger>1;
        }

        stubs[ 'bar' ][ 1 ].show = (
            to: ContextContent,
            next_element: NullableContextContent
        ) =>
        {
            expect( to ).to.equal( dummy_content );
            // There is no next element with index 1
            expect( next_element ).to.equal( null );
            show_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );

        sut.show( 'bar', <PositiveInteger>1, dummy_content );

        expect( show_is_called ).to.be.true;
        expect( get_clone_is_called ).to.be.true;
        expect( get_sibling_clone_is_called ).to.be.true;
        expect( get_position_is_called ).to.be.true;
    } );


    it( "does not show field if field doesn't exist in cache", () =>
    {
        const fields = [ 'foo', 'baz' ];

        const parser = getContextParserStub();

        let show_is_called = false;

        const stub = getFieldContextStub();
        const factory = getFieldContextFactory( stub );

        stub.show = ( _:any, __:any ) =>
        {
            show_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );

        sut.hide( 'bar', <PositiveInteger>0 );

        expect( show_is_called ).to.be.false;
    } );



    it( "removeIndex removes last index from ContextCache", () =>
    {
        const fields = [ 'foo', 'bar' ];

        let get_clone_called_num_times = 0;

        let stubs = <ContextCache>{
            'foo': [
                getFieldContextStub( 'foo', false ),
                getFieldContextStub( 'foo', false )
            ],
            'bar': [
                getFieldContextStub( 'bar', false ),
                getFieldContextStub( 'bar', false )
            ],
        }

        const parser = getContextParserStub();
        const store = getFieldContextStoreStub();
        const factory = <FieldContextFactory>{
            create: ( field: string, index: PositiveInteger, ___:any, ____:any ) => {
                return stubs[ field ][ index ]
            },
            'createStore': ( _: any, __:any, ___:any ) => {
                return store;
            }
        };

        stubs[ 'foo' ][ 1 ].show = ( _:any, __:any ) => { };

        stubs[ 'foo' ][ 1 ].isVisible = () => {
            return false;
        };

        stubs[ 'bar' ][ 1 ].show = ( _:any, __:any ) => { };

        stubs[ 'bar' ][ 1 ].isVisible = () => {
            return false;
        };

        store.getContentClone = ( _:any ) =>
        {
            get_clone_called_num_times++;
            return <ContextContent>{};
        }

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );

        // Simulate index 1 elements being added to ContextCache
        sut.show( 'foo', <PositiveInteger>1, dummy_content );
        sut.show( 'bar', <PositiveInteger>1, dummy_content );

        sut.removeIndex( fields );

        // now that index is removed, attach the content back
        // which will re-add them to the ContextCache
        sut.show( 'foo', <PositiveInteger>1, dummy_content );
        sut.show( 'bar', <PositiveInteger>1, dummy_content );

        expect( get_clone_called_num_times ).to.equal( 4 );
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
        const factory = getFieldContextFactory( stub );

        let set_options_is_called = false;
        stub.setOptions = ( options :any, value :any ) =>
        {
            expect( options ).to.equal( stub_options );
            expect( value ).to.equal( stub_value );
            set_options_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.createFieldStores( fields, dummy_content );
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
        'findSiblingContent': ( _: any ) => {
            return <ContextContent>document.createElement("dt");
        },
    };
}


function getFieldContextFactory( stub: FieldContext )
{
    return <FieldContextFactory>{
        'create': ( _: any, __:any, ___:any, ____:any ) => {
            return stub;
        },
        'createStore': ( _: any, __:any, ___:any ) => {
            return getFieldContextStoreStub()
        }
    };
}


function getFieldContextStoreStub( position = 0 )
{
    return <FieldContextStore><unknown>{
        'getPosition': () => { return <PositiveInteger>position; },
        'getContentClone': () => {},
        'getSiblingContentClone': () => {},
        'isSubField': () => { return false; },
        'detach': () => {},
        'getSubFieldParentName': () => {},
    }
}


function getFieldContextStub(
    element_id: string = '',
    is_visible = false,
    is_attached = false
)
{
    return <FieldContext>{
        'getElementId': () => { return element_id },
        'isVisible': () => { return is_visible; },
        'isAttached': () => { return is_attached; },
        'getFirstOfContentSet': () => {},
    };
}