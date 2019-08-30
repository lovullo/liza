/**
 * Contains date validation/formatting methods
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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
 * Data validation and formatting
 */
module.exports = Class( 'DateValidator',
{
    /**
     * Retrieve the numeric month id, 1-indexed, from the given string
     *
     * @param {string} name month name
     *
     * @return {number} month id, 1-indexed
     */
    'private _getMonthId': function( name )
    {
        // get numerical equivalent of month (getMonth() is 0-indexed)
        var month = ( ( new Date( '1 ' + name + ' 2000' ) )
            .getMonth() + 1
        );

        // if they entered an invalid month string, then we should invalidate the
        // match by throwing an exception
        if ( isNaN( month ) )
        {
            throw TypeError( 'Invalid month' );
        }

        return month;
    },


    'private _validateMonthDay': function( month, day, leapyear )
    {
        if ( month < 1 || month > 12 )
        {
            throw TypeError( 'Invalid month' );
        }

        var lengths = [ 0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

        lengths[2] = leapyear ? 29 : 28;

        if ( day < 1 || day > lengths[month] )
        {
            throw TypeError( 'Invalid day' );
        }
    },


    /**
     * Build a date regular expression
     *
     * @return {RegExp} date regular expression
     */
    'public getDateRegExp': function()
    {
        // made an attempt to format this in a way that is remotely
        // legible, but JS regexes don't support special formatting
        // options like Perl (and consequently PHP's preg_*)
        return new RegExp(
            '^' +
                // 1-2 digit month or day, or 4-digit year, or month name
                '(?:' +
                    '([012]?[0-9]|3[01]|(?:19|20)\\d{2})' +
                    '|([a-zA-Z]{3,})' +
                ')' +
                '[/ -]*' +

                // 1-2 digit month or day, or month name (notice the
                // non-greedy match for the digits, which will
                // ensure that the year takes precidence in bizzare
                // matches like "Oct589")
                '(?:' +
                    '([012]?[0-9]|3[01]?)' +
                    '|([a-zA-Z]{3,})' +
                ')' +
                '[/ -]*' +

                // 1-2 digit day, or 4-digit year
                '(0?[1-9]|1[012]|(?:19|20)?\\d{2})' +
            '$'
        );
    },


    /**
     * Normalizes full date using matches from the date regex
     *
     * @return {string} normalized date string
     */
    'public normalizeFullDate': function( match, p1, p1_str, p2, p2_str, p3 )
    {
        var date_parts = this._normalizeDate.apply( this, arguments );

        return date_parts.join( '-' );
    },


    /**
     * Normalizes short date using matches from the date regex
     *
     * @return {string} normalized date string
     */
    'public normalizeShortDate': function( match, p1, p1_str, p2, p2_str, p3 )
    {
        var shortReg = new RegExp( /^(0?[1-9]|1[012])[ \/]*((19|20)\d{2})$/ ),
            parts    = match.match( shortReg );

        if ( parts )
        {
            // check short date mm/yyyy first
            var parts = shortReg.exec( match ),
                month = parts[1],
                year  = parts[2];

            month = ( month.length < 2 )
                ? '0' + ''+month
                : month;

            return month + '/' + year;
        }
        else
        {
            // the input is more complicated,
            // attempt to normalize the full date
            var date_parts = this._normalizeDate.apply( this, arguments );
            return date_parts[ 1 ] + '/' + date_parts[ 0 ];
        }
    },


    /**
     * Normalizes date using matches from the date regex
     *
     * The match arguments and groups may be confusing; this is because the
     * data they can contain varies drastically. The nomenclature for these
     * parameters comes from MDN.
     *
     * For information on what each specific argument can contain, see their
     * respective match groups in the data regular expression.
     *
     * @param {string} match  full match (entire date string)
     * @param {string} p1     first set match, numeric
     * @param {string} p1_str first set alternative match, string
     * @param {string} p2     second set match (3rd group); numeric
     * @param {string} p2_str second set alternative match; string
     * @param {string} p3     third set match (5th group); numeric
     *
     * @return {Array=} containing date parts year, month, day
     */
    'private _normalizeDate': function( match, p1, p1_str, p2, p2_str, p3 )
    {
        var month, day, year;

        // we cannot reliably determine the date they intended
        // to relay with less than 6 characters (see tests)
        if ( match.length < 6 )
        {
            throw Error( 'Date is too ambigious' );
        }

        // is the year first?
        if ( ( p1 || '' ).length === 4 )
        {
            year  = +p1;
            month = +( p2 || this._getMonthId( p2_str ) );
            day   = +p3;
        }
        // e.g. "5 Oct 2012"
        else if ( p2_str )
        {
            month = +this._getMonthId( p2_str );
            day   = +p1;
            year  = +p3;
        }
        // year is last
        else
        {
            month = +( p1 || this._getMonthId( p1_str ) );
            day   = +p2;
            year  = +p3;
        }

        // format year as a 4-digit year (it is no longer a string, use
        // compare numerically)
        if ( year < 100 )
        {
            // yes, convoluted math; makes intent clear
            var cutoff = ( new Date() ).getFullYear() - 2000 + 10;

            padding = ( year < 10 ) ? '0' : '';

            year = ( year < cutoff )
                ? '20' + padding + year
                : '19' + padding + year;
        }

        this._validateMonthDay(
            month, day, ( ( new Date(year, 1, 29) ).getMonth() == 1 )
        );

        // return date parts
        return [
            year,
            ( ( month < 10 ) ? ( '0' + ''+month ) : month ),
            ( ( day < 10 ) ? ( '0' + ''+day ) : day )
        ];
    }
} );
