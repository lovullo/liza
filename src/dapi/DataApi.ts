/**
 * Generic interface for data transmission
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

const { Interface } = require( 'easejs' );


/**
 * Result of DataAPI call
 *
 * This seemingly pointless type exists to emphasize that the result of all
 * DataAPI requests is and must be an array.  Overlooking this has been the
 * source of bugs in the past.
 */
export type DataApiResult = DataApiResultItem[];


/**
 * Individual item of DataAPI result
 *
 * Each result contains a set of key/value pairs.  Usually, the value is a
 * string or number, but more complex structures may be used server-side.
 */
export type DataApiResultItem = Record<string, any>;


/**
 * Inputs to the DataAPI
 *
 * Since data originate from the bucket, all values are expected to be
 * strings.
 */
export type DataApiInput = Record<string, string>;


/** Name of DataAPI */
export type DataApiName = NominalType<string, 'DataApiName'>;


/**
 * Generic interface for data transmission
 *
 * This is to replace the below easejs interface; see TODO.
 */
export interface DataApi
{
    request(
        data:     DataApiInput,
        callback: NodeCallback<DataApiResult>,
        id:       string,
    ): this;
}


/**
 * Provies a generic interface for data transmission. The only assumption that a
 * user of this API shall make is that data may be sent and received in some
 * arbitrary, implementation-defined format, and that every request for data
 * shall yield some sort of response via a callback.
 *
 * TODO: Remove in favor of TypeScript interface (requires also converting
 * subtypes)
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
     * @param {?Object<string,string>|string} data     params or post data
     * @param {function(?Error,*):string}     callback continuation upon reply
     * @param {string}                        id       unique dapi identifier
     *
     * @return {DataApi} self
     */
    'public request': [ 'data', 'callback', 'id' ]
} );
