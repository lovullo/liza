/**
 * Test case for FieldVisibilityEventHandler
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
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

const expect = require( 'chai' ).expect;

const { FieldClassMatcher: Sut } = require( '../../' ).field;


describe( 'FieldClassMatcher', () =>
{
    it( "echoes provided classes as __classes", done =>
    {
        const classes = { foo: [ 1 ], bar: 0 };

        Sut( {} ).match( classes, result =>
        {
            expect( result.__classes ).to.deep.equal( classes );
            done();
        } );
    } );


    [
        {
            label:    "does nothing with no fields or classes",
            fields:   {},
            classes:  {},
            expected: {},
        },

        {
            label:    "sets all on >0 scalar cmatch",
            fields:   { foo: [ 'foowhen' ] },
            classes:  { foowhen: { indexes: 1 } },
            expected: {
                foo: {
                    all:     true,
                    any:     true,
                    indexes: [],
                },
            },
        },

        {
            label:    "sets none on 0 scalar cmatch",
            fields:   { foo: [ 'foowhen' ] },
            classes:  { foowhen: { indexes: 0 } },
            expected: {
                foo: {
                    all:     false,
                    any:     false,
                    indexes: [],
                },
            },
        },

        {
            label:    "sets all on all vector cmatch",
            fields:   { foo: [ 'foowhen' ] },
            classes:  { foowhen: { indexes: [ 1, 1 ] } },
            expected: {
                foo: {
                    all:     true,
                    any:     true,
                    indexes: [ 1, 1 ],
                },
            },
        },

        {
            label:    "sets any on partial vector cmatch",
            fields:   { foo: [ 'foowhen' ] },
            classes:  { foowhen: { indexes: [ 0, 1 ] } },
            expected: {
                foo: {
                    all:     false,
                    any:     true,
                    indexes: [ 0, 1 ],
                },
            },
        },

        {
            label:    "sets nothing on empty vector cmatch",
            fields:   { foo: [ 'foowhen' ] },
            classes:  { foowhen: { indexes: [ 0, 0 ] } },
            expected: {
                foo: {
                    all:     false,
                    any:     false,
                    indexes: [ 0, 0 ],
                },
            },
        },


        // bad class data
        {
            label:    "handles missing class as if scalar 0",
            fields:   { foo: [ 'noexist' ] },
            classes:  {},
            expected: {
                foo: {
                    all:     false,
                    any:     false,
                    indexes: [],
                },
            },
        },

        // multiple classes
        {
            label:    "logical ANDs multiple vector classes (any)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: [ 1, 0 ] },
                foowhen2: { indexes: [ 1, 1 ] },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     true,
                    indexes: [ 1, 0 ],
                },
            },
        },
        {
            label:    "logical ANDs multiple vector classes (all)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: [ 1, 1 ] },
                foowhen2: { indexes: [ 1, 1 ] },
            },
            expected: {
                foo: {
                    all:     true,
                    any:     true,
                    indexes: [ 1, 1 ],
                },
            },
        },
        {
            label:    "logical ANDs multiple vector classes (none)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: [ 0, 0 ] },
                foowhen2: { indexes: [ 0, 0 ] },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     false,
                    indexes: [ 0, 0 ],
                },
            },
        },

        {
            label:    "assumes match when ANDing varying lengths (any)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: [ 0 ] },
                foowhen2: { indexes: [ 0, 1 ] },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     true,
                    indexes: [ 0, 1 ],
                },
            },
        },
        {
            label:    "assumes match when ANDing varying lengths (all)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: [ 1 ] },
                foowhen2: { indexes: [ 1, 1 ] },
            },
            expected: {
                foo: {
                    all:     true,
                    any:     true,
                    indexes: [ 1, 1 ],
                },
            },
        },
        {
            label:    "assumes match when ANDing varying lengths (none)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: [ 0 ] },
                foowhen2: { indexes: [ 0, 0 ] },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     false,
                    indexes: [ 0, 0 ],
                },
            },
        },

        {
            label:    "logically ANDs scalar with vector (any)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: 1 },
                foowhen2: { indexes: [ 0, 1, 0 ] },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     true,
                    indexes: [ 0, 1, 0 ],
                },
            },
        },
        {
            label:    "logically ANDs scalar with vector (all)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: 1 },
                foowhen2: { indexes: [ 1, 1 ] },
            },
            expected: {
                foo: {
                    all:     true,
                    any:     true,
                    indexes: [ 1, 1 ],
                },
            },
        },
        {
            label:    "logically ANDs scalar with vector (none)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: 0 },
                foowhen2: { indexes: [ 1, 1 ] },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     false,
                    indexes: [ 0, 0 ],
                },
            },
        },

        {
            label:    "logically ANDs scalar with vector (rev, any)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: [ 0, 1, 0 ] },
                foowhen2: { indexes: 1 },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     true,
                    indexes: [ 0, 1, 0 ],
                },
            },
        },
        {
            label:    "logically ANDs scalar with vector (rev, all)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: [ 1, 1 ] },
                foowhen2: { indexes: 1 },
            },
            expected: {
                foo: {
                    all:     true,
                    any:     true,
                    indexes: [ 1, 1 ],
                },
            },
        },
        {
            label:    "logically ANDs scalar with vector (rev, none)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: [ 1, 1 ] },
                foowhen2: { indexes: 0 },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     false,
                    indexes: [ 0, 0 ],
                },
            },
        },

        {
            label:    "logically ANDs scalar with scalar (all)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: 1 },
                foowhen2: { indexes: 1 },
            },
            expected: {
                foo: {
                    all:     true,
                    any:     true,
                    indexes: [],
                },
            },
        },
        {
            label:    "logically ANDs scalar with scalar (none 0)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: 0 },
                foowhen2: { indexes: 0 },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     false,
                    indexes: [],
                },
            },
        },
        {
            label:    "logically ANDs scalar with scalar (none 1)",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: 0 },
                foowhen2: { indexes: 1 },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     false,
                    indexes: [],
                },
            },
        },


        // matrix cmatch
        {
            label:    "logically ORs matrix cmatch (single)",
            fields:   { foo: [ 'foowhen' ] },
            classes:  {
                foowhen: { indexes: [ [ 1 ] ] },
            },
            expected: {
                foo: {
                    all:     true,
                    any:     true,
                    indexes: [ 1 ],
                },
            },
        },
        {
            label:    "logically ORs matrix cmatch (any)",
            fields:   { foo: [ 'foowhen' ] },
            classes:  {
                foowhen: { indexes: [ [ 1 ], [ 0, 1 ], [ 0, 1 ], [ 0, 0 ] ] },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     true,
                    indexes: [ 1, 1, 1, 0 ],
                },
            },
        },
        {
            label:    "logically ORs matrix cmatch (all)",
            fields:   { foo: [ 'foowhen' ] },
            classes:  {
                foowhen: { indexes: [ [ 1 ], [ 0, 1 ], [ 0, 1 ] ] },
            },
            expected: {
                foo: {
                    all:     true,
                    any:     true,
                    indexes: [ 1, 1, 1 ],
                },
            },
        },
        {
            label:    "logically AND's logically OR'd matrix cmatches",
            fields:   { foo: [ 'foowhen1', 'foowhen2' ] },
            classes:  {
                foowhen1: { indexes: [ [ 0 ], [ 0, 1 ], [ 1 ] ] },
                foowhen2: { indexes: [ [ 0 ], [ 0, 1 ], [ 0 ] ] },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     true,
                    indexes: [ 0, 1, 0 ],
                },
            },
        },

        // arbitrary nesting
        {
            label:    "logically ORs arbitrarily nested vectors",
            fields:   { foo: [ 'foowhen' ] },
            classes:  {
                foowhen: { indexes: [ [ [ 0 ], [ 0, 1 ] ], [ [ [ 0 ] ] ] ] },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     true,
                    indexes: [ 1, 0 ],
                },
            },
        },


        // multiple fields
        {
            label:    "sets multiple fields",
            fields:   { foo: [ 'foowhen' ], bar: [ 'barwhen' ] },
            classes:  {
                foowhen: { indexes: [ 0, 0 ] },
                barwhen: { indexes: [ 1, 1 ] },
            },
            expected: {
                foo: {
                    all:     false,
                    any:     false,
                    indexes: [ 0, 0 ],
                },
                bar: {
                    all:     true,
                    any:     true,
                    indexes: [ 1, 1 ],
                },
            },
        },

        {
            label:    "sets all for fields with no predicates",
            fields:   { foo: [] },
            classes:  {},
            expected: {
                foo: {
                    all:     true,
                    any:     true,
                    indexes: [],
                }
            },
        },
    ].forEach( ( { label, fields, classes, expected } ) =>
    {
        it( label, done =>
        {
            // no use in specifying this above every time
            expected.__classes = classes;

            Sut( fields ).match( classes, result =>
            {
                expect( result ).to.deep.equal( expected );
                done();
            } );
        } );
    } );
} );
