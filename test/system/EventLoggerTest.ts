/**
 * Event logger test
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

import { EventLogger as Sut } from '../../src/system/EventLogger';
import { EventEmitter } from "events";
import { expect } from 'chai';

const sinon = require( 'sinon' );

declare interface MockConsole extends Console {
    getLevel(): string,
}

describe( 'system.EventLogger captures and logs events', () =>
{
    [
        {
            event_id:      'document-processed',
            console_level: 'log',
        },
        {
            event_id:      'delta-publish',
            console_level: 'log',
        },
        {
            event_id:      'amqp-conn-error',
            console_level: 'warn',
        },
        {
            event_id:      'amqp-reconnect',
            console_level: 'warn',
        },
        {
            event_id:      'amqp-reconnect-fail',
            console_level: 'error',
        },
        {
            event_id:      'avro-err',
            console_level: 'error',
        },
        {
            event_id:      'dao-err',
            console_level: 'error',
        },
        {
            event_id:      'publish-err',
            console_level: 'error',
        },
    ].forEach( ( { event_id, console_level } ) =>
    {
        it( event_id + ' triggers console output level: ' + console_level, () =>
        {
            const emitter = new EventEmitter();
            const con     = createMockConsole();
            const env     = 'test';

            new Sut( con, env, emitter, ts_ctr );

            emitter.emit( event_id );

            expect( con.getLevel() ).to.equal( console_level );
        } );
    } );
} );


function ts_ctr(): UnixTimestamp
{
    return <UnixTimestamp>Math.floor( new Date().getTime() / 1000 );
}


function createMockConsole(): MockConsole
{
    const mock = sinon.mock( console );

    mock.level    = '';
    mock.info     = ( _str: string ) => { mock.level = 'info'; };
    mock.log      = ( _str: string ) => { mock.level = 'log'; };
    mock.warn     = ( _str: string ) => { mock.level = 'warn'; };
    mock.error    = ( _str: string ) => { mock.level = 'error'; };
    mock.getLevel = () => mock.level;

    return mock;
}