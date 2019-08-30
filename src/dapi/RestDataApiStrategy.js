/**
 * RestDataApiStrategy interface
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

var Interface = require( 'easejs' ).Interface;


/**
 * Represents a strategy used to request data from a RESTful service
 *
 * Such may be used to implement GET, POST, PUT, DELETE, etc.
 */
module.exports = Interface( 'RestDataApiStrategy',
{
    /**
     * Request data from the service
     *
     * @param {Object}           data     request params
     * @param {function(Object)} callback server response callback
     *
     * @return {RestDataApi} self
     */
    'public requestData': [ 'url', 'data', 'callback' ]
} );

