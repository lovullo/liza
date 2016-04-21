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
     * Fields that caused the error
     * @type {?Array.<Field>}
     */
    'private _causes': null,


    /**
     * Create failure with optional reason and causes
     *
     * The field FIELD is the target of the failure, which might have
     * been caused by another field CAUSES.  If cause is omitted, it is
     * assumed to be FIELD.  The string REASON describes the failure.
     *
     * @param {Field}   field  failed field
     * @param {string=} reason description of failure
     * @param {Field=}  causes field that triggered the failure
     */
    __construct: function( field, reason, causes )
    {
        if ( !Class.isA( Field, field ) )
        {
            throw TypeError( "Field expected" );
        }

        if ( causes !== undefined )
        {
            this._checkCauses( causes );
        }

        this._field  = field;
        this._reason = ( reason === undefined ) ? '' : ''+reason;
        this._causes = causes || [ field ];
    },


    /**
     * Validate cause data types
     *
     * Ensures that CAUSES is an array of Field objects; otherwise, throws
     * a TypeError.
     *
     * @param {Array.<Field>} causes failure causes
     *
     * @return {undefined}
     */
    'private _checkCauses': function( causes )
    {
        if ( Object.prototype.toString.call( causes ) !== '[object Array]' )
        {
            throw TypeError( "Array of causes expected" );
        }

        for ( var i in causes )
        {
            if ( !Class.isA( Field, causes[ i ] ) )
            {
                throw TypeError( "Field expected for causes" );
            }
        }
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
     * Unless a separate causes was provided during instantiation, the
     * failure is assumed to have been caused by the target field itself.
     *
     * @return {Array.<Field>} causes of failure
     */
    'public getCauses': function()
    {
        return this._causes;
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
