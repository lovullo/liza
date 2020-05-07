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
    it( "init calls parser and creates a store for each field", () =>
    {
        const fields = [ 'foo', 'baz_subfield' ];
        const is_internal = true;

        let stores = <ContextStores>{
            'foo': getFieldContextStoreStub( 0 ),
            'baz_subfield': getFieldContextStoreStub( 0 ),
        }

        let parser_fields: string[] = [];

        let find_sibling_called = false;

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
            'createStore': ( field: any, __:any, ___:any, internal_flag: boolean ) => {
                expect( internal_flag ).to.equal( is_internal );
                return stores[ field ];
            }
        };

        stores[ 'baz_subfield' ].isSubField = () =>
        {
            return true;
        };

        const sut = new Sut( parser, factory );

        const dummy_content = document.createElement( "dl" );

        sut.init( fields, fields, dummy_content, is_internal );

        expect( parser_fields )
            .to.deep.equal( fields );

        expect( find_sibling_called ).to.be.true;
    } );


    it( "init does not create store when parser returns null", () =>
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

        sut.init( fields, fields, dummy_content );

        expect( factory_call_count ).to.equal( 0 );
    } );


    it( "createFieldCache creates fieldcontext for each field", () =>
    {
        const fields = [ 'foo', 'baz_subfield' ];

        let stubs = <ContextCache>{
            'foo': [ getFieldContextStub( 'foo', false, false ) ],
            'baz_subfield': [ getFieldContextStub( 'baz_subfield', false, false ) ],
        }

        let stores = <ContextStores>{
            'foo': getFieldContextStoreStub( 0 ),
            'baz_subfield': getFieldContextStoreStub( 0 ),
        }

        let create_field_call_count = 0;
        let is_subfield_call_count = 0;

        const parser = <ContextParser>{
            'parse': ( _: any, __: any ) => {
                return <ContextContent>document.createElement( "dd" );
            },
            'findSiblingContent': ( _: any ) => {
                return <ContextContent>document.createElement("dt");
            },
        };

        const factory = <FieldContextFactory>{
            'create': ( field:any, __:any, ___:any, ____:any ) => {
                create_field_call_count++;
                return stubs[ field ][ 0 ];
            },
            'createStore': ( field: any, __:any, ___:any ) => {
                return stores[ field ];
            }
        };

        stores[ 'baz_subfield' ].isSubField = () =>
        {
            is_subfield_call_count++;
            return true;
        };

        const sut = new Sut( parser, factory );

        const dummy_content = document.createElement( "dl" );

        sut.init( fields, fields, dummy_content );

        sut.createFieldCache();

        expect( create_field_call_count ).to.equal( fields.length );
        expect( is_subfield_call_count ).to.equal( 2 );
    } );


    it( "addIndex clones content for non-cmatch fields by index and shows them", () =>
    {
        const fields = [ 'foo', 'baz' ];
        const cmatch_fields = [ 'baz' ];

        let stubs = <ContextCache>{
            'foo': [ getFieldContextStub( 'foo', false, false ) ],
            'baz': [ getFieldContextStub( 'baz', false, false ) ],
        }

        let stores = <ContextStores>{
            'foo': getFieldContextStoreStub( 0 ),
            'baz': getFieldContextStoreStub( 0 ),
        }

        let foo_show_called = false;
        let baz_show_called = false;

        const dummy_content = document.createElement( "dl" );

        const parser = <ContextParser>{
            'parse': ( _: any, __: any ) => {
                return <ContextContent>document.createElement( "dd" );
            },
            'findSiblingContent': ( _: any ) => {
                return <ContextContent>document.createElement("dt");
            },
        };

        const factory = <FieldContextFactory>{
            'create': ( field:any, __:any, ___:any, ____:any ) => {
                return stubs[ field ][ 0 ];
            },
            'createStore': ( field: any, __:any, ___:any ) => {
                return stores[ field ];
            }
        };

        stubs[ 'foo' ][ 0 ].show = ( _: any, __:any ) =>
        {
            foo_show_called = true;
        };

        stubs[ 'baz' ][ 0 ].show = (  _: any, __:any ) =>
        {
            baz_show_called = true;
        };

        const sut = new Sut( parser, factory );

        sut.init( fields, cmatch_fields, dummy_content );

        sut.addIndex( <PositiveInteger>0, dummy_content );

        expect( foo_show_called ).to.be.true;
        expect( baz_show_called ).to.be.false;
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
        sut.init( fields, cmatch_fields, dummy_content );

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
        sut.init( fields, fields, dummy_content );

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
        sut.init( fields, fields, dummy_content );

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
        sut.init( fields, fields, dummy_content );

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
        sut.init( fields, fields, dummy_content );

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
            'baz_subfield': getFieldContextStoreStub( 1, 'baz' ),
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
        sut.init( fields, fields, dummy_content );

        sut.hide( 'baz_subfield', <PositiveInteger>0 );

        expect( hide_is_called ).to.be.true
        expect( get_content_called ).to.be.true;
    } );



    it( "show field supplies previous element to attach to and sets value", () =>
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
        let set_value_is_called = false;
        let has_value_is_called = false;

        const foo_value = 'foo bar';

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

        // value is retrieved
        stores[ 'foo' ].getValueByIndex = ( _: any ) => { return foo_value; };

        stores[ 'foo' ].hasValueByIndex = ( _: any ) => {
            has_value_is_called = true;
            return true;
        };

        // value is set
        stubs[ 'foo' ][ 0 ].setValue = ( value: string ) =>
        {
            expect( value ).to.equal( foo_value );
            set_value_is_called = true;
        };

        stubs[ 'moo' ][ 0 ].show = ( _:any, __: any ) => {};
        stubs[ 'baz' ][ 0 ].show = ( _:any, __: any ) => {};

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.init( fields, fields, dummy_content );

        // first add two fields, and baz added before foo
        sut.show( 'moo', <PositiveInteger>0, dummy_content );
        sut.show( 'baz', <PositiveInteger>0, dummy_content );

        // now add the foo field to assert on
        sut.show( 'foo', <PositiveInteger>0, dummy_content );

        expect( has_value_is_called ).to.be.true;
        expect( set_value_is_called ).to.be.true;
        expect( show_is_called ).to.be.true;
    } );



    it( "show field sets the options when they exist in the store", () =>
    {
        const fields = [ 'foo' ];
        let stubs = <ContextCache>{
            'foo': [ getFieldContextStub( 'foo', false, false ) ],
        }

        let stores = <ContextStores>{
            'foo': getFieldContextStoreStub( 0 ),
        }

        const stub_options = [ { value: 'foo', label: 'foo', label_id: 'foo' } ];
        const stub_value = 'foo bar';

        let show_is_called = false;
        let set_options_is_called = false;
        let has_options_is_called = false;

        const parser = getContextParserStub();

        const factory = <FieldContextFactory>{
            'create': ( field: string, __:any, ___:any, ____:any ) => {
                return stubs[ field ][ 0 ];
            },
            'createStore': ( field: string, __:any, ___:any ) => {
                return stores[ field ];
            }
        };

        stubs[ 'foo' ][ 0 ].show = ( _:any, __:any ) =>
        {
            show_is_called = true;
        };

        // value is retrieved
        stores[ 'foo' ].getValueByIndex = ( _: any ) => {
            return stub_value;
        };

        // options are retrieved
        stores[ 'foo' ].getOptionsByIndex = ( _: any ) => {
            return stub_options;
        };

        stores[ 'foo' ].hasOptionsByIndex = ( _: any ) => {
            has_options_is_called = true;
            return true;
        };

        // options are set set
        stubs[ 'foo' ][ 0 ].setOptions = ( options: any, value: any ) =>
        {
            expect( options ).to.equal( stub_options );
            expect( value ).to.equal( stub_value );
            set_options_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.init( fields, fields, dummy_content );

        sut.show( 'foo', <PositiveInteger>0, dummy_content );

        expect( has_options_is_called ).to.be.true;
        expect( set_options_is_called ).to.be.true;
        expect( show_is_called ).to.be.true;
    } );


    it( "show field does not set the value if value does not exist", () =>
    {
        const fields = [ 'foo' ];
        let stubs = <ContextCache>{
            'foo': [ getFieldContextStub( 'foo', false, false ) ],
        }

        let stores = <ContextStores>{
            'foo': getFieldContextStoreStub( 0 ),
        }

        const foo_value = 'foo bar';
        const parser = getContextParserStub();
        let has_value_is_called = false;
        let set_value_is_called = false;

        const factory = <FieldContextFactory>{
            'create': ( field: string, __:any, ___:any, ____:any ) => {
                return stubs[ field ][ 0 ];
            },
            'createStore': ( field: string, __:any, ___:any ) => {
                return stores[ field ];
            }
        };

        // value is retrieved
        stores[ 'foo' ].getValueByIndex = ( _: any ) => { return foo_value; };

        stores[ 'foo' ].hasValueByIndex = ( _: any ) => {
            has_value_is_called = true;
            return false;
        };

        stubs[ 'foo' ][ 0 ].setValue = ( _: any ) =>
        {
            set_value_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.init( fields, fields, dummy_content );

        sut.show( 'foo', <PositiveInteger>0, dummy_content );

        expect( has_value_is_called ).to.be.true;
        expect( set_value_is_called ).to.be.false;
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
        sut.init( fields, fields, dummy_content );

        sut.show( 'bar', <PositiveInteger>1, dummy_content );

        expect( show_is_called ).to.be.true;
        expect( get_clone_is_called ).to.be.true;
        expect( get_sibling_clone_is_called ).to.be.true;
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
        sut.init( fields, fields, dummy_content );

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
        sut.init( fields, fields, dummy_content );

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
            label: 'setOptions sets options when field context exists',
            fields: [ 'foo', 'bar' ],
            field_to_set: 'bar',
            is_attached: true,
            store_set_value_expected: false,
            store_set_options_expected: false,
            context_set_options_expected: true
        },
        {
            label: 'setOptions sets options on store when field context does not exist',
            fields: [ 'foo', 'bar' ],
            field_to_set: 'bar',
            is_attached: false,
            store_set_value_expected: true,
            store_set_options_expected: true,
            context_set_options_expected: false
        },
        {
            label: 'setOptions does not set options when field store does not exist',
            fields: [ 'foo', 'bar' ],
            field_to_set: 'baz',
            is_attached: false,
            store_set_value_expected: false,
            store_set_options_expected: false,
            context_set_options_expected: false
        },
    ].forEach( ( {
        label,
        fields,
        field_to_set,
        is_attached,
        store_set_value_expected,
        store_set_options_expected,
        context_set_options_expected
    } ) => {
    it( label, () =>
    {
        const stub_options = [ { value: 'foo', label: 'foo', label_id: 'foo' } ];
        const stub_value = 'bar';

        const store = getFieldContextStoreStub();
        const stub = getFieldContextStub();

        const parser = getContextParserStub();
        const factory = <FieldContextFactory>{
            create: ( _:any, __:any, ___:any, ____:any ) => {
                return stub;
            },
            'createStore': ( _: any, __:any, ___:any ) => {
                return store;
            }
        };

        let context_set_options_is_called = false;
        let store_set_options_is_called = false;
        let store_set_value_is_called = false;

        stub.isAttached = () =>
        {
            return is_attached;
        };

        stub.setOptions = ( options :any, value :any ) =>
        {
            expect( options ).to.equal( stub_options );
            expect( value ).to.equal( stub_value );
            context_set_options_is_called = true;
        };

        store.setOptionsByIndex = ( _:any, options :any ) =>
        {
            expect( options ).to.equal( stub_options );
            store_set_options_is_called = true;
        };

        store.setValueByIndex = ( _:any, value :any ) =>
        {
            expect( value ).to.equal( stub_value );
            store_set_value_is_called = true;
        };

        const dummy_content = document.createElement( "dl" );
        const sut = new Sut( parser, factory );
        sut.init( fields, fields, dummy_content );
        sut.createFieldCache();

        sut.setOptions( field_to_set, <PositiveInteger>0, stub_options, stub_value );
        expect( context_set_options_is_called ).to.equal( context_set_options_expected );
        expect( store_set_options_is_called ).to.equal( store_set_options_expected );
        expect( store_set_value_is_called ).to.equal( store_set_value_expected );
        } );
    } );


    [
        {
            label: 'setValueByName sets the value on store when field not attached',
            is_attached: false,
            context_set_value_expected: false,
            store_set_value_expected: true,
        },
        {
            label: 'setValueByName sets the value on field is attached',
            is_attached: true,
            context_set_value_expected: true,
            store_set_value_expected: false,
        },
    ].forEach( ( { label, is_attached, context_set_value_expected, store_set_value_expected  } ) => {
        it( label, () =>
        {
            const fields = [ 'foo', 'baz' ];
            const cmatch_fields = [ 'foo' ];

            let stubs = <ContextCache>{
                'foo': [ getFieldContextStub( 'foo', false ) ],
                'baz': [ getFieldContextStub( 'bar', false ) ],
            }

            let stores = <ContextStores>{
                'foo': getFieldContextStoreStub( 0 ),
                'baz': getFieldContextStoreStub( 1 ),
            }

            const field_value = "some value";

            let context_set_value_called = false;
            let store_set_value_called = false;

            const parser = getContextParserStub();
            const factory = <FieldContextFactory>{
                create: ( field: string, index: PositiveInteger, ___:any, ____:any ) => {
                    return stubs[ field ][ index ];
                },
                'createStore': ( field: string, __:any, ___:any ) => {
                    return stores[ field ];
                }
            };

            const dummy_content = document.createElement( "dl" );
            const sut = new Sut( parser, factory );
            sut.init( fields, cmatch_fields, dummy_content );
            sut.createFieldCache();

            stubs[ 'baz' ][ 0 ].isAttached = () =>
            {
                return is_attached;
            };

            stubs[ 'baz' ][ 0 ].setValue = ( value:any ) =>
            {
                expect( value ).to.equal( field_value );
                context_set_value_called = true;
            };

            stores[ 'baz' ].setValueByIndex = ( _:any, value:any ) =>
            {
                expect( value ).to.equal( field_value );
                store_set_value_called = true;
            };

            sut.setValueByName( 'baz', <PositiveInteger>0, field_value );

            expect( context_set_value_called ).to.equal( context_set_value_expected );
            expect( store_set_value_called ).to.equal( store_set_value_expected );
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
        'createStore': ( _: any, __:any, ___:any, ____:any ) => {
            return getFieldContextStoreStub()
        }
    };
}


function getFieldContextStoreStub( position = 0, parent_name = '' )
{
    return <FieldContextStore><unknown>{
        'position': <PositiveInteger>position,
        'getContentClone': () => {},
        'getSiblingContentClone': () => {},
        'isSubField': () => { return false; },
        'detach': () => {},
        'subFieldParentName': parent_name,
        'setValueByIndex': ( _: any, __: any ) => {},
        'getValueByIndex' : ( _: any ) => {},
        'hasValueByIndex' : ( _: any ) => { return true; },
        'setOptionsByIndex': ( _: any, __: any ) => {},
        'getOptionsByIndex' : ( _: any ) => {},
        'hasOptionsByIndex' : ( _: any ) => { return false; },
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
        'show': ( _: any, __:any ) => {},
        'getFirstOfContentSet': () => {},
        'setValue': ( _: any ) => {},
    };
}