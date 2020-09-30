/**
 * Create a Console object
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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
 */

import {Console} from 'console';
import * as fs from 'fs';

type LogLocation = string | undefined | null;

/**
 * Create a Console object
 *
 * @param log_location (optional) Used to determine how to build the Console
 * @return A Console object that can be used for logging
 */
export const createConsole = (log_location?: LogLocation): Console => {
  // when there is no log_location, use the standard `console`
  if (!log_location) {
    return console;
  }

  const stream = fs.createWriteStream(log_location, {
    flags: 'a',
  });

  return new Console(stream);
};
