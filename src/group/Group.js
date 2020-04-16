/**
 * Group of fields
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

var Class = require( 'easejs' ).Class;


/**
 * Group of fields
 */
module.exports = Class( 'Group',
{
    /**
     * Maximum number of rows permitted
     *
     * Must be 0 by default (not 1) to ensure we are unbounded by default.
     *
     * @type {number}
     */
    'private _maxRows': 0,

    /**
     * Minimum number of rows permitted
     * @type {number}
     */
    'private _minRows': 1,

    /**
     * Whether the group is preventing from adding/removing rows
     * @type {boolean}
     */
    'private _locked': false,

    /**
     * Stores names of fields available in the group (includes linked)
     * @type {Array.<string>}
     */
    'private _fields': [],

    /**
     * Stores names of fields available exclusively in the group (no linked)
     * @type {Array.<string>}
     */
    'private _exclusiveFields': [],

    /**
     * Hashed exclusive fields for quick lookup
     * @type {Object}
     */
    'private _exclusiveHash': {},

    /**
     * Stores names of cmatch fields available exclusively in the group (no linked)
     * @type {Array.<string>}
     */
    'private _exclusiveCmatchFields': [],

    /**
     * Names of fields that are visible to the user
     *
     * For example: excludes external fields, but includes display.
     *
     * @type {Array.<string>}
     */
    'private _userFields': [],

    /**
     * The id of the field that will determine the number of indexes in the
     * group
     *
     * @type {string}
     */
    'private _indexFieldName': '',

    /**
     * If the group should display internal fields
     *
     * @type {boolean}
     */
    'private _isInternal': false,


    /**
     * Gets or sets the maximum numbers of rows that may appear in the group
     *
     * @param Integer max maximum number of rows
     *
     * @return Group|Boolean self if settings, otherwise min rows value
     */
    maxRows: function( max )
    {
        if ( max !== undefined )
        {
            this._maxRows = +max;
            return this;
        }

        return this._maxRows;
    },


    /**
     * Gets or sets the minimum numbers of rows that may appear in the group
     *
     * @param Integer min minimum number of rows
     *
     * @return Group|Boolean self if setting, otherwise the min row value
     */
    minRows: function( min )
    {
        if ( min !== undefined )
        {
            this._minRows = +min;
            return this;
        }

        return this._minRows;
    },


    /**
     * Gets or sets the locked status of a group
     *
     * When a group is locked, rows/groups cannot be removed
     *
     * @param Boolean locked whether the group should be locked
     *
     * @return Group|Boolean self if setting, otherwise locked status
     */
    locked: function( locked )
    {
        if ( locked !== undefined )
        {
            this._locked = !!locked;
            return this;
        }

        return this._locked;
    },


    /**
     * Set names of fields available in the group
     *
     * @param {Array.<string>} fields field names
     *
     * @return {undefined}
     */
    'public setFieldNames': function( fields )
    {
        // store copy of the fields to ensure that modifying the array that was
        // passed in does not modify our values
        this._fields = fields.slice( 0 );

        return this;
    },


    /**
     * Returns the group field names
     *
     * @return {Array.<string>}
     */
    'public getFieldNames': function()
    {
        return this._fields;
    },


    /**
     * Set names of fields available in the group (no linked)
     *
     * @param {Array.<string>} fields field names
     *
     * @return {undefined}
     */
    'public setExclusiveFieldNames': function( fields )
    {
        // store copy of the fields to ensure that modifying the array that was
        // passed in does not modify our values
        this._exclusiveFields = fields.slice( 0 );

        // hash 'em for quick lookup
        var i = fields.length;
        while ( i-- )
        {
            this._exclusiveHash[ fields[ i ] ] = true;
        }

        return this;
    },


    /**
     * Returns the group field names (no linked)
     *
     * @return {Array.<string>}
     */
    'public getExclusiveFieldNames': function()
    {
        return this._exclusiveFields;
    },


    /**
     * Set names of cmatch fields available in the group (no linked)
     *
     * @param {Array.<string>} fields field names
     *
     * @return {Group} self
     */
    'public setExclusiveCmatchFieldNames': function( fields )
    {
        this._exclusiveCmatchFields = fields.slice( 0 );

        return this;
    },


    /**
     * Returns the cmatch fields available in the group
     *
     * @return {Array.<string>}
     */
    'public getExclusiveCmatchFieldNames': function()
    {
        return this._exclusiveCmatchFields;
    },


    'public setUserFieldNames': function( fields )
    {
        this._userFields = fields.slice( 0 );
        return this;
    },


    'public getUserFieldNames': function()
    {
        return this._userFields;
    },


    /**
     * Set flag to display internal fields
     *
     * @param {boolean} internal internal flag
     *
     * @return {Group} self
     */
    'public setInternal': function( internal )
    {
        this._isInternal = !!internal;

        return this;
    },


    /**
     * Get flag to display internal fields
     *
     * @return {boolean}
     */
    'public isInternal': function()
    {
        return this._isInternal;
    },


    /**
     * Returns whether the group contains the given field
     *
     * @param {string} field name of field
     *
     * @return {boolean} true if exclusively contains field, otherwise false
     */
    'public hasExclusiveField': function( field )
    {
        return !!this._exclusiveHash[ field ];
    },


    'public setIndexFieldName': function( name )
    {
        this._indexFieldName = ''+name;
        return this;
    },


    'public getIndexFieldName': function()
    {
        return this._indexFieldName;
    }
} );
