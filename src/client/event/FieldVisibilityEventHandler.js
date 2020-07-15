/**
 * Field visibility event handler
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
 *
 *  Liza is free software: you can redistribute it and/or modify
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

const Class = require('easejs').Class;
const EventHandler = require('./EventHandler');
const UnknownEventError = require('./UnknownEventError');

/**
 * Shows/hides fields according to event id
 *
 * @todo use something more appropriate than Ui
 * @todo should not be concerned with data validators
 */
module.exports = Class('FieldVisibilityEventHandler')
  .implement(EventHandler)
  .extend({
    /**
     * Client UI
     * @type {Ui}
     */
    'private _ui': null,

    /**
     * Field data validator
     * @type {DataValidator}
     */
    'private _data_validator': null,

    /**
     * Initialize with Client UI
     *
     * @param {Ui}            stepui         Client UI
     * @param {DataValidator} data_validator field data validator
     */
    __construct(stepui, data_validator) {
      this._ui = stepui;
      this._data_validator = data_validator;
    },

    /**
     * Show/hide specified fields
     *
     * If a given field is not known then it will be silently ignored; the
     * callback `callback` will still be invoked.
     *
     * This relies on a poorly designed API that should change in the future.
     *
     * @param {string}             event_id event id
     * @param {function(*,Object)} callback continuation to invoke on completion
     *
     * @param {elementName:string, indexes:Array.<number>} data
     *
     * @return {EventHandler} self
     */
    'public handle'(event_id, callback, {elementName: field_name, indexes}) {
      // TODO: Law of Demeter!
      const group = this._ui.getCurrentStep().getElementGroup(field_name);

      // we probably should care, but we don't right now
      if (!group) {
        callback();
        return;
      }

      const action = (() => {
        switch (event_id) {
          case 'show':
            return group.showField.bind(group);

          case 'hide':
            return group.hideField.bind(group);

          default:
            throw UnknownEventError(`Unknown visibility event: ${event_id}`);
        }
      })();

      this._data_validator.clearFailures({[field_name]: indexes});
      indexes.forEach(field_i => action(field_name, field_i));

      callback();
    },
  });
