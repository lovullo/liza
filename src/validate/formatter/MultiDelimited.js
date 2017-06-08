/**
 * Apply styles to each delimited item individaully
 *
 *  Copyright (C) 2016 R-T Specialty, LLC.
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
 * Applies supertype for each item in a delimited string
 */
module.exports = Trait( 'MultiDelimited' )
    .implement( ValidatorFormatter )
    .extend(
{
    /**
     * Delimited to used in parse input
     * @type {string}
     */
    'private _parse_delim': '',

    /**
     * Delimited to used in retrieve result
     * @type {string}
     */
    'private _retrieve_delim': '',


    /**
     * Initialize with parse and retrieve delimiters
     *
     * Parsing is intended for storage of data, retrieval is intended
     * for display.  When parsing, RETRIEVE_DELIM will be added
     * between parts, and when parsing, PARSE_DELIM will be used
     * instead.
     *
     * If RETRIEVE_DELIM is undefined, it will default to PARSE_DELIM.
     *
     * @param {string}  parse_delim    delimiter on input data for parsing
     * @param {?string} retrieve_delim delimiter on input data for retrieval
     */
    __mixin: function( parse_delim, retrieve_delim )
    {
        this._parse_delim = ''+parse_delim;

        this._retrieve_delim = ( retrieve_delim === undefined )
            ? this._parse_delim
            : ''+retrieve_delim;
    },


    /**
     * Parse each item in a delimited string
     *
     * @param {string} data data to parse
     *
     * @return {string} data formatted for storage
     */
    'virtual abstract override public parse': function( data )
    {
        var _self  = this,
            _super = this.__super;

        return this.forEachPart( this._parse_delim, data, function( part )
        {
            return _super.call( _self, part );
        } ).join( this._retrieve_delim );
    },


    /**
     * Format each item in a delimited string
     *
     * @param {string} data data to format for display
     *
     * @return {string} data formatted for display
     */
    'virtual abstract override public retrieve': function( data )
    {
        var _self  = this,
            _super = this.__super;

        return this.forEachPart( this._retrieve_delim, data, function( part )
        {
            return _super.call( _self, part );
        } ).join( this._parse_delim );
    },


    /**
     * Determine DATA parts from the given delimiter DELIM
     *
     * Subtypes may override this method to change behavior or provide
     * more sophisticated handling.
     *
     * @param {string} delim part delimiter
     * @param {string} data  delimited data
     *
     * @return {Array.<string>} items split by DELIM
     */
    'virtual protected getParts': function( delim, data )
    {
        return ( ''+data ).split( delim );
    },


    /**
     * Invoke CALLBACK for each part in DATA delimited by DELIM
     *
     * TODO: This can go away once ES3 compatibility can be dropped.
     *
     * @param {string} delim part delimiter
     * @param {string} data  delimited data
     *
     * @param {function(string)} callback formatter
     *
     * @return {Array.<string>} formatetd DATA parts as split by DELIM
     */
    'virtual protected forEachPart': function( delim, data, callback )
    {
        var result = [],
            parts  = this.getParts( delim, data );

        // maintain ES3 compatibility
        for ( var i = 0; i < parts.length; i++ )
        {
            result.push( callback( parts[ i ] ) );
        }

        return result;
    }
} );