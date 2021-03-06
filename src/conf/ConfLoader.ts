/**
 * Configuration loader
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

import {readFile} from 'fs';
import {Store} from '../store/Store';

/**
 * Load system configuration from JSON
 *
 * @example
 *   ConfLoader( require( 'fs' ), SomeStore )
 *     .fromFile( 'conf/vanilla-server.json' )
 *     .then( conf => conf.get( 'foo' ) );
 *
 * TODO: Merging multiple configuration files would be convenient for
 * modular configuration.
 */
export class ConfLoader {
  /**
   * Initialize with provided filesystem module and Store constructor
   *
   * The module should implement `#readFile` compatible with
   * Node.js'.  The Store constructor `store_ctor` is used to instantiate
   * new stores to be populated with configuration data.
   *
   * @param fs         - filesystem module
   * @param store_ctor - Store object constructor
   */
  constructor(
    private _fs: {readFile: typeof readFile},
    private _storeCtor: () => Store
  ) {}

  /**
   * Produce configuration from file
   *
   * A Store will be produced, populated with the configuration data.
   *
   * @param filename - path to configuration JSON
   *
   * @return a promise of a populated Store
   */
  fromFile(filename: string): Promise<Store> {
    return new Promise((resolve, reject) => {
      this._fs.readFile(filename, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const store = this._storeCtor();

          resolve(
            this.parseConfData(data)
              .then(parsed => store.populate(parsed))
              .then(_ => store)
          );
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  /**
   * Parse raw configuration string
   *
   * Parses configuration string as JSON.
   *
   * @param data raw configuration data
   *
   * @return `data` parsed as JSON
   */
  protected parseConfData(data: string): Promise<any> {
    return Promise.resolve(JSON.parse(data));
  }
}
