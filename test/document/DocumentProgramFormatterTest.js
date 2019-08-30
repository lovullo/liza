/**
 * Test of DocumentProgramFormatter
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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
            alcohol_shown: [ "foo", "" ],
            alcohol_not_shown: [ "" ],
            ecigs_shown_twice: [ "foo", "bar" ],
            ecigs_not_shown: [ "" ],
            field_no_label: [ "" ],
            field_no_vis: [ "true" ],
            field_empty_array_any_true: [ "bar" ],
            field_empty_array_any_false: [ "" ]
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
                            id: "group_one",
                            title: "Group One",
                            link: "locations",
                            questions: [
                                {
                                    id:         "alcohol_shown",
                                    label:      "Alcohol?",
                                    value:      [ "foo", "" ],
                                    type:       "noyes",
                                    applicable: [ true, false ]
                                },
                                {
                                    id:         "alcohol_not_shown",
                                    label:      "No alcohol?",
                                    value:      [ "" ],
                                    type:       "noyes",
                                    applicable: [ false ]
                                },
                                {
                                    id:         "field_no_vis",
                                    label:      "Is this field found in FieldMatcher?",
                                    value:      [ "true" ],
                                    type:       "noyes",
                                    applicable: [ true ]
                                }
                            ]
                        },
                        {
                            id: "group_two",
                            title: "",
                            link: "",
                            questions: [
                                {
                                    id:         "ecigs_shown_twice",
                                    label:      "Two ecig answers?",
                                    value:      [ "foo", "bar" ],
                                    type:       "noyes",
                                    applicable: [ true, true ]
                                },
                                {
                                    id:         "ecigs_not_shown",
                                    label:      "No ecigs?",
                                    value:      [ "" ],
                                    type:       "noyes",
                                    applicable: [ false ]
                                },
                                {
                                    id:         "field_empty_array_any_true",
                                    label:      "Empty match array?",
                                    value:      [ "bar" ],
                                    type:       "noyes",
                                    applicable: [ true ]
                                },
                                {
                                    id:         "field_empty_array_any_false",
                                    label:      "Empty match array and 'any' is false?",
                                    value:      [ "" ],
                                    type:       "noyes",
                                    applicable: [ false ]
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
                "__classes": {
                    '--vis-foo': { is: true, indexes: [1,0] },
                },
                "alcohol_shown": {
                    "all": false,
                    "any": true,
                    "indexes": [1, 0]
                },
                "alcohol_not_shown": {
                    "all": false,
                    "any": false,
                    "indexes": [0]
                },
                "ecigs_shown_twice": {
                    "all": false,
                    "any": true,
                    "indexes": [1, 1]
                },
                "ecigs_not_shown": {
                    "all": false,
                    "any": false,
                    "indexes": []
                },
                "field_empty_array_any_false": {
                    "all": false,
                    "any": false,
                    "indexes": []
                },
                "field_empty_array_any_true": {
                    "all": true,
                    "any": true,
                    "indexes": []
                },
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
                title: "Group One",
                link: "locations"
            },
            'group_two': {},
        },
        fields:
        {
            alcohol_shown:
            {
                label: "Alcohol?",
                type: "noyes",
                required: "true",
            },
            alcohol_not_shown:
            {
                label: "No alcohol?",
                type: "noyes",
                required: "true"
            },
            ecigs_shown_twice:
            {
                label: "Two ecig answers?",
                type: "noyes",
                required: "true"
            },
            ecigs_not_shown:
            {
                label: "No ecigs?",
                type: "noyes",
                required: "true"
            },
            field_empty_array_any_true:
            {
                label: "Empty match array?",
                type: "noyes",
                required: "true"
            },
            field_empty_array_any_false:
            {
                label: "Empty match array and 'any' is false?",
                type: "noyes",
                required: "true"
            },
            field_no_vis:
            {
                label: "Is this field found in FieldMatcher?",
                type: "noyes",
                required: "true"
            }
        },
        groupExclusiveFields:
        {
            'group_one': [
                "alcohol_shown",
                "alcohol_not_shown",
                "field_no_label",
                "field_no_vis"
            ],
            'group_two': [
                "ecigs_shown_twice",
                "ecigs_not_shown",
                "field_empty_array_any_true",
                "field_empty_array_any_false"
            ],
        },
    };
}
