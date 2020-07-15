/**
 * UserSession class
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

import {PositiveInteger} from '../../numeric';

/**
 * Session management
 */
export declare class UserSession {
  /**
   * Whether the user is logged in as an internal user
   *
   * @return true if internal user, otherwise false
   */
  isInternal(): boolean;

  /**
   * Gets the agent id, if available
   *
   * @return agent id or undefined if unavailable
   */
  agentId(): PositiveInteger | undefined;

  /**
   * Gets the broker entity id, if available
   *
   * @return agent entity id or undefined if unavailable
   */
  agentEntityId(): PositiveInteger | undefined;

  /**
   * Gets the agent name, if available
   *
   * @return agent name or undefined if unavailable
   */
  agentName(): string | undefined;
}
