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

        // initialize to an array with a single element of the default value
        return Promise.resolve(
            Object.keys( defaults ).reduce(
                ( data, key ) => ( data[ key ] === undefined )
                    ? ( data[ key ] = [ defaults[ key ] ], data )
                    : data,
                doc_data || {}
            )
        );
    },
} );
