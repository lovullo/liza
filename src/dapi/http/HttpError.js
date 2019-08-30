/**
 * Error representing non-200 HTTP status code
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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
 * Represents error in performing HTTP request
 */
module.exports = Class( 'HttpError' )
    .extend( Error,
{
    /**
     * HTTP status code
     * @type {number}
     */
    'public statuscode': 500,


    /**
     * Set error message and HTTP status code
     *
     * The HTTP status code defaults to 500 if not set.  No check is
     * performed to determine whether the given status code is a valid error
     * code.
     *
     * The mesage is _not_ automatically set from the status code.
     *
     * @param {string}  message    error message
     * @param {number=} statuscode HTTP status code
     */
    __construct( message, statuscode )
    {
        this.statuscode = statuscode || 500;
    },
} );
