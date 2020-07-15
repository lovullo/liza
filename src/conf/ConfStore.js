/**
 * Ideal Store for system configuration
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

'use strict';

const {AutoObjectStore, DelimitedKey, MemoryStore} = require('../').store;

/**
 * A store that recursively instantiates itself
 *
 * This store is ideal for nested configurations, and handles cases where
 * configuration might be asynchronously retrieved.  Nested values may be
 * retrieved by delimiting the key with `.` (e.g. `foo.bar.baz`); see
 * trait `DelimitedKey` for more information and examples.
 */
exports.ConfStore = function ConfStore() {
  return MemoryStore.use(AutoObjectStore(ConfStore)).use(DelimitedKey('.'))();
};
