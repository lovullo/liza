/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", @typescript-eslint/no-var-requires: "off" */
/**
 * Field group context
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
 */

var Interface = require('easejs').Interface;

/**
 * A subset of a larger collection of fields that can be used to restrict
 * operations for both convenience and (moreso) performance
 */
module.exports = Interface('Context', {
  'public getFieldByName': ['name', 'index', 'filter'],

  'public split': ['on'],
});
