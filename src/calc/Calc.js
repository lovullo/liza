/**
 * Contains calculation methods
 *
 *  Copyright (C) 2017 R-T Specialty, LLC.
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

function _each( data, value, callback )
{
    var data_len = data.length,
        result   = [],
        cur_val  = null;

    for ( var i = 0; i < data_len; i++ )
    {
        // index removals are null
        if ( data[ i ] === null )
        {
            continue;
        }

        cur_val = ( value[ i ] !== undefined ) ? value[ i ] : cur_val;

        result.push( callback( data[ i ], cur_val, i ) );
    }

    return result;
}

exports.append = function( data, value )
{
    return _each( data, value, function( arr1, arr2 )
    {
        if( !( arr1 instanceof Array ) )
        {
            arr1 = [ arr1 ];
        }

        return arr1.concat( arr2 );
    });
};

exports.join = function( data, value )
{
    return _each( data, value, function( arr, delimiter )
    {
        if ( !Array.isArray( arr ) )
        {
            arr = [];
        }

        return arr.join( delimiter );
    });
};

exports[ 'if' ] = function( data, value )
{
    var result = [];

    for ( var i = 0; i < data.length; i++ )
    {
        result.push( ( ( data[ i ] === "1" ) ? value[ i ] : '' ) );
    }

    return result;
};

exports.sum = function( data )
{
    var data_len = data.length;

    // calculate and return the sum
    for ( var i = 0, sum = 0; i < data_len; sum += +data[i++] );
    return [ sum ];
};


/**
 * Return an object containing a range of elements
 *
 * @param data  The first value of the sequence of numbers
 * @param value The ending value of the sequence
 *
 * @example range( 1, 3 ) will yield [ "1", "2", "3" ]
 *          range( 5, 2 ) will yield [ "5", "4", "3", "2" ]
 */
exports.range = function( data, value )
{
    var result     = [],
        range_from = data[ 0 ],
        range_to   = value[ 0 ],
        low        = Math.min( range_from, range_to ),
        high       = Math.max( range_from, range_to ),
        index      = 0;

    for ( var i = low; i < high; i++ )
    {
        result[ index ] = ( ''+i );
        index++;
    }

    return ( range_from < range_to )
        ? result
        : result.reverse();
};


exports.length = function( data )
{
    var result = [],
        item   = '',
        i      = 0;

    while ( true )
    {
        item = data[ i++ ];
        if ( ( item === null ) || ( item === undefined ) )
        {
            break;
        }

        var len = ( item[ item.length - 1 ] === null )
            ? item.length - 1
            : item.length;

        result.push( len );
    }

    return result;
};


/**
 * Return the number of elements in the set that optionally match the given
 * value
 */
exports.count = function( data, value )
{
    var len = data.length;

    if ( !( value ) || value.length === 0 )
    {
        return [ ''+( len ) ];
    }

    var count = 0;
    for ( var i = 0; i < len; i++ )
    {
        // intentional lazy cmp
        if ( data[ i ] == value[ 0 ] )
        {
            count++;
        }
    }

    return [ ''+( count ) ];
};


exports.countNonEmpty = function( data, value )
{
    var count = 0;
    for ( var i in data )
    {
        if ( data[ i ] !== '' )
        {
            count++;
        }
    }

    return [ ''+count ];
};


exports.divide = function( data, value )
{
    return _each( data, value, function( val1, val2 )
    {
        return ( +val1 / +val2 );
    } );
};


exports.multiply = function( data, value )
{
    return _each( data, value, function( val1, val2 )
    {
        return ( +val1 * +val2 );
    } );
};


exports.add = function( data, value )
{
    return _each( data, value, function( val1, val2 )
    {
        return ( +val1 + +val2 );
    } );
};


exports.subtract = function( data, value )
{
    return _each( data, value, function( val1, val2 )
    {
        return ( +val1 - +val2 );
    } );
};


exports.date = function()
{
    var now = new Date();

    // return in the YYYY-MM-DD format, since that's what our fields are
    // formatted as
    return [
        now.getFullYear() + '-'
            + ( '0' + ( now.getMonth() + 1 ) ).substr( -2 ) + '-'
            + ( '0' + now.getDate() ).substr( -2 )
    ];
};


exports.userAgent = function()
{
    return ( typeof window !== 'undefined' )
        ? [ window.navigator.userAgent ]
        : [ '' ];
};


