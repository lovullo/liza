/* TODO auto-generated eslint ignore, please fix! */
/* eslint @typescript-eslint/no-inferrable-types: "off" */
/**
 * Event Meditator
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of liza.
 *
 *  liza is free software: you can redistribute it and/or modify
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
 *
 * Hook events and log them
 */

import {EventEmitter} from 'events';
import {PsrLogger} from './PsrLogger';
import {hasContext} from '../error/ContextError';

export class EventMediator {
  /**
   * Initialize mediator
   *
   * @param _log     - A PSR-3 style logger
   * @param _emitter - An event emitter
   */
  constructor(
    private readonly _log: PsrLogger,
    private readonly _emitter: EventEmitter
  ) {
    this._emitter.on('delta-publish', msg =>
      this._log.notice('Published delta to exchange', msg)
    );

    this._emitter.on('document-processed', msg =>
      this._log.notice(
        'Deltas on document processed successfully. Document has been ' +
          'marked as completely processed.',
        msg
      )
    );

    this._emitter.on('amqp-conn-warn', msg =>
      this._log.warning('AMQP Connection Error', msg)
    );

    this._emitter.on('amqp-reconnect', () =>
      this._log.warning('...attempting to re-establish AMQP connection')
    );

    this._emitter.on('amqp-reconnected', () =>
      this._log.warning('AMQP re-connected')
    );

    this._emitter.on('error', arg => this._handleError(arg));
  }

  /**
   * Handle an error event
   *
   * @param e - any
   */
  private _handleError(e: any): void {
    let msg: string = '';
    let context: Record<string, any> = {};

    if (e instanceof Error) {
      msg = e.message;

      if (hasContext(e)) {
        context = e.context;
      }

      context.stack = e.stack;
    }

    this._log.error(msg, context);
  }
}
