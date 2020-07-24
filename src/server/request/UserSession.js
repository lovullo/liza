/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", node/no-missing-require: "off", prefer-arrow-callback: "off" */
/**
 * UserSession class
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
 *
 * @todo this is very tightly coupled with LoVullo's system
 */

// php compatibility
var Class = require('easejs').Class,
  php = require('php-serialize');

/**
 * Stores/retrieves user PHP session data from memcached
 */
module.exports = Class.extend(require('../../events').EventEmitter, {
  /**
   * Session id
   * @type {string}
   */
  'private _id': '',

  /**
   * Memcache client
   * @type {memcache.Client}
   */
  'private _memcache': null,

  /**
   * Session data
   * @type {object}
   */
  'private _data': {},

  /**
   * Initializes a session from an existing PHP session
   *
   * @param String          id       session id
   * @param memcache.Client memcache memcache client used to access session
   *
   * @return undefined
   */
  __construct: function (id, memcache) {
    this._id = id || '';
    this._memcache = memcache;
    this._data = {};

    // parse the session data
    var _self = this;
    this._getSessionData(function (data) {
      _self._data = data === null ? {} : data;

      // session data is now available
      _self.emit('ready', data);
    });
  },

  /**
   * Returns the session data
   *
   * @return Object session data
   */
  getData: function () {
    return this._data;
  },

  /**
   * Returns whether the user is currently logged in
   *
   * This is determined simply by whether the agent id is available.
   *
   * @return Boolean
   */
  isLoggedIn: function () {
    return this._data.agentID !== undefined ? true : false;
  },

  /**
   * Gets the agent id, if available
   *
   * @return Integer|undefined agent id or undefined if unavailable
   */
  agentId: function () {
    return this._data.agentID || undefined;
  },

  /**
   * Gets the agent name, if available
   *
   * @return String|undefined agent name or undefined if unavailable
   */
  agentName: function () {
    return this._data.agentNAME || undefined;
  },

  /**
   * Gets the user name, if available
   *
   * @return String|undefined user name or undefined if unavailable
   */
  userName: function () {
    return this._data.user_name || undefined;
  },

  /**
   * Whether the user is logged in as an internal user rather than a broker
   *
   * @return {boolean} true if internal user, otherwise false
   */
  isInternal: function () {
    return this.agentId() === '900000' ? true : false;
  },

  'public setAgentId': function (id) {
    this._data.agentID = id;
    return this;
  },

  /**
   * Gets the broker entity id, if available
   *
   * @return Integer|undefined agent entity id or undefined if unavailable
   */
  agentEntityId: function () {
    return this._data.broker_entity_id || undefined;
  },

  /**
   * Parses PHP session data from memcache and returns an object with the data
   *
   * @param {function(data)} callback function to call with parsed data
   *
   * @return Object parsed session data
   */
  'private _getSessionData': function (callback) {
    this._memcache.get(this._id, function (err, data) {
      if (err || data === null) {
        // failure
        callback(null);
        return;
      }

      var session_data = {};

      if (data) {
        // Due to limitations of Javascript's regex engine, we need to do
        // this in a series of steps. First, split the string to find the
        // keys and their serialized values.
        var splits = data.split(/(\w+?)\|/),
          len = splits.length;

        // associate the keys with their values
        for (var i = 1; i < len; i++) {
          var key = splits[i],
            val = splits[++i];

          // the values are serialized PHP data; unserialize them
          val = php.unserialize(val);

          // add to the session data
          session_data[key] = val;
        }
      }

      // return the parsed session data
      callback(session_data);
    });
  },
});
