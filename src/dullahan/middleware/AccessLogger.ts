import * as fs from 'fs';
import * as morgan from 'morgan';
import {Options} from 'morgan';
import {Request, Response} from 'express';

/**
 * The RSG Access Logger
 *
 * This is a wrapper around the `morgan` library.
 */
export const accessLogger = () => {
  const config = accessLoggerConfigBuilder();
  return morgan(config.format, config.options);
};

/**
 * Builds a config that can be used with the access loger
 */
export const accessLoggerConfigBuilder = (): AccessLoggerConfig => {
  const access_log_format =
    process.env.DULLAHAN_ACCESS_LOG_FORMAT || 'combined';
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
