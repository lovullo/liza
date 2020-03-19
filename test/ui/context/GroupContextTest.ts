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

import { GroupContext as Sut } from "../../../src/ui/context/GroupContext";
import { FieldContextFactory } from "../../../src/ui/context/FieldContextFactory";
import { FieldContext } from "../../../src/ui/context/FieldContext";
import { ContextParser } from "../../../src/ui/context/ContextParser";

import { expect } from 'chai';


describe( "GroupContext", () =>
{
    it( "createFieldCache calls parser and field context factory for each field", () =>
    {
        const fields = [ 'foo', 'baz' ];

        let parser_fields: string[] = [];
        let factory_call_count  = 0;

        const parser = <ContextParser>{
            'parse':( _element_id: string, _: any ) => {
                parser_fields.push( _element_id );
                return document.createElement( "dd" );
            },
        };

        const factory = <FieldContextFactory>{
            'create': ( _: any ) => {
                factory_call_count++;
                return getFieldContextStub();
            },
        };

        const sut = new Sut( parser, factory );

        const dummy_content = document.createElement( "dl" );

        sut.createFieldCache( fields, dummy_content );

        expect( parser_fields ).to.deep.equal( fields );
        expect( factory_call_count ).to.equal( fields.length );
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
            'create': ( _: any ) => {
                factory_call_count++;
                return getFieldContextStub();
            },
        };

        const sut = new Sut( parser, factory );

        const dummy_content = document.createElement( "dl" );

        sut.createFieldCache( fields, dummy_content );

        expect( factory_call_count ).to.equal( 0 );
    } );
} );


function getFieldContextStub()
{
    return <FieldContext>{
        'setSiblingContent': () => {},
        'getSiblingContent': () => {},
    };
}