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
import {Request, Response} from 'express';
import {EventEmitter} from 'events';
import {HttpClient} from '../../../src/system/network/HttpClient';
import {ProgramFactory} from '../program/ProgramFactory';
import {
  CustomRater,
  RaterFactory,
  getDummyQuote,
  getDummySession,
} from '../program/RaterFactory';

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
  ) => (rater_factory: RaterFactory) => (
    request: Request,
    response: Response
  ) => {
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

    const {bucket} = program_factory.createProgram(request.body);

    const quote = getDummyQuote(bucket);
    const session = getDummySession();
    const indv = '';

    const onSuccess = (rdata: CommonObject, _actions: CommonObject) => {
      // Call back to webhook when rating has completed
      http
        .post(webhook, rdata)
        .then(response => {
          emitter.emit('callback-success', {response});
        })
        .catch(error => {
          emitter.emit('callback-failure', {error});
        });

      emitter.emit('callback-sent', {target: webhook});
    };

    const onFailure = (msg: string) => emitter.emit('rate-error', {msg});

    rater_factory.createRaters().forEach((rater: CustomRater) => {
      rater.rate(quote, session, indv, onSuccess, onFailure);
    });
  },
};
