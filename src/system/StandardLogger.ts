/**
 * Stdout logger
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
 * Standard out logger implementing PSR-3 standards
 */
import {PsrLogger, LogLevel} from './PsrLogger';

declare type StructuredLog = {
  message: string;
  timestamp: string;
  service: string;
  env: string;
  severity: string;
  context?: Record<string, any>;
};

export class StandardLogger implements PsrLogger {
  /**
   * Initialize logger
   *
   * @param _console
   * @param _ts_ctor - a timestamp constructor
   * @param _env     - The environment ( dev, test, demo, live )
   * @param _service - service that is logging
   */
  constructor(
    private readonly _console: Console,
    private readonly _ts_ctor: () => UnixTimestamp,
    private readonly _env: string,
    private readonly _service: string = 'quote-server'
  ) {}

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  debug(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    this._console.info(this._format(LogLevel.DEBUG, msg, context));
  }

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  info(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    this._console.info(this._format(LogLevel.INFO, msg, context));
  }

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  notice(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    this._console.log(this._format(LogLevel.NOTICE, msg, context));
  }

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  warning(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    this._console.warn(this._format(LogLevel.WARNING, msg, context));
  }

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  error(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    this._console.error(this._format(LogLevel.ERROR, msg, context));
  }

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  critical(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    this._console.error(this._format(LogLevel.CRITICAL, msg, context));
  }

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  alert(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    this._console.error(this._format(LogLevel.ALERT, msg, context));
  }

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  emergency(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    this._console.error(this._format(LogLevel.EMERGENCY, msg, context));
  }

  /**
   * Log a message
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  log(
    level: LogLevel,
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void {
    this._console.error(this._format(level, msg, context));
  }

  /**
   * Get structured log Record<string, unknown>
   *
   * @param msg   - the string or Record<string, unknown> to log
   * @param level - the log level
   * @param context - additional message context
   *
   * @returns a structured logging Record<string, unknown>
   */
  private _format(
    level: LogLevel,
    msg: string | Record<string, unknown>,
    context: Record<string, unknown> = {}
  ): string {
    let str: string;

    if (msg !== null && typeof msg === 'object') {
      str = JSON.stringify(msg);
    } else {
      str = msg;
    }

    const ts = this._ts_ctor();
    const tsFormatted = new Date(ts * 1000).toISOString();

    const structured_log = <StructuredLog>{
      message: str,
      timestamp: tsFormatted,
      service: this._service,
      env: this._env,
      severity: LogLevel[level],
    };

    if (Object.keys(context).length > 0) {
      structured_log['context'] = context;
    }

    return JSON.stringify(structured_log);
  }
}
