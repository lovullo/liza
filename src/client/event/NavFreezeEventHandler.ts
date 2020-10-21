/**
 * Nav lock event handler
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
 * Handles nav freeze events
 */
export class NavFreezeEventHandler implements EventHandler {
  /**
   * Initializes with client that will delegate the event
   *
   * @param client - client object
   */
  constructor(protected readonly _client: Client) {}

  /**
   * Handles nav freezing
   *
   * @param type - event id; ignored
   * @param c    - continuation to invoke on completion
   * @param data - event data
   */
  handle(_type: ClientActionType, c: () => void, data: ClientAction): this {
    if (this._client.getQuote().isLocked()) {
      c();

      return this;
    }

    const lock_msg = data.value || 'Navigation is locked';
    const notify_content = this._client.getDocument().createElement('div');

    notify_content.innerHTML = '<div class="text">' + lock_msg + '</div>';

    this._client.getUi().showNotifyBar(notify_content).freezeNav();

    c();

    return this;
  }
}
