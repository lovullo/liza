/**
 * Delay event handler
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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

import { EventHandler } from './EventHandler';
import { ClientAction, ClientActionType } from '../action/ClientAction';


/**
 * Handles delay events
 */
export class DelayEventHandler implements EventHandler
{
    /**
     * Initializes with client that will delegate the event
     *
     * @param _client - client object
     */
    constructor( private readonly _client: any ) {}


    /**
     * Handles Delay Events
     *
     * @param _type - event id; ignored
     * @param c     - to invoke on completion
     * @param data  - additional event data
     */
    handle(
        _type: ClientActionType,
        c:     () => void,
        data:  ClientAction
    ): this
    {
        const delay_ms = ( !isNaN( +data.seconds ) ) ? +data.seconds * 1e3 : 0;

        setTimeout( () =>
            {
                const then_action = data.then.action;
                const then_data   = data.then;

                // pass along any arbitrary properties assigned to the action
                // except the action type itself
                delete then_data.action;

                this._client.handleEvent( then_action, then_data, c );
            },
            delay_ms
        );

        return this;
    }
};
