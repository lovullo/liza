/**
 * PSR logger
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
 * PSR-3 style logger
 */

export enum LogLevel {
  DEBUG,
  INFO,
  NOTICE,
  WARNING,
  ERROR,
  CRITICAL,
  ALERT,
  EMERGENCY,
}

export enum LogCode {
  DEBUG = 'debug',
  INFO = 'info',
  NOTICE = 'notice',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
  ALERT = 'alert',
  EMERGENCY = 'emergency',
}

export interface PsrLogger {
  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  debug(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void;

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  info(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void;

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  notice(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void;

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  warning(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void;

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  error(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void;

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  critical(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void;

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  alert(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void;

  /**
   * Log at a debug level
   *
   * @param msg     - the message to log
   * @param context - additional message context
   */
  emergency(
    msg: string | Record<string, unknown>,
    context?: Record<string, unknown>
  ): void;

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
  ): void;
}
