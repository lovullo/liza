/**
 *  Access Logger
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

import * as fs from 'fs';
import * as morgan from 'morgan';
import {EventEmitter} from 'events';
import {Options} from 'morgan';
import {NextFunction, Request, Response} from 'express';

/**
 * The RSG Access Logger
 *
 * This is a wrapper around the `morgan` library.
 */
export const accessLogger = (format?: string) => {
  const config = accessLoggerConfigBuilder(format);
  return morgan(config.format, config.options);
};

/**
 * Emit basic info about a request
 *
 * For use as middleware with express
 */
export const routeAccessEmitter = (emitter: EventEmitter) => (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  emitter.emit('request-received', {
    http_method: req.method.toUpperCase(),
    path: req.originalUrl,
  });

  next();
};

/**
 * Builds a config that can be used with the access loger
 */
export const accessLoggerConfigBuilder = (
  format?: string
): AccessLoggerConfig => {
  const access_log_format = format || 'combined';
  const options: Options<Request, Response> = {};

  // we will write the logs to the console unless told otherwise
  if (process.env.DULLAHAN_LOG_PATH_ACCESS) {
    const accessLogStream = fs.createWriteStream(
      process.env.DULLAHAN_LOG_PATH_ACCESS,
      {
        flags: 'a',
      }
    );

    options.stream = accessLogStream;
  }

  return {
    format: access_log_format,
    options: options,
  };
};

/**
 * An interface to use for the access logger's config
 */
interface AccessLoggerConfig {
  format: string;
  options: Options<Request, Response>;
}
