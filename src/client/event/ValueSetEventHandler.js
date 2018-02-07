/**
 * Value set event handler
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
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

"use strict";

const Class             = require( 'easejs' ).Class;
const EventHandler      = require( './EventHandler' );


/**
 * Set field values
 */
module.exports = Class( 'ValueSetEventHandler' )
    .implement( EventHandler )
    .extend(
{
    /**
     * Client
     * @type {Client}
     */
    'private _client': null,


    /**
     * Initialize with client
     *
     * Ideally we don't want the client (Law of Demeter), but at the point
     * that this class is instantiated, a quote may not yet be
     * initialized.  Refactoring is needed.
     *
     * @param {Client} client
     */
    constructor( client )
    {
        this._client = client;
    },


    /**
     * Set value of specified fields
     *
     * If the destination index exceeds the number of indexes of the source
     * field, the last available source index will be used.  This matches
     * the behavior of assertions.
     *
     * @param {string}             event_id event id
     * @param {function(*,Object)} callback continuation to invoke on completion
     * @param {Object}             data     event data
     *
     * @return {EventHandler} self
     */
    'public handle'(
        event_id, callback, { elementName: field_name, indexes, value }
    )
    {
        const quote    = this._client.getQuote();
        const maxi     = value.length - 1;

        const set_data = indexes.reduce( ( result, desti ) =>
        {
            result[ desti ] = value[ Math.min( desti, maxi ) ];
            return result;
        }, [] );

        quote.setData( { [field_name]: set_data } );
        callback();
    },
} );
