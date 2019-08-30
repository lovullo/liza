/**
 * Holds rating results and metadata
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

var Class = require( 'easejs' ).Class;


module.exports = Class( 'ResultSet',
{
    /**
     * Unique identifier for result set
     * @type {string}
     */
    'private _id': '',

    /**
     * Individual results as separate objects
     * @type {Array.<Object>}
     */
    'private _results': [],

    /**
     * Metadata associated with individual results
     * @type {Array.<Object>}
     */
    'private _meta': [],

    /**
     * Results as a combined object
     * @type {Object}
     */
    'private _mergedResults': {},

    /**
     * Current result index
     * @type {number}
     */
    'private _resulti': 0,

    /**
     * Number of available results
     * @type {number}
     */
    'private _availCount': 0,


    __construct: function( id )
    {
        this._id = ''+id;
    },


    'public addResult': function( result, meta, index )
    {
        if ( index === undefined )
        {
            index = this._resulti++;
        }
        else if ( index > this._resulti )
        {
            index = +index;
            this._resulti = index;
        }

        if ( result._unavailable === '0' )
        {
            this._availCount++;
        }

        this._results[ index ] = result;
        this._meta[ index ]    = meta;
    },


    'public getAvailableCount': function()
    {
        return this._availCount;
    },


    'public getResultCount': function()
    {
        return this._results.length;
    },


    'public getId': function()
    {
        return this._id;
    },


    /**
     * Merge each result into a combined object
     *
     * Each field will contain an array with a value from each result. If a
     * result is missing a field, then the value for that particular index will
     * be defaulted to the empty string.
     *
     * @return {Object} merged results
     */
    'public getMergedResults': function()
    {
        var set    = {},
            fields = {};

        // merge all fields into a single object
        this._results.forEach( function( result, i )
        {
            for ( var field in result )
            {
                ( set[ field ] = set[ field ] || [] )[ i ] = result[ field ];

                fields[ field ] |= 0;
                fields[ field ]++;
            }
        } );

        // fill in gaps in the array (if a field is not defined in a result)
        for ( var field in fields )
        {
            var chk = set[ field ];

            // if the destination array is larger than the number of items it
            // contains, then we have holes to fill
            if ( fields[ field ] === chk.length )
            {
                continue;
            }

            var i = chk.length;
            while ( i-- )
            {
                // default to an empty string
                chk[ i ] = chk[ i ] || '';
            }
        }

        return this._processSet( set );
    },


    'public forEachResult': function( c )
    {
        var i = this._results.length;
        while ( i-- )
        {
            c( this._results[ i ], this._meta[ i ], i );
        }
    },


    'private _processSet': function( set )
    {
        // combined availability
        set._unavailable_all = [
            ( this._availCount === 0 )
                ? '1'
                : '0'
        ];

        return set;
    }
} );

