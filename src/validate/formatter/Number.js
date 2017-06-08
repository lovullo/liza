/**
 * @license
 * Number formatter
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
 * Formats numbers in en_US locale
 *
 * Only whole numbers are permitted by default unless the mixin is
 * initialized with a scale, where the scale represents the number of
 * digits of the significand.  If the scale is positive, the
 * significand will be padded with zeroes to meet the scale; if
 * negative, trailing zeroes will be removed.  The significand will be
 * truncated (not rounded) if it exceeds the scale:
 *
 * @example
 *   EchoFormatter.use( Number ).parse( '00003' )          // => 3
 *   EchoFormatter.use( Number( -6 ) ).parse( '3.14159' )  // => 3.14159
 *   EchoFormatter.use( Number( 6 ) ).parse( '3.14159' )   // => 3.141590
 *   EchoFormatter.use( Number( 2 ) ).parse( '3.14159' )   // => 3.14
 *
 * Leading zeroes are stripped.
 */
module.exports = Trait( 'Number' )
    .implement( ValidatorFormatter )
    .extend(
{
    /**
     * Number of digits after the decimal point
     *
     * This value should never be negative.
     *
     * @type {number}
     */
    'private _scale': 0,

    /**
     * Pre-computed zero-padding of scale
     *
     * This conveniently allows prefixing this padding with a number
     * and then truncating to scale.
     *
     * @type {string}
     */
    'private _scalestr': '',


    /**
     * Initialize optional scale
     *
     * The scale SCALE is an optional value that specifies the number
     * of digits after the decimal point to display.  Note that
     * trailing zeros are _not_ removed, making this ideal for
     * i.e. currency.
     *
     * The "scale" terminology comes from the Unix bc tool.  If
     * positive, the significand will be padded with zeros to meet the
     * scale.  If negative, no padding will take place.
     *
     * If the significand has more digits than permitted by SCALE, it
     * is truncated.
     *
     * @param {number} scale number of digits after decimal point
     */
    __mixin: function( scale )
    {
        this._scale    = Math.abs( scale ) || 0;
        this._scalestr = this._padScale( +scale );
    },


    /**
     * Create scale padding for significand
     *
     * @return {string} string with SCALE zeroes
     */
    'private _padScale': function( scale )
    {
        return ( scale > 0 )
            ? ( new Array( this._scale + 1 ) ).join( '0' )
            : '';
    },


    /**
     * Parse item as a number
     *
     * @param {string} data data to parse
     *
     * @return {string} data formatted for storage
     *
     * @throws Error if number is not of a valid format
     */
    'virtual abstract override public parse': function( data )
    {
        var cleaned = this.__super( data ).replace( /[ ,]/g, '' );

        if ( !/^[0-9]*(\.[0-9]*)?$/.test( cleaned ) )
        {
            throw Error( "Invalid number: " + data );
        }

        var parts   = this.split( cleaned );

        return parts.integer + this.scale( parts.significand, this._scale );
    },


    /**
     * Format number with thousands separators
     *
     * @param {string} data data to format for display
     *
     * @return {string} data formatted for display
     */
    'virtual abstract override public retrieve': function( data )
    {
        return this.styleNumber( this.__super( data ) );
    },


    /**
     * Style number with thousands separators
     *
     * @param {string} number number to style (digits only)
     *
     * @return {string} formatted number
     */
    'virtual protected styleNumber': function( number )
    {
        var parts = this.split( number );

        var i     = parts.integer.length,
            ret   = [],
            chunk = '';

        do
        {
            i -= 3;

            // the second argument will adjust the length of the chunk
            // if I is negative (e.g. 3 + -2 = 1)
            chunk = number.substr(
                ( i < 0 ) ? 0 : i,
                Math.min( 3, 3 + i )
            );

            ret.unshift( chunk );
        } while ( i > 0 );

        return ret.join( ',' ) +
            this.scale( parts.significand, this._scale );
    },


    /**
     * Parse significand and return scaled value
     *
     * If the result is non-empty, then the result will be prefixed
     * with a decimal point.
     *
     * Truncation is determined by whether the initial scale was
     * negative.  If so, this method will lack a zero padding string
     * and return a result without trailing zeroes.
     *
     * @param {string} significand value after decimal point
     * @param {number} scale       positive scale
     *
     * @return {string} scaled significand with decimal point as needed
     */
    'virtual protected scale': function( significand, scale )
    {
        if ( scale <= 0 )
        {
            return '';
        }

        // easy cheat: use the pre-filled scale and truncate
        var result = ( significand + this._scalestr ).substr( 0, scale );

        return ( result )
            ? '.' + result
            : '';
    },


    /**
     * Split integer from significand in NUMBER
     *
     * @param {string} number number to split
     *
     * @return {Object.<integer,decimal>} integer and significand
     */
    'virtual protected split': function( number )
    {
        var parts = number.split( '.' );

        return {
            integer:     parts[ 0 ].replace( /^0+/, '' ) || '0',
            significand: ( parts[ 1 ] || '' ).replace( /0+$/, '' ),
        }
    }
} );