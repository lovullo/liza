/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", block-scoped-var: "off", no-redeclare: "off", no-undef: "off", no-unused-vars: "off" */
/**
 * Calculation worksheet
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
 *
 * @todo this was thrown together during rough times and could use some
 *       cleanup
 */

var Class = require('easejs').Class;

/**
 * Summary view of calculations used to produce the final yield
 *
 * This was historically referred to ask the ``rating worksheet''.
 */
module.exports = Class('CalcWorksheet', {
  'private _data': null,

  'private _perf': null,

  'private _jquery': null,

  __construct: function (data, perf, jquery) {
    this._data = data;
    this._perf = perf;
    this._jquery = jquery;
  },

  'public buildHtml': function () {
    var $ = this._jquery,
      $ret = $('<div class="worksheet">'),
      $w = $('<dl class="worksheet">'),
      c = 0;

    this._appendHeader($ret);

    for (var name in this._data) {
      var cur = this._data[name],
        disp = cur[0],
        data = cur[1],
        val = cur[2] || '0.00';

      // array?
      var vals = val;
      if (!val.push) {
        vals = [val];
      }

      // display each index on its own
      var len = vals.length,
        n = 0;

      for (var i = 0; i < len; i++) {
        var val = vals[i];

        // neglect zero values
        if (!cur[1] || +val === 0 || val.length === 0) {
          if (!cur[3]) {
            continue;
          }
        }

        this._renderCalc($w, disp || name, data, vals, i, n++);

        c++;
      }
    }

    // if nothing was appended, then let them know that the worksheet
    // is unavailable
    if (c === 0) {
      $ret.text('Unavailable.');
    } else {
      // add the worksheet
      $ret.append($w);

      // append perf data
      if (this._perf && this._perf.time) {
        $ret.append(
          $('<p class="perf">').html(
            '<b>Calculation time:</b> ' + this._perf.time.total + 'ms'
          )
        );
      }
    }

    return $ret;
  },

  'private _renderCalc': function ($w, disp, data, vals, index, render_n) {
    var val = vals[index],
      label = disp;

    if (vals.length > 1) {
      label = label + ' (#' + (index + 1) + ')';
    }

    $w.append(
      $('<dt>')
        .text(label)
        .addClass(render_n === 0 ? 'first-of-set' : '')
    ).append(
      $('<dd>')
        .append($('<span>').html(this._processSet(data, [], index)))
        .append(
          $('<span>').html(
            '<span class="result">' +
              '<span class="delim">=</span> ' +
              val +
              '</span>'
          )
        )
    );
  },

  'private _appendHeader': function ($ret) {
    // this used to reference "premium", but has been generalized
    $ret.append(
      $('<p>').html(
        'Below you will find values that were hand-selected as ' +
          'useful data. <em>Only non-zero calculations are ' +
          'displayed</em>, so if a calculation results in <tt>0</tt>, ' +
          'you must click on "More Detail" to see it. For more ' +
          'complex calculations, only applicable portions may be ' +
          'displayed.'
      )
    );
  },

  'private _processSet': function (data, delims, index) {
    if (data.length === 0) {
      return '';
    }

    var $ret = this._jquery('<span>'),
      $add = $ret,
      $group;

    if (delims.length > 1) {
      $ret.append(($group = $('<div class="group">')));
      $add = $group;

      $group.append('<span class="delim group">(</span>');
    }

    var n = 0;
    for (var i in data) {
      if (data[i] === undefined) {
        continue;
      }

      $add.append(
        this._processCalc(
          data[i],
          delims,
          n++ === 0 /* do not apply delim to first */,
          index
        )
      );
    }

    if (delims.length > 1) {
      $group
        .append('<span class="delim group">)</span>')
        .append('<br clear="both" />');
    }

    return $ret;
  },

  'private _processCalc': function (data, delims, first, index) {
    first = !!first;

    var type = data[0],
      desc = data[1],
      sub = data[2],
      val = (data[3] || [])[index],
      $ = this._jquery,
      $ret = $('<span>');

    if (val === undefined || val === null) {
      val = data[3];
    }

    // render only the first argument (which is presumably the meat)
    if (type === 'apply') {
      sub = [sub[0]];
    }

    // just in case we're provided with an array
    if (!val || (typeof val === 'object' && val.length === 0)) {
      val = desc.value || '0';
    }

    // if we're a sub-equation (denoted by delimiters) with no value, then
    // neglect to display anything
    if (delims.length && !data[3]) {
      //return null;
    }

    // should we ignore this calculation?
    if (this._shouldIgnoreOutput(type, desc, sub, val)) {
      return '';
    }

    // should we ignore the parent output (only output children)?
    var ignore_poutput = this._shouldIgnorePOutput(type, desc, sub, val);

    $ret
      .append(
        $('<span>').html(
          (delims.length && !first && !ignore_poutput
            ? '<span class="delim">' + delims[delims.length - 1] + '</span>'
            : '') +
            (!ignore_poutput ? this._styleType(type, desc, val, sub) : '')
        )
      )
      .append(this._processSet(sub, this._addDelim(delims, type), index));

    return $ret;
  },

  'private _shouldIgnoreOutput': function (type, desc, sub, val) {
    // ignore all cases except for the one that yielded a value
    if ((type === 'case' || type === 'otherwise') && !(+val > 0)) {
      return true;
    } else if (type === 'when') {
      return true;
    }

    return false;
  },

  'private _shouldIgnorePOutput': function (type, desc, sub, val) {
    // ignore all cases except for the one that yielded a value
    switch (type) {
      case 'cases':
        return true;
    }

    return false;
  },

  'private _styleType': function (type, desc, val, sub) {
    switch (type) {
      case 'arg':
      case 'product':
      case 'quotient':
      case 'sum':
      case 'cases':
      case 'case':
      case 'when':
      case 'otherwise':
        return '';

      case 'apply':
        if (sub.length) {
          return '<span class="func">' + this._applyName(desc.name) + '</span>';
        }

      // intentional fallthrough (how useful!)

      case 'value-of':
      default:
        var name = desc.label || desc.name || desc.desc || '';

        if (name) {
          return '<span class="descval">[' + name + ' = ' + val + ']</span>';
        } else {
          return val;
        }
    }
  },

  /**
   * More understandable text for certain function names
   *
   * TODO: Move somewhere else
   */
  'private _applyName': function (name) {
    switch (name) {
      case 'max':
        return 'The larger of';
      case 'round_real':
        return 'Round to the nearest integer';
    }

    return name;
  },

  'private _addDelim': function (delims, type) {
    // create a copy (then we don't have to worry about popping elements
    // off)
    delims = delims ? delims.slice() : [];

    var delim = (function () {
      switch (type) {
        case 'sum':
          return '+';
        case 'quotient':
          return '/';
        case 'product':
          return '*';

        default:
          return '';
      }
    })();

    if (delim) {
      delims.push(delim);
    }

    return delims;
  },
});
