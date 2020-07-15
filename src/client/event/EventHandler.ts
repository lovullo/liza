/**
 * Event handling interface
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

import {ClientActionType} from '../action/ClientAction';

export interface EventHandler {
  /**
   * Handle an event of the given type
   *
   * An exception should be thrown if the event cannot be handled.
   *
   * The handler should always return itself; if a return value is needed to
   * the caller, then a callback should be provided as an argument to the
   * handler.
   *
   * @param _type - event id; ignored
   * @param c     - to invoke on completion
   * @param data  - additional event data
   */
  handle(_type: ClientActionType, c: () => void, data: any): this;
}

export type EventHandlers = {
  [P: string]: EventHandler;
};
