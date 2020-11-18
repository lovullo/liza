/**
 * UserSession class
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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
 *
 * @todo this is very tightly coupled with LoVullo's system
 */

import {EventEmitter} from 'events';
import {unserialize} from 'php-serialize';
import {PositiveInteger} from '../../numeric';

/**
 * Session management
 */
export class UserSession extends EventEmitter {
  /** Session Data */
  private _data: Record<string, any> = {};

  /**
   * Initializes a session from an existing PHP session
   *
   * @param _id       - session id
   * @param _memcache - memcache client used to access session
   * @param _data     - session data
   *
   * @return undefined
   */
  constructor(
    private readonly _id: string = '',
    private readonly _memcache: any
  ) {
    super();
    // parse the session data
    this._getSessionData(data => {
      this._data = data === null ? {} : data;

      // session data is now available
      this.emit('ready', data);
    });
  }

  /**
   * Returns the session data
   *
   * @return session data
   */
  getData(): Record<string, any> {
    return this._data;
  }

  /**
   * Returns whether the user is currently logged in
   *
   * This is determined simply by whether the agent id is available.
   *
   * @return whether the user is logged in or not
   */
  isLoggedIn(): boolean {
    return this._data.agentID !== undefined ? true : false;
  }

  /**
   * Gets the agent id, if available
   *
   * @return agent id or undefined if unavailable
   */
  agentId(): number | undefined {
    return this._data.agentID !== undefined ? +this._data.agentID : undefined;
  }

  /**
   * Gets the agent name, if available
   *
   * @return agent name or undefined if unavailable
   */
  agentName(): string | undefined {
    return this._data.agentNAME || undefined;
  }

  /**
   * Gets the agency number, if available
   *
   * @return agency number or undefined if unavailable
   */
  agencyNumber(): string | undefined {
    return this._data.retail_agency_num || undefined;
  }

  /**
   * Gets the user name, if available
   *
   * @return user name or undefined if unavailable
   */
  userName(): string | undefined {
    return this._data.user_name || undefined;
  }

  /**
   * Whether the user is logged in as an internal user rather than a broker
   *
   * @return true if internal user, otherwise false
   */
  isInternal(): boolean {
    return this.agentId() === 900000 ? true : false;
  }

  /**
   * Sets the agent id
   *
   * @param id - the agent id
   */
  setAgentId(id: number) {
    this._data.agentID = id;
    return this;
  }

  /**
   * Gets the broker entity id, if available
   *
   * @return agent entity id or undefined if unavailable
   */
  agentEntityId(): PositiveInteger | undefined {
    return this._data.broker_entity_id || undefined;
  }

  /**
   * Parses PHP session data from memcache and returns an object with the data
   *
   * @param callback - function to call with parsed data
   *
   * @return Object parsed session data
   */
  private _getSessionData(callback: (data: any) => void): void {
    this._memcache.get(this._id, (err: any, data: any) => {
      if (err || data === null) {
        // failure
        callback(null);
        return;
      }

      const session_data: Record<string, any> = {};

      if (data) {
        // Due to limitations of Javascript's regex engine, we need to do
        // this in a series of steps. First, split the string to find the
        // keys and their serialized values.
        const splits = data.split(/(\w+?)\|/);
        const len = splits.length;

        // associate the keys with their values
        for (let i = 1; i < len; i++) {
          const key: string = splits[i];
          let val: string = splits[++i];

          // the values are serialized PHP data; unserialize them
          val = unserialize(val);

          // add to the session data
          session_data[key] = val;
        }
      }

      // return the parsed session data
      callback(session_data);
    });
  }
}
