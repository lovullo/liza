/**
 * Represents the result of performing a grouped diff on bucket data
 *
 *  Copyright (C) 2010-2019 R-T Specialty, LLC.
 *
 *  This file is part of the Liza Data Collection Framework
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
  BucketDiffContext = require('./BucketDiffContext');
BucketDiffResult = require('./BucketDiffResult');

/**
 * Result of performing a grouped diff on bucket data
 *
 * This class augments an existing diff result with algorithms to determine
 * how a group of fields has changed; this includes recognizing when a
 * group's values have changed versus when it has been moved to another
 * index, added, or removed.
 */
module.exports = Class('GroupedBucketDiffResult')
  .implement(BucketDiffResult)
  .extend({
    /**
     * Result of performing the diff
     * @type {BucketDiffResult}
     */
    'private _result': null,

    /**
     * Context used to produce the diff, augmented with sibling descriptor
     * @type {GroupedBucketDiffContext}
     */
    'private _context': null,

    /**
     * Leader hash, populated at our convenience
     * @type {Object}
     */
    'private _leaders': {},

    /**
     * Changed values, as provied by describeChangedValues
     * @type {Object}
     */
    'private _changedValues': {},

    __construct: function (result, context) {
      if (!Class.isA(BucketDiffResult, result)) {
        throw TypeError('Expected a BucketDiffResult to augment');
      } else if (!Class.isA(BucketDiffContext, context)) {
        throw TypeError('Expected BucketDiffContext');
      }

      this._result = result;
      this._context = context;

      // we'll be using this frequently
      this._changedValues = result.describeChangedValues();
    },

    /**
     * Describes what fields have changed using boolean flags; does not include
     * unchanged fields
     *
     * These changes are subject to index tracking---that is, leaders will be
     * used to determine if an index has moved, in which case it will be
     * considered changed only if its values have changed relative to the move.
     * For example, if two indexes are swapped but their non-leader fields
     * retain the same values relative to their old positions, this does itself
     * not count as a change.
     *
     * @return {Object} hash of arrays of boolean flags representing changes
     */
    'public describeChanged': function () {
      // the easy way to do this is to simply strip the values from the value
      // changeset
      var vals = this.describeChangedValues(),
        ret = {};

      for (var field in vals) {
        ret[field] = [];

        var val = vals[field],
          i = val.length;

        // there is a change if the changeset is not undefined
        while (i--) {
          ret[field][i] = val[i] !== undefined;
        }
      }

      return ret;
    },

    /**
     * Retrieves head and prev values for a given field
     *
     * It may be the case that the changeset provided by the wrapped result does
     * not provide enough information; in this case, it will be looked up from
     * the context.
     *
     * @param {string} field   field name
     * @param {number} mapi    head index
     * @param {number} mapfrom prev index (in the case of a move)
     *
     * @return {Array.<*>} array of [valhead, valprev]
     */
    'private _getChangedValues': function (field, mapi, mapfrom) {
      var changed = this._changedValues[field],
        head = changed,
        valhead,
        valprev;

      // these values may not be available from the standard diff if
      // the index itself did not actually change; in this case, query
      // for the data
      if (changed === undefined || changed[mapi] === undefined) {
        // we know this to be true because this field/index is
        // unchanged
        head = this._context.getFieldValues(field)[0];
        valhead = head[mapi];
        valprev = mapfrom === undefined ? undefined : head[mapfrom];
      } else {
        valhead = changed[mapi][0];
        valprev =
          mapfrom === undefined ? undefined : (changed[mapfrom] || [])[1]; // may yield undefined
      }

      return [valhead, valprev];
    },

    /**
     * Describes changes in values by listing either undefined if no change or
     * an array containing, respectively, the current and previous values for
     * each index
     *
     * @return {Object} value changes
     */
    'public describeChangedValues': function () {
      var map = this.createIndexMap(),
        prevfound = [],
        maxi = 0,
        ret = {};

      for (var field in this._changedValues) {
        var changed = this._changedValues[field],
          mapi = map.length,
          fieldret = [],
          fieldn = 0;

        // process all existing indexes, keeping track of the maps that we
        // encounter so that we can determine if prev indexes are accounted
        // for
        while (mapi--) {
          var mapfrom = map[mapi];
          if (mapfrom !== undefined) {
            prevfound[mapfrom] = true;
          }

          // if there is no change in mapping, then we can re-use the
          // original changeset for this index
          if (mapfrom === mapi) {
            fieldret[mapi] = changed[mapi];
            if (changed[mapi] !== undefined) {
              fieldn++;
            }
            continue;
          }

          var vals = this._getChangedValues(field, mapi, mapfrom),
            valhead = vals[0],
            valprev = vals[1];

          //  we must determine if there is a change relative to the
          //  original index
          if (valhead !== valprev) {
            fieldret[mapi] = [valhead, valprev];
            fieldn++;
            continue;
          }

          // no change (set explicitly to ensure array length is correct
          // and to fill any "holes" in the array that are implicitly
          // undefined, which v8 cares about under certain circumstances)
          fieldret[mapi] = undefined;
        }

        // only include in the diff output if we actually have changes
        if (fieldn > 0) {
          ret[field] = fieldret;
        }
      }

      // if there are any prev indexes that were not in the map, then those
      // indexes have been deleted; throw them onto the end of the diff
      var index_cnt = this._getOriginalIndexCount(),
        i = index_cnt,
        addi = map.length;

      while (i--) {
        // ignore handled indexes
        if (prevfound[i] === true) {
          continue;
        }

        var added = false;
        for (var field in this._changedValues) {
          // may not have been initialized above
          if (!ret[field]) {
            ret[field] = [];

            // initialize each index to undefined explicitly to fill any
            // holes in the prototype
            var initi = index_cnt;
            while (initi--) {
              ret[field][initi] = undefined;
            }
          }

          // original value, before delete (may not be defined)
          var orig = this._getChangedValues(field, i, i)[1];
          if (orig !== undefined) {
            ret[field][addi] = [undefined, orig];
            added = true;
          }
        }

        added && addi++;
      }

      return ret;
    },

    /**
     * Determines indexes that have one or more leaders with changed values
     *
     * This comparison is done relative to the length of the current
     * array---that is, if the original array was longer, then it will not be
     * reflected here as an index change.
     *
     * @return {Array.<boolean>} truth value for each respective index
     */
    'private _getChangedIndexes': function () {
      var ichg = [];

      for (var field in this._changedValues) {
        // we're only looking for leaders at the moment
        if (!this._context.isGroupLeader(field)) {
          continue;
        }

        // make our lives easier (this will not change from call to call,
        // since our context cannot change)
        this._leaders[field] = true;

        var fvals = this._changedValues[field],
          i = fvals.length;
        while (i--) {
          // if this is a delete, then stop (we've reached the end of the
          // new array)
          if (fvals[i] !== undefined && fvals[i][0] === undefined) {
            continue;
          }

          // we have a change if any previous leader for this index
          // changed, or if we are not undefined (indiciating a change)
          ichg[i] = ichg[i] || fvals[i] !== undefined;
        }
      }

      return ichg;
    },

    /**
     * Retrieve the number of indexes in the original value
     *
     * @return {number} indexes found
     */
    'private _getOriginalIndexCount': function () {
      var index_count = 0;

      for (var leader in this._leaders) {
        if (this._changedValues[leader] !== undefined) {
          index_count = this._changedValues[leader].length;
          break;
        }
      }

      return index_count;
    },

    /**
     * Attempts to locate leaders that match the original values found at
     * src_index
     *
     * If the leader values match at a new location, then the index of that
     * location is returned; if there is a match at multiple locations, then an
     * error will be thrown requesting that additional leaders be used to
     * disambiguate.
     *
     * @param {number} index current index of leader
     *
     * @return {number} new index if found, otherwise -1
     */
    'private _trackDownLeaders': function (index) {
      var found = [];

      for (var field in this._leaders) {
        var vals = this._changedValues[field],
          i = vals.length;

        // check every leader for a match
        var match = true;
        while (i--) {
          // skip indexes we have already found to be non-matches
          if (found[i] === false) {
            continue;
          }

          // don't waste time processing our current index, which we
          // already know has changed
          if (i === index) {
            found[i] = false;
            continue;
          }

          var ivals = this._getChangedValues(field, index, i),
            valhead = ivals[0],
            valprev = ivals[1];

          // check the current value against the original value at this
          // index
          if (valhead !== valprev) {
            found[i] = false;
          }
        }
      }

      var i = vals.length,
        ret = -1;
      while (i--) {
        // non-matches are explicitly denoted as false
        if (found[i] === false) {
          continue;
        }

        if (ret !== -1) {
          // ah, crap---ambiguous; abort! (they need to provide more
          // leaders to disambiguate)
          throw Error('Ambiguous index transition; aborting analysis');
        }

        // we found it.
        ret = i;
      }

      return ret;
    },

    /**
     * Generates a map that describes index reassignment
     *
     * Index reassignment is determined by the group leaders; if an index is
     * modified and each leader is found to match identically at another index,
     * then the index has been considered to be moved. If an index is added or
     * cannot be found (deleted), then it maps from undefined.
     *
     * The returned array contains, for each respective index, the value of its
     * previous index (or undefined if such a value cannot be determined).
     *
     * If leader values result in an ambiguous index transition, an error will
     * be thrown; in this case, more leaders should be used to disambiguate.
     *
     * @return {Array.<number|undefined>} index map
     */
    'public createIndexMap': function () {
      var map = [];

      // determine, based on the group leaders, which indexes have changed in
      // some way (that is, the value of at least one leader at some index has
      // changed)
      var ichg = this._getChangedIndexes(),
        i = ichg.length;

      while (i--) {
        // if an index has not changed, then it maps to itself
        if (ichg[i] === false) {
          map[i] = i;
          continue;
        }

        // to determine if the index has moved, we must see if every leader
        // is unchanged at a different index from the original leader values
        // of this index
        var inew = this._trackDownLeaders(i);
        if (inew === -1) {
          // the index was added or removed; it maps from nothing.
          map[i] = undefined;
          continue;
        }

        // it does not matter if there were changes---we found the index
        // that we map to
        map[i] = inew;
      }

      return map;
    },
  });
