/**
 * Test of DocumentProgramFormatter
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
 *
 *  This file is part of liza.
 *
 *  liza is free software: you can redistribute it and/or modify
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
 *
 */

'use strict';

const chai   = require( 'chai' );
const expect = chai.expect;

const {
    document: {
        DocumentProgramFormatter: Sut,
    },
} = require( '../../' );

chai.use( require( 'chai-as-promised' ) );


describe( 'DocumentProgramFormatter', () =>
{
    it( "formats bucket data by steps, groups and fields", () =>
    {
        const bucket_data = {
            sell_alcohol: [ "foo", "" ],
            serve_alcohol: [ "" ],
            sell_ecigs: [ "", "bar" ],
            dist_ecigs: [ "" ],
            field_no_label: [ "" ],
            field_no_array: [ "bar" ],
            field_no_vis: [ "true" ]
        };

        const expected_object = {
            steps: [
                {
                    title: "Manage Quote",
                    groups: []
                },
                {
                    title: "General Information",
                    groups: [
                        {
                            title: "Group One",
                            questions: [
                                {
                                    id:         "sell_alcohol",
                                    label:      "Does the insured sell alcohol?",
                                    value:      [ "foo", "" ],
                                    type:       "noyes",
                                    applicable: [ true, false ]
                                },
                                {
                                    id:         "serve_alcohol",
                                    label:      "Does the insured serve alcohol?",
                                    value:      [ "" ],
                                    type:       "noyes",
                                    applicable: [ false ]
                                },
                                {
                                    id:         "field_no_vis",
                                    label:      "Does this field have a visibility class?",
                                    value:      [ "true" ],
                                    type:       "noyes",
                                    applicable: [ true ]
                                }
                            ]
                        },
                        {
                            title: "",
                            questions: [
                                {
                                    id:         "sell_ecigs",
                                    label:      "Does the insured sell e-cigarettes?",
                                    value:      [ "", "bar" ],
                                    type:       "noyes",
                                    applicable: [ false, true ]
                                },
                                {
                                    id:         "dist_ecigs",
                                    label:      "Does the Insured distribute Electronic Cigarette products?",
                                    value:      [ "" ],
                                    type:       "noyes",
                                    applicable: [ false ]
                                },
                                {
                                    id:         "field_no_array",
                                    label:      "Does this field have an array for the visibility class?",
                                    value:      [ "bar" ],
                                    type:       "noyes",
                                    applicable: [ true ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        const bucket        = createStubBucket( bucket_data );
        const program       = createStubProgram();
        const class_matcher = createStubClassMatcher();

        return expect(
            Sut( program, class_matcher ).format( bucket )
        ).to.eventually.deep.equal( expected_object );
    } );
} );


function createStubClassMatcher()
{
    return {
        match( _, callback )
        {
            callback({
                __classes:
                {
                    '--vis-sell-alcohol': { is: true, indexes: [1,0] },
                    '--vis-serve-alcohol': { is: false, indexes: [0] },
                    '--vis-sell-ecigs': { is: false, indexes: [0,1] },
                    '--vis-dist-ecigs': { is: true, indexes: [0] },
                    '--vis-no-array': { is: true, indexes: 1 },
                }
            }) ;
        }
    }
}


function createStubBucket( metadata )
{
    return {
        getDataByName: name => metadata[ name ],
        getData()
        {
            return metadata;
        },
    };
}


function createStubProgram()
{
    return {
        steps: [
            {
                title: "Index 0"
            },
            {
                title: "Manage Quote",
                groups: []
            },
            {
                title: "General Information",
                groups: [ 'group_one', 'group_two' ]
            }
        ],
        classify( bucket_data )
        {
            return {}
        },
        groups:
        {
            'group_one':
            {
                title: "Group One"
            },
            'group_two': {},
        },
        fields:
        {
            sell_alcohol:
            {
                label: "Does the insured sell alcohol?",
                type: "noyes",
                required: "true",
            },
            serve_alcohol:
            {
                label: "Does the insured serve alcohol?",
                type: "noyes",
                required: "true"
            },
            sell_ecigs:
            {
                label: "Does the insured sell e-cigarettes?",
                type: "noyes",
                required: "true"
            },
            dist_ecigs:
            {
                label: "Does the Insured distribute Electronic Cigarette products?",
                type: "noyes",
                required: "true"
            },
            field_no_array:
            {
                label: "Does this field have an array for the visibility class?",
                type: "noyes",
                required: "true"
            },
            field_no_vis:
            {
                label: "Does this field have a visibility class?",
                type: "noyes",
                required: "true"
            }
        },
        groupExclusiveFields:
        {
            'group_one': [ "sell_alcohol", "serve_alcohol", "field_no_label", "field_no_vis" ],
            'group_two': [ "sell_ecigs", "dist_ecigs", "field_no_array" ],
        },
        whens:
        {
            sell_alcohol: [ "--vis-sell-alcohol" ],
            serve_alcohol: [ "--vis-serve-alcohol" ],
            sell_ecigs: [ "--vis-sell-ecigs" ],
            dist_ecigs: [ "--vis-dist-ecigs" ],
            field_no_array: [ "--vis-no-array" ],
        },
    };
}
