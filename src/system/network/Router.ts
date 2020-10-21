/**
 *  Router abstraction for use with Express
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

/**
 * Permitted request types of the router
 */
enum RequestType {
  GET = 'get',
  POST = 'post',
}

/**
 *  Router abstraction for use with Express
 */
export class Router {
  /**
   * Create a new router
   * @param _app                - Express app
   * @param _controller_factory - used by router to new-up controllers
   * @param _event_emitter      - event emitter
   */
  constructor(
    private readonly _app: express.Application,
    private readonly _controller_factory: (...args: any[]) => any,
    private readonly _event_emitter: EventEmitter
  ) {}

  /**
   * Set up a GET endpoint
   *
   * @param endpoint   - endpoint
   * @param controller - controller to use
   * @param method     - controller method to use
   */
  public get(endpoint: string, controller: any, method: string) {
    this._register(RequestType.GET, endpoint, controller, method);
  }

  /**
   * Set up a POST endpoint
   *
   * @param endpoint   - endpoint
   * @param controller - controller to use
   * @param method     - controller method to use
   */
  public post(endpoint: string, controller: any, method: string) {
    this._register(RequestType.POST, endpoint, controller, method);
  }

  /**
   * Register a route with the app
   *
   * @param request_type - HTTP request type
   * @param endpoint     - endpoint
   * @param controller   - controller to use
   * @param method       - controller method to use
   */
  private _register(
    request_type: RequestType,
    endpoint: string,
    controller: any,
    method: string
  ) {
    this._app[request_type](
      endpoint,
      (req: express.Request, res: express.Response) => {
        this._event_emitter.emit('request-received', {
          http_method: request_type.toUpperCase(),
          path: endpoint,
        });

        this._controller_factory(controller)[method](req, res);
      }
    );
  }
}
