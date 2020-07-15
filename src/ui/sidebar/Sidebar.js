/**
 * Program sidebar UI class
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
 * @todo remove hard-coded references to "quote"
 */

var Class = require('easejs').Class,
  EventEmitter = require('../../events').EventEmitter;

module.exports = Class('Sidebar').extend(EventEmitter, {
  /**
   * Prefix for quote ids
   *
   * @type {string}
   * @const
   */
  'private const _QUOTE_ID_PREFIX': 'WEB',

  /**
   * Sidebar DOM element
   * @type {jQuery}
   */
  $content: null,

  /**
   * Element styler (used for refs)
   * @type {ElementStyler}
   */
  styler: null,

  /**
   * Sidebar data
   * @type {Object}
   */
  data: {},

  /**
   * Quote to use for dynamic information
   * @type {ClientQuote}
   */
  quote: null,

  /**
   * Reference hash
   * @type {Object.<string,jQuery>}
   */
  'private _refs': {},

  /**
   * Whether or not user is internal (e.g. LoVullo employee)
   * @type {boolean}
   */
  'private _internal': false,

  /**
   * Creates a new Sidebar instance
   *
   * @param {jQuery}        $content sidebar content
   * @param {ElementStyler} styler   element styler (used for answers)
   *
   * @return {Sidebar}
   */
  __construct: function ($content, styler) {
    this.$content = $content;
    this.styler = styler;
  },

  init: function () {
    var self = this;

    this._initTriggers();

    this.$content.find('#sidebar-help').show();

    this._initOverview();
    this._initUw();

    this._initStaticContent();

    this._initPrint();

    this._initScroll();

    return this;
  },

  /**
   * Initialize mystical sidebar scrolling
   *
   * Scroll with the page unless smashed against the header or footer.
   *
   * Calls upon the mystical powers of the gods of obnoxious web design.
   *
   * @return {undefined}
   */
  'private _initScroll': function () {
    // disable the scroll for browsers older than IE9 because they are
    // buggy.
    if (jQuery.browser.msie && parseInt(jQuery.browser.version, 10) < 9) {
      return;
    }

    var sidebar = this.$content,
      content = sidebar.parent(),
      offset = sidebar.offset();

    // height cache; DOM querying is expensive
    var content_height,
      sidebar_height,
      sidebar_left,
      prev_state = '';

    var should_scroll = function () {
      if (sidebar_height >= content_height) {
        return false;
      }

      return true;
    };

    var get_state = function () {
      var scrolltop = window.pageYOffset;
      if (scrolltop <= offset.top) {
        return 'top';
      }

      if (scrolltop + sidebar_height >= content_height + offset.top) {
        return 'bottom';
      }

      return 'scrolling';
    };

    var reset_top = function () {
      sidebar.css('position', '');
      sidebar.css('margin-top', '32px');
      sidebar.css('top', '3em');
      sidebar.css('left', 'auto');
    };

    var reset_bottom = function () {
      sidebar.css('position', 'absolute');
      sidebar.css('top', content_height - sidebar_height + 'px');
      sidebar.css('left', 'auto');
    };

    var begin_scroll = function () {
      if (window.pageXOffset > 0) {
        reset_top();
      }

      sidebar.css('left', sidebar_left + 'px');
      sidebar.css('margin-top', '0');
      sidebar.css('position', 'fixed');
      sidebar.css('top', '0');
    };

    var do_scroll = function () {
      if (!should_scroll()) {
        reset_top();
        return;
      }

      var state = get_state();
      if (state === prev_state) {
        return;
      }

      switch (state) {
        case 'top':
          reset_top();
          break;

        case 'scrolling':
          begin_scroll();
          break;

        case 'bottom':
          reset_bottom();
          break;
      }

      prev_state = state;
    };

    var rstimeout = 0,
      rsqueue = false;
    function do_resize() {
      if (rstimeout) {
        rsqueue = true;
        return;
      }

      // these may be kicked off frequently; cut down on it a bit
      rstimeout = setTimeout(function () {
        content_height = content.height();
        sidebar_height = sidebar.height();
        sidebar_left = sidebar.offset().left;

        reset_top();
        prev_state = state = 'top';

        do_scroll();

        rstimeout = 0;
        if (rsqueue) {
          rsqueue = false;
          do_resize();
        }
      }, 250);
    }

    $(document).scroll(do_scroll);
    $(window).resize(do_resize);
    content.bind('DOMSubtreeModified', do_resize);

    do_resize();
  },

  /**
   * Prepare interactive triggers
   *
   * Allows processing of events due to user interaction
   *
   * @return {undefined}
   */
  'private _initTriggers': function () {
    var _self = this;

    this.$content.find('#quoteid').click(function () {
      _self.emit('quoteIdClick');
    });

    this.$content.find('#agentid').click(function () {
      _self.emit('agentIdClick');
    });
  },

  setData: function (data) {
    this.data = data || {};
    return this;
  },

  setQuote: function (quote) {
    var sidebar = this;

    this.quote = quote;

    // hook the quote
    quote.on('dataCommit', function (data) {
      for (i in data) {
        if (sidebar._refs[i]) {
          sidebar._updateRef(i, data[i][0]);
        }
      }
    });

    this._updateRefs();

    return this;
  },

  _initOverview: function () {
    var data = this.data.overview;
    if (data === undefined) {
      return;
    }

    var $overview = this.$content.find('#rater-sidebar-overview');
    for (title in data) {
      var itemdata = data[title],
        $value = $('<dd>');

      this._refs[itemdata.ref] = {
        element: $value.addClass('_qref'),
        internal: itemdata.internal,
      };

      $overview
        .append(
          $('<dt>')
            .text(title + ':')
            .hide()
        )
        .append($value.hide());
    }
  },

  'private _initUw': function () {
    var _self = this;

    this.$content.find('#uw-manage').click(function () {
      _self.emit('uwmanage');
    });
  },

  _initStaticContent: function () {
    if (this.data.static_content === undefined) {
      return;
    }

    this.$content
      .find('#sidebar_static_content')
      .html(this.data.static_content);
  },

  _updateRefs: function () {
    for (ref in this._refs) {
      this._updateRef(ref);
    }
  },

  _updateRef: function (ref, value) {
    var refdata = this._refs[ref],
      $element = refdata.element,
      $set = $element.prevAll('dt:first').andSelf(),
      val = value || this.quote.getDataByName(ref)[0];

    // hide if the value is empty or internal-only and we are not internal
    if (!val || (refdata.internal && !this._internal)) {
      $set.hide();
    } else {
      $element.html(this.styler.styleAnswer(ref, val));
      $set.show();
    }
  },

  _initPrint: function () {
    this.$content.find('#rater-sidebar-print a').click(function () {
      window.print();
      return false;
    });
  },

  setProgramTitle: function (title) {
    this.$content.find('#rater-title').text(title);
    return this;
  },

  /**
   * Sets the quote id to appear in the sidebar
   *
   * The quote id will be prefixed with QUOTE_ID_PREFIX
   *
   * @param {string} id quote id
   *
   * @return {Sidebar} self
   */
  setQuoteId: function (id) {
    this.$content.find('#quoteid').text(this.__self.$('_QUOTE_ID_PREFIX') + id);

    return this;
  },

  setAgentId: function (id) {
    this.$content.find('#agentid').text(id);
    return this;
  },

  setHelpText: function (text) {
    text = text || 'Mouse over a question for help';
    this.$content.find('#sidebar-help-text').html(text);
  },

  /**
   * Sets whether logged in user is an internal user
   *
   * This may show or hide certain items in the sidebar, depending on their
   * properties.
   *
   * @param {boolean} internal whether user is internal
   *
   * @return {Sidebar} self
   */
  setInternal: function (internal) {
    this._internal = !!internal;
    this.$content.toggleClass('internal', this._internal);

    return this;
  },
});
