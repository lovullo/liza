/**
 * Lock event handler
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

import {EventHandler} from './EventHandler';
import {Client} from '../Client';
import {ClientAction, ClientActionType} from '../action/ClientAction';

/**
 * Handles lock events
 */
export class LockEventHandler implements EventHandler {
  /**
   * Initializes with client that will delegate the event
   *
   * @param client - client object
   */
  constructor(protected readonly _client: Client) {}

  /**
   * Handles locking
   *
   * @param type - event id; ignored
   * @param c    - continuation to invoke on completion
   * @param data - event data
   */
  handle(_type: ClientActionType, c: () => void, data: ClientAction): this {
    const lock_msg = data.value || 'quote server';

    this._client.getQuote().setExplicitLock(lock_msg);
    this._client.getUi().updateLocked();
    this._client.getUi().showLockedNotification(this._client.isInternal());

    c();

    return this;
  }
}
