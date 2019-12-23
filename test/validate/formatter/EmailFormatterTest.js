/**
 * @license
 * StringFormat formatter test
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

var liza   = require( '../../../' ),
    Sut    = liza.validate.formatter.EmailFormatter,
    assert = require( 'assert' );


describe( 'validate.formatter.StringFormat', function()
{
    // test email addresses from
    // https://blogs.msdn.microsoft.com/testing123/2009/02/06/email-address-test-cases/
    [
        "email@domain.com",
        "firstname.lastname@domain.com",
        "email@subdomain.domain.com",
        "firstname+lastname@domain.com",
        "1234567890@domain.com",
        "email@domain-one.com",
        "_______@domain.com",
        "email@domain.name",
        "email@domain.co.jp",
        "firstname-lastname@domain.com",
    ].forEach( email_address => assert.equal( Sut.parse( email_address ), email_address ) );

    [
        "",
        "plainaddress",
        "#@%^%#$@#$@#.com",
        "@domain.com",
        "Joe Smith <email@domain.com>",
        "email.domain.com",
        "email@domain@domain.com",
        ".email@domain.com",
        "email.@domain.com",
        "email..email@domain.com",
        "あいうえお@domain.com",
        "email@domain.com (Joe Smith)",
        "email@domain",
        "email@-domain.com",
        "email@domain..com",
        "em,ail@domain.com",
        'em"ail@domain.com',
        "em(ail@domain.com",
        "em)ail@domain.com",
        "em:ail@domain.com",
        "em;ail@domain.com",
        "em<ail@domain.com",
        "em>ail@domain.com",
        "em[ail@domain.com",
        "em]ail@domain.com",
        "em ail@domain.com",
        "em\\ail@domain.com",
    ].forEach( email_address => assert.throws( () => Sut.parse( email_address ), Error ) );
} );