exports.relativeDate = function( data, value )
{
    return _each( data, value, function( curdate, format )
    {
        var type = format.substr( -1 ),
            tval = format.substr( 0, format.length - 1 ),
            ms   = 0;

        var now       = ( curdate ) ? new Date( curdate ) : new Date(),
            now_year  = now.getUTCFullYear(),
            now_month = now.getUTCMonth() + 1,
            now_day   = now.getUTCDate(),
            date_new  = null;

        switch ( type )
        {
            // years
            case 'y':
                date_new = new Date(
                    ( now_year + +tval ) + '/' + now_month + '/' + now_day
                );
                break;

            // months
            case 'm':
                date_new = new Date(
                    now_year + '/' + ( now_month + +tval ) + '/' + now_day
                );
                break;

            // days
            case 'd':
                date_new = new Date(
                    now_year + '/' + now_month + '/' + ( now_day + +tval )
                );
                break;

            // seconds
            case 's':
                date_new = new Date( now.getTime() + ( tval * 1000 ) );
                break;

            default:
                return '';
        }

        // return in the YYYY-MM-DD format, since that's what our fields are
        // formatted as
        return date_new.getFullYear() + '-'
            + ( '0' + ( date_new.getMonth() + 1 ) ).substr( -2 ) + '-'
            + ( '0' + date_new.getDate() ).substr( -2 );
    } );
};


exports.copy = function( data )
{
    return data;
};


exports.month = function( data )
{
    // if no reference was provided, return the current month
    if ( data.length === 0 )
    {
        return [ new Date().getMonth() + 1 ];
    }

    // otherwise, get the month from each of the provided dates
    var len    = data.length,
        result = [];

    for ( var i = 0; i < len; i++ )
    {
        result.push(
            new Date(
                Date.parse( data[i].replace( /-/g, '/' ) )
            ).getMonth() + 1
        );
    }

    return result;
};


exports.year = function( data )
{
    // if no reference was provided, return the current year
    if ( data.length === 0 )
    {
        return [ new Date().getFullYear() ];
    }

    // otherwise, get the year from each of the provided dates
    var len    = data.length,
        result = [];

    for ( var i = 0; i < len; i++ )
    {
        if ( data[ i ] === '' )
        {
            result.push( new Date().getFullYear() );
            continue;
        }

        result.push(
            new Date(
                Date.parse( data[i].replace( /-/g, '/' ) )
            ).getFullYear()
        );
    }

    return result;
};


// tests if a value(s) exists in data
exports.isIn = function( data, value )
{
    var all_values_found = false;

    for ( var v_key = 0; v_key < value.length; v_key++ )
    {
        var value_found = false;

        for ( var d_key = 0; d_key < data.length; d_key++ )
        {
            // check to see if this value has a match
            if ( +value[ v_key ] === +data[ d_key ] )
            {
                value_found = true;
            }
        }

        // all values sent in must have a match for isIn to be true
        all_values_found = ( value_found )
            ? true
            : all_values_found;
    }

    return ( all_values_found === true )
        ? [ '1' ]
        : [ '0' ];
};


exports.identical = function( data, value )
{
    // true if all values in data are the same
    var len     = data.length,
        cmp_val = data[ 0 ];

    for ( var i = 0; i < len; i++ )
    {
        // null indicates that the location is marked for deletion
        if ( data[ i ] !== cmp_val && data[ i ] !== null )
        {
            // something doesn't match
            return [ '0' ];
        }
    }

    return [ '1' ];
};


exports.dateDiff = function( data, value )
{
    var data_len = data.length,
        result   = [],
        cmp_ts   = 0;

    for ( var i = 0; i < data_len; i++ )
    {
        // use the last available value for comparison
        if ( value[i] )
        {
            // convert it to a timestamp
            cmp_ts = ( Date.parse( value[i].replace( /-/g, '/' ) ) / 1000 );
        }

        // convert data to timestamp
        var data_ts = ( Date.parse( data[i].replace( /-/g, '/' ) ) / 1000 );

        // if the given date is higher than the comparison value, then a
        // positive number will result, otherwise a negative
        var diff = data_ts - cmp_ts;
        result.push( isNaN( diff ) ? 0 : diff );
    }

    return result;
};


