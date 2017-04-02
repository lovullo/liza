/**
 * Contains Rater interface
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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

var Interface = require( 'easejs' ).Interface;


/**
 * Represents a rater that will generate a quote from a given set of values
 */
module.exports = Interface( 'Rater',
{
    /**
     * Asynchronously performs rating using the data from the given bucket
     *
     * @param {Quote}      quote to rate
     * @param {function()} callback function to call when complete
     *
     * @return {Rater} self
     */
    'public rate': [ 'quote', 'args', 'callback' ],
} );

