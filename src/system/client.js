/**
 * Client system
 *
 *  Copyright (C) 2017 LoVullo Associates, Inc.
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

"use strict";

const MemoryStore = require( '../store' ).MemoryStore;


/**
 * Typical client system
 *
 * This serves as a factory of sorts for the user-facing client that runs in
 * the web browser.
 *
 * This is incomplete; it will be added to as code is ported to liza.
 */
module.exports = {
    data: {
        diffStore: () => MemoryStore(),
    },
};
