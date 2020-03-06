/**
 * Tests DelayEventHandler
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

'use strict';

import { expect } from 'chai';
import { DelayEventHandler as Sut } from '../../../src/client/event/DelayEventHandler';
import { ClientActionType, ClientAction } from '../../../src/client/action/ClientAction';

describe( 'DelayEventHandler', () =>
{
    it( "handles delay event with the expected delay", done =>
    {
        let handle_event_called = false;
        let set_timeout_called  = false;
        let actual_action       = '';
        let actual_data: any    = null;
        let actual_delay        = 0;

        const expected_delay  = 25000;
        const expected_action = 'foobar';
        const expected_data   = { indv: 'retry' };

        const client = {
            handleEvent: ( event_type: ClientActionType, data: any ) => {
                actual_action = event_type;
                actual_data   = data;

                handle_event_called = true;
            },
        };

        const action: ClientAction = {
            'action': 'delay',
            'seconds': 25,
            'then': {
                'action': expected_action,
            }
        };

        const sut = new Sut( client );

        const old_setTimeout = global.setTimeout;

        global.setTimeout = (
            callback: (...args: any[]) => void,
            delay: number
        ) =>
        {
            set_timeout_called = true;
            actual_delay       = delay;

            callback();

            return new NodeJS.Timeout();
        }

        try {
            sut.handle(
                "delay",
                () =>
                {
                    expect( actual_action ).to.equal( expected_action );
                    expect( actual_data ).to.equal( expected_data );
                    done();
                },
                action
            )
        }
        catch( e ) {}
        finally
        {
            global.setTimeout = old_setTimeout;
        }

        expect( set_timeout_called ).to.equal( true );
        expect( handle_event_called ).to.equal( true );
        expect( actual_delay ).to.equal( expected_delay );
        done();
    } ),


    it( "Delay defaults to zero on non-numeric seconds", done =>
    {
        let set_timeout_called = false;
        let actual_delay       = -1;

        const expected_delay = 0;

        const client = {
            handleEvent: ( _: ClientActionType, __: any ) => {},
        };

        const action: ClientAction = {
            'action': 'delay',
            'seconds': 'string-foo',
            'then': {
                'action': 'foo',
            }
        };

        const sut = new Sut( client );

        const old_setTimeout = global.setTimeout;

        global.setTimeout = (
            callback: (...args: any[]) => void,
            delay: number
        ) =>
        {
            set_timeout_called = true;
            actual_delay       = delay;

            callback();

            return new NodeJS.Timeout();
        }

        try { sut.handle( "delay", () => {}, action ) }
        catch( e ) {}
        finally { global.setTimeout = old_setTimeout; }

        expect( set_timeout_called ).to.equal( true );
        expect( actual_delay ).to.equal( expected_delay );
        done();
    } ),


    it( "Calls callback function and returns itself", done =>
    {
        let callback_called = false;
        let returned        = null;

        const client = {
            handleEvent: ( _: ClientActionType, __: any, cb: any ) => { cb() },
        };

        const action: ClientAction = {
            'action': 'delay',
            'seconds': 0,
            'then': {
                'action': 'foo',
            }
        };

        const sut = new Sut( client );

        const old_setTimeout = global.setTimeout;

        global.setTimeout = (
            callback: ( ...args: any[] ) => void,
            _: number
        ) =>
        {
            callback();

            return <NodeJS.Timeout>{};
        }

        try
        {
            returned = sut.handle(
                "delay",
                () => { callback_called = true },
                action
            );
        }
        catch( e ) { console.log( e )}
        finally { global.setTimeout = old_setTimeout; }

        expect( callback_called ).to.equal( true );
        expect( returned ).to.deep.equal( sut );
        done();
    } );
} )