exports.split = function( data, value )
{
    return _each( data, value, function( item, delim )
    {
        // split using the provided delimiter
        return ( ( ''+( item ) ).split( delim ) );
    });
};


exports.keyValue = function( data, value )
{
    return _each( data, value, function( item, index )
    {
        if ( !( item instanceof Array ) )
        {
            return null;
        }

        // return requested index
        return item[ index ];
    });
};


exports.match = function( data, value )
{
    return _each( data, value, function( item, regex )
    {
        return ( ( ''+item ).match( new RegExp( regex ) ) );
    });
};


/**
 * Return min numeric value in data set
 */
exports.min = function( data )
{
    var min_val = +data[ 0 ],
        i       = data.length;

    while ( i-- )
    {
        var cur_val = +data[ i ];
        min_val = ( min_val < cur_val ) ? min_val : cur_val;
    }

    return [ ''+( min_val ) ];
};


/**
 * Finds min numeric value in data set and
 * returns its position
 */
exports.minPos = function( data )
{
    var min_val = +data[ 0 ],
        min_pos = 0;

    for ( var i = 0; i < data.length; i++ )
    {
        var cur_val = +data[ i ];
        if ( cur_val < min_val )
        {
            min_val = cur_val;
            min_pos = i;
        }
    }

    return [ ''+min_pos ];
};


/**
 * Finds max numeric value in data set and
 * returns its position
 */
exports.maxPos = function( data )
{
    var max_val = +data[ 0 ],
        max_pos = 0;

    for ( var i = 0; i < data.length; i++ )
    {
        var cur_val = +data[ i ];
        if ( cur_val > max_val )
        {
            max_val = cur_val;
            max_pos = i;
        }
    }

    return [ ''+max_pos ];
};


/**
 * Return max numeric value in data set
 */
exports.max = function( data )
{
    var max_val = +data[ 0 ],
        i       = data.length,
        result  = [];

    while ( i-- )
    {
        var cur_val = +data[ i ];
        max_val = ( max_val > cur_val ) ? max_val : cur_val;
    }

    return [ ''+( max_val ) ];
};


/**
 * Return array of each unique element in the data set
 */
exports.uniq = function( data )
{
    var found = {},
        uniq  = [],
        i     = data.length;

    while ( i-- )
    {
        var val = data[ i ];

        if ( found[ val ] )
        {
            continue;
        }

        found[ val ] = true;
        uniq.push( val );
    }

    return uniq;
};


/**
 * Join array of elements with a delimiter
 *
 * @param data  The array of values to join
 * @param value The delimiter
 *
 * @example implode( [ "foo", "bar" ], "," ) will yield [ "foo,bar" ]
 */
exports.implode = function( data, value )
{
    return [ ( data.join( value || '' ) ) ];
};


/**
 * Given a regular expression, returns '1' for positive test and '0' for
 * negative.
 */
exports.test = function( data, value )
{
    return _each( data, value, function( item, regex )
    {
        // return '1' for true, '0' for false
        return ''+( +( ( new RegExp( regex ) ).test( item ) ) );
    } );
};


/**
 * Opposite of test
 */
exports.testNot = function( data, value )
{
    return _each( data, value, function( item, regex )
    {
        // return '1' for true, '0' for false
        return ''+( +( !( ( new RegExp( regex ) ).test( item ) ) ) );
    } );
};


/**
 * N-based index
 */
exports.position = function( data, value )
{
    return _each( data, value, function( item, offset, i )
    {
        return +i + ( +offset || 0 );
    } );
};


/**
 * Given a set of indexes, return array of values
 */
exports.value = function( data, indexes )
{
    var len     = indexes.length,
      values  = [],
      key     = 0;

    for ( var i = 0; i < len; i++ )
    {
      key = indexes[ i ];

      if ( data[ key ] !== null )
        {
            // found a value
          values.push( data[ key ] );
        }
        else
      {
          values.push( null );
        }
    }

    return values;
};


exports.repeat = function( data, value )
{
    var times  = value[ 0 ] || 0;
    var result = [];

    while ( times-- > 0 )
    {
        result.push( data );
    }

    return result;
};


exports.repeatConcat = function( data, value )
{
    var times  = value[ 0 ] || 0;
    var result = [];

    while ( times-- > 0 )
    {
        result = result.concat( data );
    }

    return result;
};
exports[ 'void' ] = function()
{
    return [];
};

