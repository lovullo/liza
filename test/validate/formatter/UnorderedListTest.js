/**
 * Tests unordered list formatter
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


var liza          = require( '../../../' ),
    Sut           = liza.validate.formatter.UnorderedList,
    EchoFormatter = liza.validate.formatter.EchoFormatter,
    common        = require( './common' );


describe( 'UnorderedList', function()
{
    common.testValidate( EchoFormatter.use( Sut )(), {
        "":        [ "",        "" ],
        "no semi": [ "no semi", "<ul><li>no semi</li></ul>" ],

        "semi; colon": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        "semi;colon": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        "semi;   colon": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        "semi   ;   colon": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        "semi   ;colon": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        "semi;;;colon": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        "semi ; ;; colon": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        ";semi;colon": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        ";semi": [
            "semi",
            "<ul><li>semi</li></ul>"
        ],
        "  ;   semi": [
            "semi",
            "<ul><li>semi</li></ul>"
        ],
        "semi;colon;": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        ";semi;": [
            "semi",
            "<ul><li>semi</li></ul>"
        ],
        "semi;": [
            "semi",
            "<ul><li>semi</li></ul>"
        ],
        "semi  ;  ": [
            "semi",
            "<ul><li>semi</li></ul>"
        ],
        ";": [
            "",
            ""
        ],
        "  ;  ": [
            "",
            ""
        ],

        // single
        "<ul><li>no semi</li></ul>": [
            "no semi",
            "<ul><li>no semi</li></ul>"
        ],
        // multi
        "<ul><li>semi</li><li>colon</li></ul>": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        // ensure that all li elements are replaced globally
        "<ul><li>foo</li><li>bar</li><li>baz</li></ul>": [
            "foo; bar; baz",
            "<ul><li>foo</li><li>bar</li><li>baz</li></ul>"
        ],
        // extra whitespace
        "  <ul><li>semi  </li>  <li>colon  </li></ul>  ": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        // malformed
        "  <li>semi  </li>  <li>colon  </li></ul>  ": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
        // malformed
        "  <li>no semi  </li>  <li>": [
            "no semi",
            "<ul><li>no semi</li></ul>"
        ],
        // empty node
        "<ul><li>no semi</li><li></li></ul>": [
            "no semi",
            "<ul><li>no semi</li></ul>"
        ],

        // implementation consequence; no way to escape a semicolon
        "<ul><li>semi;colon</li></ul>": [
            "semi; colon",
            "<ul><li>semi</li><li>colon</li></ul>"
        ],
    } );


    common.testMixin(
        EchoFormatter,
        Sut,
        'foo;',
        'bar',
        'foo; bar',
        '<ul><li>foo</li><li>bar</li></ul>'
    );
} );
