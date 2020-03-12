/**
 * Client system
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
 */

"use strict";

const { Cmatch } = require( '../client/Cmatch' );
const field  = require( '../field' );
const store  = require( '../store' );


/**
 * Typical client system
 *
 * This serves as a factory of sorts for the user-facing client that runs in
 * the web browser.
 *
 * This is incomplete; it will be added to as code is ported to liza.
 */
module.exports = {
    cmatch: ( program, client ) => new Cmatch(
        field.FieldClassMatcher( program.whens ),
        program,
        client
    ),

    data: {
        /**
         * Create a store suitable for comparing diffs
         *
         * This relies very much on assumptions about how the rest of the
         * system works:
         *   - bstore expects the diff format to be provided directly to it;
         *   - cstore expects a full classification result set with which
         *     _it_ will compute the diff; and
         *   - the outer store proxies to cstore for 'c:*'.
         */
        diffStore: () => {
            const cstore = store.DiffStore();
            const bstore = store.MemoryStore();

            const proxy = store.MemoryStore.use(
                store.PatternProxy( [
                    [ /^c:(.*)$/, cstore ],
                    [ /./,        bstore ],
                ] )
            )();

            // TODO: breaking encapsulation should not be necessary in the
            // future
            return {
                store:  proxy,
                cstore: cstore,
                bstore: bstore,
            };
        },
    },
};
