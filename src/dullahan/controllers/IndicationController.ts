/**
 *  Indication Controller
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
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import {EventEmitter} from 'events';
import express = require('express');
import {HttpClient} from '../../system/network/HttpClient';

export class IndicationController {
  /**
   * Create a new indication controller
   *
   * @param _emitter - event emitter
   * @param _http    - HTTP client
   */
  constructor(
    private readonly _emitter: EventEmitter,
    private readonly _http: HttpClient
  ) {}

  /**
   * Handle the indication request
   *
   * @param request  - request object
   * @param response - response object
   */
  public handle(request: express.Request, response: express.Response) {
    let webhook = '';
    if (request.query && request.query.callback) {
      webhook = decodeURIComponent((<any>request.query).callback);
    }

    try {
      this._http.validateUrl(webhook);
    } catch (e) {
      const error_message = 'Request must contain a valid webhook URL.';

      response.status(422).send(error_message);

      this._emitter.emit('error', e);
      return;
    }

    // Send acceptance back to originator
    response.status(202).send('Request received.');

    this._emitter.emit('response-sent', {http_code: 202});

    // TODO: Invoke rating

    // Call back to webhook when rating has completed
    this._http.post(webhook, {}).then(() => {
      // Handle response
    });

    this._emitter.emit('callback-sent', {target: webhook});
  }
}
