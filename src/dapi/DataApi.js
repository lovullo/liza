/**
 * Generic interface for data transmission
 *
 *  Copyright (C) 2014 LoVullo Associates, Inc.
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
 * Provies a generic interface for data transmission. The only assumption that a
 * user of this API shall make is that data may be sent and received in some
 * arbitrary, implementation-defined format, and that every request for data
 * shall yield some sort of response via a callback.
 */
module.exports = Interface( 'DataApi',
{
    /**
     * Perform an asynchronous request and invoke the callback with the reply
     *
     * If an implementation is synchronous, the callback must still be invoked.
     *
     * The data format is implementation-defined. The data parameter is
     * documented as binary as it is the most permissive, but any data may be
     * transferred that is supported by the protocol.
     *
     * The first parameter of the callback shall contain an Error in the event
     * of a failure; otherwise, it shall be null.
     *
     * @param {string}             data     binary data to transmit
     * @param {function(?Error,*)} callback continuation upon reply
     *
     * @return {DataApi} self
     */
    'public request': [ 'data', 'callback' ]
} );
