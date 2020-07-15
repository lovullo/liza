/**
 * Invoke callback on response
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

const Trait = require('easejs').Trait;
const UserResponse = require('./UserResponse');
const IProtUserResponse = require('./IProtUserResponse');

/** XXX: IProtUserResponse is temporary until an easejs release
    addresses a bug with recognizing named traits extending
    classes as parameterized **/

module.exports = Trait('CapturedUserResponse')
  .implement(IProtUserResponse)
  .extend({
    'private _callback': null,

    __mixin: function (callback) {
      if (typeof callback !== 'function') {
        throw TypeError('Callback expected; given ' + callback);
      }

      this._callback = callback;
    },

    /** TODO: Make public once IProtUserResponse is removed **/
    'virtual abstract override public endRequest': function (
      code,
      error,
      data
    ) {
      this._callback(code, error, data);
    },
  });
