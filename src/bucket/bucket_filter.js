/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", no-useless-escape: "off", no-undef: "off" */
/**
 * Filters bucket data
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

var filters = {
  name: /[^a-zA-Z \'\.-]/g,
  address: /[^a-zA-Z0-9 &\/\'\.,-]/g,
  city: /[^a-zA-Z \'\.-]/g,
  currency: /[^\-0-9\.]/g,
  float: /[^0-9\.]/g,
  date: /[^0-9\/\.-]/g,
  dba: /[^a-zA-Z0-9 \'\.,&\(\):\/-]/g,
  dollars: /[^\-0-9\.]/g,
  email: /[^a-zA-Z0-9_\.@-]/g,
  number: /[^0-9\.]/g,
  cvv2: /[^0-9]/g,
  quoteId: /[^0-9]/g,
  personalId: /[^0-9]/g,
  phone: /[^0-9 \(\)\.-]/g,
  url: /[^a-zA-Z0-9:\/_\.\+\$\(\)\\\?&@=\';#~-]/,
  year: /[^0-9]/g,
  zip: /[^0-9a-zA-Z-]|[DFIOQU]/g,
  radio: /[^0-9a-zA-Z_\/-]/g,
  legacyradio: /[^0-9a-zA-Z_\/-]/g,
  submit: /[^0-9a-zA-Z _-]/g,
  select: /[^0-9a-zA-Z &\+|\.\/,\(\)'"_-]/g,

  default: new RegExp('//'),
};

/**
 * Filters bucket data based on the provided types
 *
 * If a type is not provided, the data is considered to be unwanted and is
 * removed entirely. Otherwise, the filter is applied to every element in the
 * array.
 *
 * The data is modified in place.
 *
 * @param Object data      data to filter
 * @param Object key_types filter types
 *
 * @return Object modified data
 */
exports.filter = function (data, key_types, ignore_types, permit_null) {
  permit_null = permit_null === undefined ? false : !!permit_null;

  // loop through each of the bucket values
  for (key in data) {
    // BC between string and object representation of type data
    var type_data = key_types[key],
      type = type_data ? type_data.type || type_data : undefined;

    var dim = type_data ? type_data.dim : 1;

    var values = data[key];

    // if it's not an expected bucket value, get rid of it (this prevents
    // users from using us as their own personal database
    if (type === undefined || ignore_types[key] === true) {
      delete data[key];
      continue;
    }

    // attempt to get the filter, or use the default filter if one was not
    // found
    var filter = filters[type] || filters['default'];

    if (values === undefined || values === null) {
      values = [];
    }

    // XXX: this does not handle multi-dimensional data, since we should
    // _remove_ this file entirely
    data[key] = dim === 1 ? filterValues(values, filter, permit_null) : values;
  }

  return data;
};

function filterValues(values, filter, permit_null) {
  var len = values.length;

  for (var i = 0; i < len; i++) {
    if (typeof values[i] !== 'string') {
      if (permit_null && values[i] === null) {
        continue;
      }

      values[i] = '' + values[i];
    }

    values[i] = values[i].replace(filter, '');
  }

  return values;
}
