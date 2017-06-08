/**
 * Contains common assertions
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

// import creation method
var create = require( './Assertion' ).create;

var explode_flip = function( value )
{
    // 'splody 'sploy!
    // ...we accept a comma-separated list
    var val  = value.split( ',' );
    var dest = {};

    // flip the array (in PHP this is the equivalent of
    // array_flip()) so we can do a hash lookup
    var len = val.length;
    for ( var i = 0; i < len; i++ )
    {
        dest[ val[i] ] = i;
    }

    return dest;
};


/**
 * Asserts that the given value is within a list of expected values
 *
 * @return lovullo.assert.Assertion
 */
exports.any = create( 'any', {
    processDefault: false,

    parseExpected: explode_flip,

    assert: function()
    {
        // same as isIn
        return ( this.expected[ this.given ] !== undefined );
    }
} );


/**
 * Asserts that the given values are between the expected values
 *
 * @return lovullo.assert.Assertion
 */
exports.between = create( 'between', {
    parseExpected: function( value )
    {
        return value.split( ',' );
    },

    assert: function()
    {
        var lower = this.expected[0];
        var upper = this.expected[1];

        return ( ( this.given < lower ) || ( this.given > upper ) )
            ? false
            : true;
    }
});


/**
 * Asserts that the given values are empty
 *
 * @return lovullo.assert.Assertion
 */
exports.empty = create( 'empty', function()
{
    // empty string, 0 integer or 0.00 float (and many variations), or objects
    // that JS considers empty (note that [] will automatically be considered
    // empty due to string cohersion when comparing with the regex)
    return /^(0+\.?0*|0*\.0+)?$/.test( this.given ) || !this.given;
} );



function eqcmp( given, expected )
{
    // if expected is a string whoose integer equivalent converted to a string
    // is the same as its value, then we'll do integer comparisons
    if ( ''+( +given ) === expected )
    {
        given    = +given;
        expected = +expected;
    }
    else
    {
        // otherwise, compare them as strings
        given    = ''+given;
        expected = ''+expected;
    }

    return ( given === expected );
}


/**
 * Asserts that the given value is equal to the expected value
 *
 * @return lovullo.assert.Assertion
 */
exports.equal = create( 'equal', function()
{
    return eqcmp( this.given, this.expected );
});


/**
 * Asserts that the given value is not equal to the expected value
 *
 * @return lovullo.assert.Assertion
 */
exports.notEqual = create( 'notEqual', function()
{
    return !eqcmp( this.given, this.expected );
});


/**
 * Asserts that the given value is greater than the expected value
 *
 * @return lovullo.assert.Assertion
 */
exports.greaterThan = create( 'greaterThan', function()
{
    return ( +this.given > +this.expected )
        ? true
        : false;
});

/**
 * Asserts that the given value is greater or equal to the expected value
 *
 * @return lovullo.assert.Assertion
 */
exports.greaterOrEqualTo = create( 'greaterOrEqualTo', function()
{
    return ( +this.given >= +this.expected )
        ? true
        : false;
});


/**
 * Always returns false
 *
 * @return lovullo.assert.Assertion
 */
exports.fail = create( 'fail', {
    defaultValue: false,

    assert: function()
    {
        return false;
    }
});


/**
 * Asserts that the given value is within a list of expected values
 *
 * @return lovullo.assert.Assertion
 */
exports.isIn = create( 'isIn', {
    parseExpected: explode_flip,

    assert: function()
    {
        return ( this.expected[ this.given ] !== undefined );
    }
});


/**
 * Asserts that the given value is not in a list of values
 *
 * @return lovullo.assert.Assertion
 */
exports.isNotIn = create( 'isNotIn', {
    parseExpected: explode_flip,

    assert: function()
    {
        return ( this.expected[ this.given ] === undefined );
    }
});


/**
 * Asserts that the given value is less than the expected value
 *
 * @return lovullo.assert.Assertion
 */
exports.lessThan = create( 'lessThan', function()
{
    return ( +this.given < +this.expected )
        ? true
        : false;
});


/**
 * Asserts that the given value is less than or equal to the expected value
 *
 * @return lovullo.assert.Assertion
 */
exports.lessOrEqualTo = create( 'lessOrEqualTo', function()
{
    return ( +this.given <= +this.expected )
        ? true
        : false;
});


/**
 * Asserts that the given values are _not_ empty
 *
 * @return lovullo.assert.Assertion
 */
exports.notEmpty = create( 'notEmpty', function()
{
    // just negate what empty returns
    return !( exports.empty.assertSingle(
        this.expected, this.given
    ) );
});


/**
 * Always returns true
 *
 * @return lovullo.assert.Assertion
 */
exports.pass = create( 'pass', function()
{
    return true;
});


/**
 * Asserts that the given value matches the regexp
 *
 * @return lovullo.assert.Assertion
 */
exports.regex = create( 'regex', {
    parseExpected: function( value )
    {
        return new RegExp( value, 'i' );
    },

    assert: function()
    {
        return ( this.expected.test( this.given ) );
    }
});
