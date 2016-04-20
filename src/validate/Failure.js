/**
 * Validation failure
 *
 *  Copyright (C) 2016 LoVullo Associates, Inc.
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

var Class = require( 'easejs' ).Class,
    Field = require( '../field/Field' );


/**
 * Represents a field validation failure
 */
module.exports = Class( 'Failure',
{
    /**
     * Failure field
     * @type {Field}
     */
    'private _field': null,

    /**
     * Validation failure reason
     * @type {string}
     */
    'private _reason': '',

    /**
     * Field that caused the error
     * @type {?Field}
     */
    'private _cause': null,


    /**
     * Create failure with optional reason and cause
     *
     * The field FIELD is the target of the failure, which might have
     * been caused by another field CAUSE.  If cause is omitted, it is
     * assumed to be FIELD.  The string REASON describes the failure.
     *
     * @param {Field}   field  failed field
     * @param {string=} reason description of failure
     * @param {Field=}  cause  field that triggered the failure
     */
    __construct: function( field, reason, cause )
    {
        if ( !Class.isA( Field, field ) )
        {
            throw TypeError( "Field expected" );
        }

        if ( ( cause !== undefined ) && !Class.isA( Field, cause ) )
        {
            throw TypeError( "Field expected for cause" );
        }

        this._field  = field;
        this._reason = ( reason === undefined ) ? '' : ''+reason;
        this._cause  = cause || field;
    },


    /**
     * Retrieve target of the failure
     *
     * @return {Field} target field
     */
    'public getField': function()
    {
        return this._field;
    },


    /**
     * Retrieve a description of the failure, or the empty string
     *
     * @return {string} failure description
     */
    'public getReason': function()
    {
        return this._reason;
    },


    /**
     * Retrieve field that caused the failure
     *
     * Unless a separate cause was provided during instantiation, the
     * failure is assumed to have been caused by the target field itself.
     *
     * @return {Field} cause of failure
     */
    'public getCause': function()
    {
        return this._cause;
    },


    /**
     * Produce failure reason when converted to a string
     *
     * This allows the failure to be used in place of the traditional system
     * of error strings.
     *
     * @return {string}
     */
    __toString: function()
    {
        return this._reason;
    }
} );
