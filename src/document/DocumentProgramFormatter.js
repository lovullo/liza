/**
 * Formats program bucket data
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
 *
 *  liza is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const Class = require( 'easejs' ).Class;


/**
 * Formats program bucket data
 *
 * This takes a document and formats the bucket data in a
 * structured manner of steps, groups and fields metadata
 */
module.exports = Class( 'DocumentProgramFormatter',
{
    /**
     * Current program
     *
     * @type {Program}
     */
    'private _program':  null,

    /**
     * Performs classification matching on fields
     *
     * A field will have a positive match for a given index if all of its
     * classes match
     *
     * @type {FieldClassMatcher}
     */
    'private _class_matcher': null,


    /**
     * Initialize document formatter
     *
     * @param {Program}           program       active program
     * @param {FieldClassMatcher} class_matcher class/field matcher
     */
    constructor( program, class_matcher )
    {
        this._program       = program;
        this._class_matcher = class_matcher;
    },


    /**
     * Returns formatted document bucket data
     * Calls FieldClassMatcher.match to retrieve index of show/hide
     * values for each field
     *
     * @param {Bucket} bucket document bucket
     *
     * @return {Promise.<Object>} a promise of a data object
     */
    'public format'( bucket )
    {
        return new Promise( ( resolve, reject ) =>
        {
            const cmatch = this._program.classify( bucket.getData() );

            this._class_matcher.match( cmatch, ( field_matches ) =>
            {
                const len     = this._program.steps.length;
                const classes = field_matches.__classes;
                const data    = this._parseSteps( len, bucket, classes );

                resolve( data );
            } );

        } );
    },


    /**
     * Parses step data
     *
     * @param {Integer} len     step length
     * @param {Bucket}  bucket  document bucket
     * @param {Object}  classes class/field matches
     *
     * @return {Object} step data
     */
    'private _parseSteps'( len, bucket, classes )
    {
        const data = { steps: [] };

        for ( let i = 1; i < len; i++ )
        {
            const step = {};
            const step_groups = this._program.steps[ i ].groups;

            const groups = this._parseGroups( step_groups, bucket, classes );

            step.title = this._program.steps[ i ].title;
            step.groups = groups;

            data.steps.push( step );
        }

        return data;
    },


    /**
     * Parses group data
     *
     * @param {Array}  step_groups array of group data
     * @param {Bucket} bucket      document bucket
     * @param {Object} classes     class/field matches
     *
     * @return {Array} array of groups
     */
    'private _parseGroups'( step_groups, bucket, classes )
    {
        const groups = [];

        for ( let group in step_groups )
        {
            const step_group  = {};
            const group_id    = step_groups[ group ];
            const group_title = this._program.groups[ group_id ].title || "";
            const fields      = this._program.groupExclusiveFields[ group_id ];

            const questions = this._parseFields( fields, bucket, classes );

            step_group.title = group_title;
            step_group.questions = questions;
            groups.push( step_group );
        }

        return groups;
    },


    /**
     * Parses fields/question data
     *
     * @param {Array}  fields  array of field data
     * @param {Bucket} bucket  document bucket
     * @param {Object} classes class/field matches
     *
     * @return {Array} array of questions
     */
    'private _parseFields'( fields, bucket, classes )
    {
        const questions = [];

        for ( let field in fields )
        {
            const field_id = fields[ field ];

            // Don't include fields that are not in program.fields
            if ( typeof this._program.fields[ field_id ] === "undefined" )
            {
                continue;
            }

            const field_value = bucket.getDataByName( field_id );
            const field_label = this._program.fields[ field_id ].label;
            const field_type  = this._program.fields[ field_id ].type;
            const question    = {};

            question.id         = field_id;
            question.label      = field_label;
            question.value      = field_value;
            question.type       = field_type;
            question.applicable = this._getApplicable(
                classes,
                field_id,
                field_value
            );

            questions.push( question );
        }

        return questions;
    },


    /**
     * Determine when a field is shown by index
     * Map boolean values of [0, 1] to [true, false]
     *
     * @param {Object} classes     object of visibility classes
     * @param {String} field_id    id of field
     * @param {Object} field_value field object
     *
     * @return {Array.<boolean>} array of booleans
     */
    'private _getApplicable'( classes, field_id, field_value )
    {
        // If object is undefined, default to array of true
        if ( typeof this._program.whens[ field_id ] === "undefined" )
        {
            return field_value.map( _ => true );
        }

        const class_id = this._program.whens[ field_id ][ 0 ];
        const indexes  = classes[ class_id ].indexes;

        // Map indexes of  0, 1 to true, false
        if ( Array.isArray( indexes ) )
        {
            return indexes.map( x => !!x );
        }
        else
        {
            return field_value.map( _ => !!indexes );
        }
    },
} );
