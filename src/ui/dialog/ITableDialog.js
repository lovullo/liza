/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Temporary interface
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

var Interface = require('easejs').Interface;

/**
 * TODO: this is only required temporarily until GNU ease.js 0.2.9,
 * which hasn't yet been released because I'm still waiting for
 * the copyright disclaimer from my (new, after purchase) employer!
 */
module.exports = Interface('ITableDialog', {
  /**
   * Generate tr HTML for row of data
   *
   * @param {TableDialogData} data table data to render
   * @return {string} generated HTML
   */
  'public createRow': ['row'],
});
