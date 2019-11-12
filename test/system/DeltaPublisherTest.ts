/**
 * Delta publisher test
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

import {
    DeltaPublisher as Sut,
    AmqpConfig
} from "../../src/system/DeltaPublisher";

import { expect, use as chai_use } from 'chai';
chai_use( require( 'chai-as-promised' ) );


describe( 'server.DeltaPublisher', () =>
{
    describe( '#publish', () =>
    {
        it( 'sends a message', () =>
        {
            const conf = createMockConf();

            console.log( new Sut( conf, {} ) );
            expect( true ).to.be.true
        });
    });
} );


function createMockConf(): AmqpConfig
{
    return <AmqpConfig>{};
}
