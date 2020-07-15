/**
 * Priority log typescript type definitions
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
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
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

export declare interface PriorityLog {
  readonly PRIORITY_ERROR: number;
  readonly PRIORITY_IMPORTANT: number;
  readonly PRIORITY_DB: number;
  readonly PRIORITY_INFO: number;
  readonly PRIORITY_SOCKET: number;

  /**
   * Write to the log at the given priority
   *
   * If the priority is less than or equal to the set priority for this
   * object, it will be logged. Otherwise, the message will be ignored.
   *
   * The first argument should be the priority. The remaining arguments should
   * be provided in a sprintf()-style fashion
   *
   * @param priority - logging priority
   * @param ...args  - sprintf-style aruments
   *
   * @return self
   */
  log(priority: number, ...args: Array<string | number>): this;
}
