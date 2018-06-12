/**
 * Initialize document data for a given Program
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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
 */

'use strict';

const { Class } = require( 'easejs' );


/**
 * Initialize document bucket data for given Programs
 *
 * A default bucket is initialized considering certain aspects of a given
 * Program (see `#init`).
 *
 * TODO: This should really contain _all_ of the init code, extracted from
 * Server, but time did not permit.  Refactoring can continue at a later date.
 */
module.exports = Class( 'ProgramInit',
{
    /**
     * Initialize document bucket data for `program`
     *
     * The original object `doc_data` will be modified by reference and
     * returned.  If `doc_data` evaluates to `false`, an empty object will
     * be returned.  Any other input results in undefined behavior.
     *
     * Note: This implementation used to cache default bucket objects, but
     * doing so risks causing subtle and nasty bugs if the system modifies
     * the default bucket object somewhere down the line, thereby affecting
     * all documents going forward.
     *
     * @param {Program} program  source program
     * @param {Object}  doc_data existing document data, if any
     *
     * @return {Object} `doc_data` modified
     */
    'public init'( program, doc_data )
    {
        const defaults = program.defaults || {};

        var data = {},
            groups = program.meta.groups;

        Object.keys( program.groupExclusiveFields ).forEach( function( group, index )
        {
            var length = program.groupExclusiveFields[ group ].length;

            while ( length-- )
            {
                var field = program.groupExclusiveFields[ group ][ length ],
                    defaultValue = {};

                if ( defaults.hasOwnProperty(field) )
                {
                    defaultValue = defaults[ field ];
                }

                // Initialize with existing document data if any
                data[ field ] = doc_data[ field ] ? doc_data[ field ] : [];

                // If no document data, initialize with default value
                if ( !doc_data[ field ] )
                {
                    data[ field ][ 0 ] = defaultValue;
                }

                // If min rows on the group is greater than the data
                // currently in the bucket, then populate the rest
                // of the data with the default data until the
                // arrays are the same length
                if ( groups.hasOwnProperty( group ) &&
                     data[ field ].length < groups[ group ].min )
                {
                    var index = data[ field ].length;

                    while ( index < groups[ group ].min )
                    {
                        data[ field ][ index ] = defaultValue;
                        index++;
                    }
                }
            }
        });

        return Promise.resolve( data );
    },
} );
