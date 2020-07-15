/**
 * @license
 * StringFormat formatter
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
 *
 * @module validate/formatter
 */

var Trait = require('easejs').Trait,
  ValidatorFormatter = require('../ValidatorFormatter');

/**
 * Basic data formatting
 *
 * `StringFormat` effectively allows for the definition of prefixes
 * and suffixes by using a format string of the form `'pre %s post'`.
 *
 * For example, the format string `'$%sUSD'` applied to the
 * input `'$25.00USD'` would yield `'25.00'` after parsing and
 * re-yield the original string when retrieved.
 *
 * If `StringFormat` is mixed in with other formatters that
 * modify the input, then the former will be applied after earlier
 * formatters process the data.  For example:
 *
 * @example
 *   let fmt = EchoFormatter
 *       .use( Number( 2 ) )
 *       .use( StringFormatter( '$%sUSD' ) )();
 *
 *   fmt.parse( '$25USD' );  // => 25.00
 *   fmt.retrieve( '25' );  // => $25.00USD
 *
 * The simple, restricted format string in place of a regular expression
 * allows for a declarative stacking of formatters without concern as
 * to whether the format was written correctly.  Regular expressions,
 * however, might well need associated tests for confidence in the
 * implementation, which complicates the design.  Simply: it's easy to
 * reason about.
 */
module.exports = Trait('StringFormat')
  .implement(ValidatorFormatter)
  .extend({
    /**
     * Prefix string
     *
     * @type {string}
     */
    'private _pre': '',

    /**
     * Postfix string
     *
     * @type {string}
     */
    'private _post': '',

    /**
     * Define format string
     *
     * The format string must have a single `'%s'` denoting the
     * placement of the data.
     *
     * @param {string} format format string with single `'%s'`
     */
    __mixin: function (format) {
      var parts = this.parseFormat('' + format);

      this._pre = parts.pre;
      this._post = parts.post;
    },

    /**
     * Extract prefix and suffix from format string FORMAT
     *
     * Everything before the `'%s'` is the prefix, and everything
     * after is the suffix.
     *
     * @param {string} format format string with single `'%s'`
     *
     * @return {Object.<pre,post>} prefix and suffix of FORMAT
     *
     * @throws {Error} if FORMAT does not have exactly one `'%s'`
     */
    'virtual protected parseFormat': function (format) {
      var parts = format.split('%s');

      if (parts.length !== 2) {
        throw Error("Format string must have a single '%s': " + format);
      }

      return {
        pre: parts[0],
        post: parts[1],
      };
    },

    /**
     * Remove prefix and suffix from data
     *
     * @param {string} data data to parse
     *
     * @return {string} data formatted for storage
     */
    'virtual abstract override public parse': function (data) {
      return this.__super(this._stripPrePost(data));
    },

    /**
     * Recursively strip prefixes and suffixes from STR
     *
     * This simply allows us to avoid having to use regexes and,
     * consequently, worry about escaping format strings.
     *
     * @param {string} str string to strip
     *
     * @return {string} stripped string
     */
    'private _stripPrePost': function (str) {
      if (this._pre && str.substr(0, this._pre.length) === this._pre) {
        return this._stripPrePost(str.substr(this._pre.length));
      }

      if (this._post && str.substr(-this._post.length) === this._post) {
        return this._stripPrePost(
          str.substr(0, str.length - this._post.length)
        );
      }

      return str;
    },

    /**
     * Format data by adding prefix and suffix
     *
     * @param {string} data data to format for display
     *
     * @return {string} data formatted for display
     */
    'virtual abstract override public retrieve': function (data) {
      return this._pre + this.__super(data) + this._post;
    },
  });
