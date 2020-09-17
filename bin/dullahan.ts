/**
 *  Dullahan daemon
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

import * as dotenv from 'dotenv-flow';
import * as express from 'express';
import bodyParser = require('body-parser');
import {EventEmitter} from 'events';
import {EventMediator} from '../src/system/EventMediator';
import {HttpClient} from '../src/system/network/HttpClient';
import {IndicationController} from '../src/dullahan/controllers/IndicationController';
import {Router} from '../src/system/network/Router';
import {StandardLogger} from '../src/system/StandardLogger';

dotenv.config({path: '..'});

const app = express();
const env = process.env.NODE_ENV || 'local';
const port = process.env.DULLAHAN_PORT;
const service = 'dullahan';

if (!port) {
  throw new Error('Unable to read port from .env');
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const ts_ctor = () => <UnixTimestamp>Math.floor(new Date().getTime() / 1000);
const emitter = new EventEmitter();
const http_client = new HttpClient();
const logger = new StandardLogger(console, ts_ctor, env, service);

new EventMediator(logger, emitter);

/**
 * Create a quick factory to new-up controllers
 *
 * @param event_emitter - event emitter
 * @param http_client   - HTTP client
 *
 * @return controller maker
 */
const controller_factory = (
  event_emitter: EventEmitter,
  http_client: HttpClient
) => {
  return (controller: Constructable<any>) => {
    return new controller(event_emitter, http_client);
  };
};

// Create a new router and set up all endpoints
const route = new Router(
  app,
  controller_factory(emitter, http_client),
  emitter
);

route.post('/indication', IndicationController, 'handle');

// Start the Express server
app.listen(port, () =>
  console.log(`Dullahan started at http://localhost:${port}\n.`)
);
