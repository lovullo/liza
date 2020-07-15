/**
 * Start the Liza Server
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework.
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

import fs = require('fs');
import path = require('path');

import {ConfLoader} from '../src/conf/ConfLoader';
import {ConfStore} from '../src/conf/ConfStore';
import * as version from '../src/version';

// kluge for now
const conf_path =
  (process.argv[2] === '-c' ? process.argv[3] : '') ||
  __dirname + '/../conf/vanilla-server.json';

const conf_dir = path.dirname(conf_path);

new ConfLoader(fs, ConfStore)
  .fromFile(conf_path)
  .then(conf =>
    Promise.all([
      conf.get('name'),
      conf.get('daemon'),
      conf.get('pidfile'),
      Promise.resolve(conf),
    ])
  )
  .then(([name, daemon, pidfile, conf]) => {
    const daemon_path = _resolvePath(conf_dir, daemon);
    const pid_path = _resolvePath(conf_dir, pidfile || '.pid');

    writePidFile(pid_path);
    greet(name, pid_path);

    return require(daemon_path)(conf).start();
  })
  .catch(e => {
    console.error(e.stack);
    process.exit(1);
  });

/**
 * Produce an absolute path if `path` is absolute, otherwise a path relative
 * to the configuration directory
 *
 * @param conf_path - configuration path (for relative `path`)
 * @param path      - path to resolve
 *
 * @return resolved path
 */
function _resolvePath(conf_path: string, path: string): string {
  return path[0] === '/' ? path : conf_path + '/' + path;
}

/**
 * Write process id (PID) file
 *
 * @param pid_path - path to pid file
 */
function writePidFile(pid_path: string): void {
  fs.writeFileSync(pid_path, '' + process.pid);

  process.on('exit', () => fs.unlink(pid_path, () => {}));
}

/**
 * Output greeting
 *
 * The greeting contains the program name, version, configuration path,
 * and PID file path.
 *
 * @param name     - program name
 * @param pid_path - path to PID file
 */
function greet(name: string, pid_path: string): void {
  console.log(`${name} (liza-${version})`);
  console.log(`Server configuration: ${conf_path}`);
  console.log(`PID file: ${pid_path}`);
}
