/**
 * Test case for XhttpQuoteTransport
 *
 *  Copyright (C) 2018 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

"use strict";

const expect = require( 'chai' ).expect;
const Class  = require( 'easejs' ).Class;

const { XhttpQuoteTransport: Sut } = require( '../../../' ).client.transport;


describe( "XhttpQuoteTransport", () =>
{
    it( "truncates index removals", done =>
    {
        // before truncating
        const bucket = { getFilledDiff: () => ( {
            none:           [ 'no', 'truncate' ],
            empty:          [],
            one_null:       [ null ],
            all_null:       [ null, null, null ],
            tail_null:      [ 'a', 'b', null ],
            tail_null_many: [ 'a', 'b', null, null, null ],
            undefined_null: [ undefined, 'b', undefined, null, null ],

            // this shouldn't ever happen, but let's make sure the behavior
            // is sane anyway
            bs: [ null, 'should', 'not', 'ever', 'happen' ],
        } ) };

        // after truncating
        const expected_data = {
            none:           [ 'no', 'truncate' ],
            empty:          [],
            one_null:       [ null ],
            all_null:       [ null ],
            tail_null:      [ 'a', 'b', null ],
            tail_null_many: [ 'a', 'b', null ],
            undefined_null: [ null, 'b', null, null ],
            bs:             [ null ],
        };

        const stub_quote  = { visitData: c => c( bucket ) };

        const mock_proxy = {
            post( _, data )
            {
                expect( JSON.parse( data.data ) )
                    .to.deep.equal( expected_data );

                done();
            },
        };

        Sut( '', mock_proxy ).send( stub_quote );
    } );
} );
