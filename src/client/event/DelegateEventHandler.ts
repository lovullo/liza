/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Event handler proxy
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

import {EventHandler, EventHandlers} from './EventHandler';
import {UnknownEventError} from './UnknownEventError';
import {ClientActionType} from '../action/ClientAction';

/**
 * Delegates events to an apropriate handler
 *
 * Handlers must be registered to recgonize an event.
 */
export class DelegateEventHandler implements EventHandler {
  /**
   * Initialize delegate with handlers to delegate requests to for each
   * supported event type
   *
   * @param {Object} handlers events as keys, handlers as values
   */
  constructor(private readonly _handlers: EventHandlers) {}

  /**
   * Determines if a handler has been registered for the given type
   *
   * @param {string} type event id
   *
   * @return {boolean} whether a handler exists for the given type
   */
  hasHandler(type: ClientActionType): boolean {
    return this._handlers[type] !== undefined;
  }

  /**
   * Handle an event of the given type
   *
   * An exception will be thrown if the event cannot be handled.
   *
   * The handler should always return itself; if a return value is needed to
   * the caller, then a callback should be provided as an argument to the
   * handler.
   *
   * Additional arguments will be passed to the appropriate handler.
   *
   * @param {string} type event id
   *
   * @return {EventHandler} self
   */
  handle(type: ClientActionType, c: () => void, data: any): this {
    var handler: EventHandler = this._handlers[type];

    // fail if we do not have a handler for this particular event
    if (!handler) {
      throw new UnknownEventError('Unsupported event type: ' + type);
    }

    // delegate
    handler.handle.apply(handler, [type, c, data]);

    return this;
  }
}
