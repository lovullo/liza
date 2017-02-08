/**
 * Contains ClientDebugTab interface
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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

var Interface = require( 'easejs' ).Interface;


/**
 * Represents a tab within the developer dialog
 */
module.exports = Interface( 'ClientDebugTab',
{
    /**
     * Retrieve tab title
     *
     * @return {string} tab title
     */
    'public getTitle': [],


    /**
     * Retrieve tab content
     *
     * @param {Client}        client active client being debugged
     * @param {StagingBucket} bucket bucket to reference for data
     *
     * @return {jQuery|string} tab content
     */
    'public getContent': [ 'client', 'bucket' ]
} );

