/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off" */
/**
 * Field representing bucket value
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

var Class = require('easejs').Class,
  Field = require('./Field');

module.exports = Class('BucketField')
  .implement(Field)
  .extend({
    /**
     * Field name
     * @type {string}
     */
    'private _name': '',

    /**
     * Field index
     * @type {string}'
     */
    'private _index': 0,

    __construct: function (name, index) {
      this._name = '' + name;
      this._index = +index;
    },

    'public getName': function () {
      return this._name;
    },

    'public getIndex': function () {
      return this._index;
    },
  });
