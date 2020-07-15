/**
 * DOM context representing document root
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
  DomContext = require('./DomContext');

/**
 * Intended to serve as the topmost context in a context tree
 *
 * Since all other DomContexts besides this one must have a parent, it may
 * be useful to create other DomContext objects by split()'ing an instance
 * of this class.
 *
 * The root context cannot be detached from the DOM.
 */
module.exports = Class('RootDomContext').extend(DomContext, {
  'override protected verifyParentContext': function (context) {
    // we have no parent... :(
    // (this class has Mommy/Daddy issues)
    return true;
  },

  'override public isAttached': function () {
    // of course we are.
    return true;
  },

  'override public attach': function (to) {
    throw Error('Cannot attach DOM root');
  },

  'override public detach': function (to) {
    throw Error('Cannot detach DOM root');
  },
});
