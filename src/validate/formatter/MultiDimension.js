/**
 * Multi-dimensional array formatting
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

var Trait              = require( 'easejs' ).Trait,
    ValidatorFormatter = require( '../ValidatorFormatter' );


/**
 * Applies supertype for each item in a vector
 */
module.exports = Trait( 'MultiDimension' )
    .implement( ValidatorFormatter )
    .extend(
{
    /**
     * Delimiter to combine values
     * @type {string}
     */
    'private _delim': '',


    /**
     * Initialize delimiter for parsing and retrieval
     *
     * DELIM will be used to split during parsing, and will be used to
     * join formatted strings during retrieval.
     *
     * @param {string} delim delimiter
     */
    __mixin: function( delim )
    {
        this._delim = ''+delim;
    },


    /**
     * Parse each item into a vector
     *
     * @param {string} data data to parse
     *
     * @return {Array} vector of data formatted for storage
     */
    'virtual abstract override public parse': function( data )
    {
        var split = data.split( this._delim );

        // maintain ES3 compatibility (no map)
        for ( var i = 0; i < split.length; i++ )
        {
            split[ i ] = this.__super( split[ i ] );
        }

        return split;
    },


    /**
     * Join formatted vector elements into a delimited string
     *
     * If DATA is not a vector, it will be treated as though it were a
     * vector with a single element `[DATA]'.
     *
     * If all elements of DATA are the same value, then only that
     * value will be returned; there will be no delimiters.  This
     * might be problematic if #parse is subsequently used, since that
     * would change the number of elements in the vector.
     *
     * @param {Array|string} data vector to parse
     *
     * @return {string} delimited string
     */
    'virtual abstract override public retrieve': function( data )
    {
        // pretend non-arrays are single-element vectors
        if ( Object.prototype.toString.call( data ) !== '[object Array]' )
        {
            return this.__super( data );
        }

        var parsed = [],
            same   = true;

        // must maintain ES3 support; no forEach
        for ( var i = 0; i < data.length; i++ )
        {
            parsed[ i ] = this.__super( data[ i ] );

            same = same && (
                ( i === 0 )
                || ( parsed[ i - 1 ] === parsed[ i ] )
            );
        }

        return ( same )
             ? parsed[ 0 ]
             : parsed.join( this._delim );
    }
} );
