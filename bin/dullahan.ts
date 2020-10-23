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
import * as fs from 'fs';
import * as promBundle from 'express-prom-bundle';
import bodyParser = require('body-parser');
import {EventEmitter} from 'events';
import {EventMediator} from '../src/system/EventMediator';
import {HttpClient} from '../src/system/network/HttpClient';
import {ProgramFactory} from '../src/dullahan/program/ProgramFactory';
import {StandardLogger} from '../src/system/StandardLogger';
import {
  accessLogger,
  routeAccessEmitter,
} from '../src/dullahan/middleware/AccessLogger';
import {createConsole} from '../src/system/ConsoleFactory';
import {indication} from '../src/dullahan/controllers/IndicationController';
import {system} from '../src/dullahan/controllers/SystemController';

dotenv.config();

const app = express();
const env = process.env.NODE_ENV;
const log_format = process.env.DULLAHAN_ACCESS_LOG_FORMAT;
const port = process.env.NODE_PORT;
const program_id = process.env.DULLAHAN_PROGRAM_ID;
const rater_path = process.env.DULLAHAN_RATER_PATH;
const service = 'dullahan';
const log_console = createConsole(process.env.LOG_PATH_DEBUG);

if (!env) {
  throw new Error('Unable to determine env.');
} else if (!log_format) {
  throw new Error('Unable to read log_format from env.');
} else if (!port) {
  throw new Error('Unable to read port from env.');
} else if (!program_id) {
  throw new Error('Unable to read program_id from env.');

  // This is set in the dullahan script, not the .env
} else if (!rater_path) {
  throw new Error('Unable to read rater_path from env.');
}

const metricsMiddleware = promBundle({includePath: true});
const ts_ctor = () => <UnixTimestamp>Math.floor(new Date().getTime() / 1000);
const emitter = new EventEmitter();
const http = new HttpClient();
const logger = new StandardLogger(log_console, ts_ctor, env, service);
const program_path = `program/${program_id}/Program`;
/* eslint-disable @typescript-eslint/no-var-requires */
const program = require(program_path);
/* eslint-enable @typescript-eslint/no-var-requires */

const rater_paths = fs
  .readdirSync(rater_path)
  .filter((file: string) => file.match(/\.js$/));

const program_factory = new ProgramFactory(program, rater_paths);

new EventMediator(logger, emitter);

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(metricsMiddleware);
app.use(routeAccessEmitter(emitter));
app.use(accessLogger(log_format));

app.get('/healthcheck', system.healthcheck);
app.post('/indication', indication.create(emitter)(http)(program_factory));

// Start the Express server
const server = app.listen(port, () =>
  logger.info(`Dullahan started at http://localhost:${port}.`)
);

process.on('SIGTERM', () => {
  // events stop working here, switch to regular logger
  logger.info('SIGTERM signal received');

  server.close(() => {
    logger.info('HTTP server closed');

    // We want to use process.exit here because it is the proper way to
    // shut down this service.
    /* eslint-disable no-process-exit */
    process.exit(1);
    /* eslint-enable no-process-exit */
  });
});
