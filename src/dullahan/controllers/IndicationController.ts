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
import express = require('express');
import {EventEmitter} from 'events';
import {HttpClient} from '../../../src/system/network/HttpClient';
import {ProgramFactory} from '../program/ProgramFactory';

export const indication = {
  /**
   * Create a new indication
   *
   * @param emitter         - event emitter
   * @param http            - HTTP client
   * @param program_factory - used to generate programs on demand
   * @param request         - request object
   * @param response        - response object
   */
  create: (emitter: EventEmitter) => (http: HttpClient) => (
    program_factory: ProgramFactory
  ) => (request: express.Request) => (response: express.Response) => {
    let webhook = '';

    if (request.query && request.query.callback) {
      webhook = decodeURIComponent((<any>request.query).callback);
    }

    try {
      http.validateUrl(webhook);
    } catch (e) {
      const error_message = 'Request must contain a valid webhook URL.';

      response.status(422).send(error_message);

      emitter.emit('error', e);
      return;
    }

    // Send acceptance back to originator
    response.status(202).send('Request received.');

    emitter.emit('response-sent', {http_code: 202});

    const program = program_factory.createProgram();

    // Temp - just to test that this is working
    console.log(JSON.stringify(program).slice(0, 100) + '...');

    // Call back to webhook when rating has completed
    http.post(webhook, {}).then(() => {
      // Handle response
    });

    emitter.emit('callback-sent', {target: webhook});
  },
};
