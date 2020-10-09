/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-var: "off", prefer-arrow-callback: "off", eqeqeq: "off", no-undef: "off", no-unused-vars: "off", block-scoped-var: "off", no-redeclare: "off" */
/**
 * Program UI class
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
 * @todo this, along with Client, contains one of the largest and most
 *       coupled messes of the system; refactor
 *
 * @todo The code was vandalized with internal references and URLs---remove
 *       them (search "pollute")---and referenced a global variable!  This
 *       might not work for you!
 */

var Class = require('easejs').Class,
  EventEmitter = require('../events').EventEmitter;

// XXX: decouple
var DynamicContext = require('./context/DynamicContext');

/**
 * Creates a new Ui instance
 *
 * @param {Object} options ui options
 *
 * Supported options:
 *   content:   {jQuery}        content to operate on
 *   styler:    {ElementStyler} element styler for misc. elements
 *   nav:       {Nav}           navigation object
 *   navStyler: {NavStyler}     navigation styler
 *   errorBox:  {FormErrorBox}  error box to use for form errors
 *   sidebar:   {Sidebar}       sidebar ui
 *   dialog:    {UiDialog}
 *
 *   stepContainer: {jQuery}   for the step HTML
 *   stepBuilder:   {Function} function used to instantiate new steps
 *
 * @return {Ui}
 */
module.exports = Class('Ui').extend(EventEmitter, {
  /**
   * The Ui requested a step change
   * @type {string}
   */
  'const EVENT_STEP_CHANGE': 'stepChange',

  /**
   * Another step is about to be rendered
   * @type {string}
   */
  'const EVENT_PRE_RENDER_STEP': 'preRenderStep',

  /**
   * A different step has been rendered
   * @type {string}
   */
  'const EVENT_RENDER_STEP': 'renderStep',

  /**
   * Step has been rendered and all events are complete
   *
   * At this point, hooks may freely manipulate the step without risk of
   * running before the framework is done with the step
   *
   * @type {string}
   */
  'const EVENT_STEP_READY': 'stepReady',

  /**
   * Represents an action trigger
   * @type {string}
   */
  'const EVENT_ACTION': 'action',

  /**
   * Content to operate on
   * @type {jQuery}
   */
  $content: null,

  /**
   * Element styler to use for misc. elements in the UI (e.g. dialogs)
   * @type {Styler}
   */
  styler: null,

  /**
   * Step is in the process of saving
   * @type {boolean}
   */
  saving: false,

  /**
   * Object responsible for handling navigation
   * @type {Nav}
   */
  nav: null,

  /**
   * Styles navigation menu
   * @type {NavStyler}
   */
  navStyler: null,

  /**
   * Navigation bar
   * @type {jQuery}
   */
  $navBar: null,

  /**
   * Element to contain the step HTML
   * @type {jQuery}
   */
  $stepParent: null,

  /**
   * Builder used to create new step instances
   * @type {Function}
   */
  buildStep: null,

  /**
   * Holds previously loaded steps in memory
   * @type {Object}
   */
  stepCache: {},

  /**
   * Object representing the current step
   * @type {Step}
   */
  currentStep: null,

  /**
   * Stores the steps that have already been appended to the DOM once
   * @type {boolean}
   */
  stepAppended: [],

  /**
   * Represents the current quote
   * @type {Quote}
   */
  quote: null,

  /**
   * Event to resume when quote is ready (for step navigation)
   * @type {Object}
   */
  quoteReadyEvent: null,

  /**
   * Functions to call when step is to be saved
   * @type {Array.<Function>}
   */
  saveStepHooks: [],

  /**
   * Error box to use for form errors
   * @type {FormErrorBox}
   */
  errorBox: null,

  /**
   * Sidebar
   * @type {Sidebar}
   */
  sidebar: null,

  /**
   * Whether navigation is frozen (prevent navigation)
   * @type {boolean}
   */
  navFrozen: false,

  /**
   * Handles dialog display
   * @type {UiDialog}
   */
  _dialog: null,

  /**
   * Active program
   * @type {Program}
   */
  'private _program': null,

  /**
   * Handles general UI styling
   * @type {UiStyler}
   */
  'private _uiStyler': null,

  /**
   * Navigation bar
   * @type {UiNavBar}
   */
  'private _navBar': null,

  /**
   * Notification bar
   * @type {UiNotifyBar}
   */
  'private _notifyBar': null,

  'private _cmatch': null,

  /**
   * Root context
   * @type {RootDomContext}
   */
  'private _rootContext': null,

  /**
   * Step content cache
   * @type {Array.<StepUi>}
   */
  'private _stepContent': [],

  /**
   * Track field failures and fixes
   * @type {DataValidator}
   */
  'private _dataValidator': null,

  /**
   * Initializes new UI instance
   *
   * @param  {Object} options
   *
   * @return {undefined}
   */
  __construct: function (options) {
    this.$content = options.content;
    this.styler = options.styler;
    this.nav = options.nav;
    this.navStyler = options.navStyler;
    this.$navBar = this.$content.find('ul.step-nav');
    this.$stepParent = options.stepContainer;
    this.buildStep = options.stepBuilder;
    this.errorBox = options.errorBox;
    this.sidebar = options.sidebar;
    this._dialog = options.dialog;
    this._uiStyler = options.uiStyler;
    this._navBar = options.navBar;
    this._notifyBar = options.notifyBar;
    this._rootContext = options.rootContext;
    this._dataValidator = options.dataValidator;
  },

  /**
   * Initializes the UI
   *
   * @return Ui self to allow for method chaining
   */
  init: function () {
    var _self = this;

    this._initStyles();
    this._initKeys();

    this._initNavBar();

    this.sidebar.init();

    // set a context that will automatically adjust itself for the current
    // active step (that is, once we are actually on a step)
    _self.createDynamicContext(function (context) {
      _self._uiStyler.setContext(context);
    });

    return this;
  },

  /**
   * Initializes styling
   *
   * This is used (a) because CSS cannot be used for certain conditions and
   * (b) because IE6 doesn't support :hover for anything other than links.
   *
   * @return undefined
   */
  _initStyles: function () {
    var ui = this;

    this._uiStyler
      .init(this.$content)
      .on('questionHover', function (element, hover_over) {
        ui._renderHelp(element, hover_over);
      })
      .on('questionFocus', function (element, has_focus) {
        ui._renderHelp(element, has_focus);
      });
  },

  /**
   * Render help text for the provided element
   *
   * @return {undefined}
   */
  _renderHelp: function (element, show) {
    // dt's are only labels and have no fields, but their sibling
    // dd's do
    var $element =
      element.nodeName == 'DT' ? $(element).next('dd') : $(element);

    if (show) {
      // set help message
      this.sidebar.setHelpText(
        this.styler.getHelpMessage($element.find(':widget'))
      );
    } else {
      var text = '',
        $focus = this.$content.find('dd.focus:first :widget');

      // attempt to fall back on the help for the focused element,
      // if any
      if ($focus.length > 0) {
        text = this.styler.getHelpMessage($focus);
      }

      this.sidebar.setHelpText(text);
    }
  },

  /**
   * Hooks the navigation bar to permit navigation
   *
   * @return void
   */
  _initNavBar: function () {
    var _self = this;
    this._navBar.on('click', function (id) {
      if (typeof id === 'string') {
        // already on the current section do not need to navigate
        if (id === _self.nav.getCurrentSectionId()) {
          return;
        }

        if (_self.nav.isStepVisited(_self.nav.getFirstVisibleSectionStep(id))) {
          // Navigate by section
          _self.emit(
            _self.__self.$('EVENT_STEP_CHANGE'),
            _self.nav.getFirstVisibleSectionStep(id)
          );
        }
        return;
      }

      // do not permit navigation via nav bar if the user has not already
      // visited the step
      if (_self.nav.isStepVisited(id)) {
        _self.emit(_self.__self.$('EVENT_STEP_CHANGE'), id);
      }
    });
  },

  /**
   * Initializes keypress overrides
   *
   * This overrides the default enter key behavior to ensure that the correct
   * button is "pressed".
   *
   * @return undefined
   */
  _initKeys: function () {
    var ui = this;

    this.$content.find('form input').live('keypress.program', function (e) {
      if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
        var $btn = ui.$content.find('button.default');

        // trigger the change event first to ensure any necessary
        // assertions are run
        $(this).change();

        // don't click it if it's disabled
        if ($btn.attr('disabled')) {
          // but don't run the default behavior
          return false;
        }

        $btn.click();
        return false;
      }

      return true;
    });
  },

  /**
   * Displays a step to the user
   *
   * If the step is already cached in memory, it will be immediately
   * displayed. If not, it will use the assigned step builder in order to
   * instantiate a new step and load it. This is an asynchronous operation.
   *
   * @param Integer step_id identifier representing step to navigate to
   *
   * @return Ui self to allow for method chaining
   */
  'public displayStep': function (step_id, callback) {
    step_id = +step_id;
    var step = this.stepCache[step_id];

    // first thing to do is cache the current step and detach it
    if (this.currentStep !== null) {
      // let the current
      this._detachStep(this.currentStep).setActive(false);
    }

    // build the step only if it is not yet loaded
    if (step === undefined) {
      this._createStep(step_id, callback);

      return this;
    }

    this.currentStep = step;

    this.currentStep.setActive();
    this._renderStep(callback);

    return this;
  },

  /**
   * Detaches the step STEP from the DOM
   *
   * @param {jQuery} step step to detach
   *
   * @return StepUi STEP to allow for method chaining
   */
  _detachStep: function (step) {
    this._getStepContent(step).detach();

    return step;
  },

  /**
   * Builds and initializes a new step
   *
   * @param Integer step_id id of the step to load
   *
   * @return Step new step
   */
  _createStep: function (step_id, callback) {
    var ui = this,
      prevstep = this.currentStep;

    // prevent navigation while the step is downloading
    this.freezeNav();

    this.buildStep(step_id, function (stepui) {
      ui.currentStep = ui.stepCache[step_id] = stepui;
      ui.currentStep.setActive();
      ui._renderStep(callback);

      stepui
        .on('error', function () {
          var args = Array.prototype.slice.call(arguments);
          args.unshift('error');

          // forward to UI error event
          ui.emit.apply(ui, args);
        })
        .on('action', function (type, ref, index) {
          // foward
          ui.emit(ui.__self.$('EVENT_ACTION'), type, ref, index);
        })
        .on('displayChanged', function (id, index, value) {
          var data = {};
          data[id] = [];
          data[id][index] = value;

          ui._uiStyler.register('fieldFixed')(data);
        });

      // we're done rendering the step; permit navigation
      ui.unfreezeNav(prevstep);
      stepui.init();
    });
  },

  /**
   * Renders the current step's HTML and styles it
   *
   * @return Ui self to allow for method chaining
   */
  _renderStep: function (callback) {
    var step = this.currentStep,
      step_id = step.getStep().getId(),
      prev_content = this._getStepContent(step);

    var step_content = $('<div class="raterStepDiv" />')
      .attr('id', '__step' + step.getStep().getId())
      .append(prev_content || $(this.currentStep.getContent()));

    this._setStepContent(step, step_content);

    // display the step (we have to append the container to the DOM before
    // we append the step HTML, or dojo will throw a fit, since it won't see
    // any of the elements it's trying to modify as part of the DOM
    // document)
    this.$stepParent.append(step_content);

    // if this is the first time rendering the step, call the postAppend()
    // method on it
    if (!this.stepAppended[step_id]) {
      // let the step process anything that should be done after the
      // elements have been added to the DOM
      this.currentStep.postAppend();

      // let's not do this again
      this.stepAppended[step_id] = true;
      this._addNavButtons(this.currentStep);
    }

    // we need to emit this before we display to the user so that
    // ElementStyler has the current step content to query when
    // fields are added or modified
    this.emit(
      this.__self.$('EVENT_PRE_RENDER_STEP'),
      this.currentStep,
      step_content
    );
    this.currentStep.preRender();

    var ui = this;

    setTimeout(function () {
      // raise the event
      ui.emit(ui.__self.$('EVENT_RENDER_STEP'), ui.currentStep);
    }, 50);

    this._postRenderStep(function () {
      // call the callback before the timeout, allowing us to do stuff before
      // repaint
      callback && callback();

      ui.unfreezeNav(step);

      ui.currentStep.visit(function () {
        ui.emit(ui.__self.$('EVENT_STEP_READY'), ui.currentStep);
      });
    });

    return this;
  },

  /**
   * Retrieve cached stap content
   *
   * @param {StepUi=} step step to retrieve cached content of
   *
   * @return {jQuery} cached step content
   */
  _getStepContent: function (step) {
    var step_id = step.getStep().getId();

    return this._stepContent[step_id];
  },

  /**
   * Set cached step content
   *
   * @param {StepUi} step     step to retrieve cached content of
   * @param {jQuery} $content step content
   *
   * @return {Ui} self
   */
  _setStepContent: function (step, $content) {
    var step_id = step.getStep().getId();

    this._stepContent[step_id] = $content;

    return this;
  },

  _postRenderStep: function (callback) {
    var self = this,
      content = this._getStepContent(this.currentStep);

    if (content === null) {
      return;
    }

    // if the quote is locked, disable the form elements
    var disable = false;
    if (this.quote.isLocked()) {
      disable = true;
    }

    this.currentStep.lock(
      this.quote.isLocked() ||
        this.currentStep.getStep().getId() < this.quote.getExplicitLockStep()
    );

    if (disable === false) {
      // show buttons
      this._getNavButtons(this.currentStep).show();
      this.currentStep.hideAddRemove(false);
    } else {
      // hide buttons
      if (this.nav.isLastStep(this.currentStep.getStep().getId()) === false) {
        this._getNavButtons(this.currentStep).hide();
      } else {
        // hide only the first (back) button on the last step
        $(this._getNavButtons(this.currentStep)[0]).hide();
      }

      // hide add/remove buttons on groups
      this.currentStep.hideAddRemove(true);
    }

    callback && callback();
  },

  /**
   * Adds the navigation buttons to the step
   *
   * @param Step step the step to operate on
   *
   * @return undefined
   */
  _addNavButtons: function (step) {
    var ui = this,
      step_id = step.getStep().getId();

    var $buttons = $('<div class="navbtns" />');

    if (this.nav.hasPrevStep()) {
      this._addBackNavButton(step, $buttons);
    }

    this._addContinueNavButton(step, $buttons);

    if (this.nav.isQuoteReviewStep(step_id)) {
      this._addPrintQuoteButton(step, $buttons);
    }

    this._getStepContent(step).append($buttons);
  },

  /**
   * Toggle the display of a specific supplier column
   *
   * @param string supplier supplier code to toggle
   */
  _toggleSupplierView: function (supplier) {
    // toggle competitor columns from printable area
    $('#content')
      .find(
        'td[columnindex]td[class]:not( td[class*="' +
          supplier +
          '"] ), ' +
          'th[columnindex]th[class]:not( th[class*="' +
          supplier +
          '"] )'
      )
      .toggle();
  },

  /**
   * Adds the print quote button to the provided element
   *
   * @param Step   step     the step to operate on
   * @param jQuery $buttons element to add button to
   *
   * @return undefined
   */
  _addPrintQuoteButton: function (step, $buttons) {
    // XXX: someone polluted this code; remove this!
    if (
      program_client.programId == 'amig-snow-endorsement' ||
      program_client.programId == 'amig-cycle-endorsement'
    ) {
      var ui = this;

      var print_button = jQuery('<button />');

      print_button.text('Print Endorsement Request');
      print_button.attr('id', 'btn_print_all_quote');
      print_button.click(function () {
        var broker_id = program_client.getQuote().getAgentId();
        var quote_id = program_client.getQuote().getId();

        program_client.getUi().saveStep(step, function () {
          window.open(
            '/pa_print_amig_endt.php?quote_id=' +
              quote_id +
              '&broker_id=' +
              broker_id,
            'print',
            'height=450,width=500,menubar=no,location=no,resizable=no,scrollbars=no,status=no'
          );
        });

        return false;
      });

      $buttons.append(print_button);
    } else {
      var ui = this,
        $btn_all_print = $('<button />')
          .text('Print Quote Sheet')
          .attr('id', 'btn_print_all_quote')
          .click(function (event) {
            event.preventDefault();
            window.print();
            return;
          });

      $buttons.append($btn_all_print);

      var $btn_company_print = $('<button />')
        .text('Print Company Quote Sheet')
        .attr('id', 'btn_print_company_quote')
        .click(function (event) {
          // XXX: THIS USES A GLOBAL VAR!? :O
          var $this = $(this),
            text = $this.text(),
            supplier = program_client.getQuote().getDataByName('supplier')[0];

          event.preventDefault();

          // no company specified, print all quotes
          if (supplier === '') {
            window.print();
            return;
          }

          ui._toggleSupplierView(supplier);
          window.print();
          ui._toggleSupplierView(supplier);
        });

      $buttons
        .append($btn_company_print)
        .append(
          '<br><span id="print_instructions">To print ALL companies, click "Print Quote Sheet"<br/>' +
            'To print a specific company, select the company above then click the "Print Company Quote Sheet"</span>'
        );
    }
  },

  /**
   * Adds the back navigation button to the provided element
   *
   * @param Step   step     the step to operate on
   * @param jQuery $buttons element to add button to
   *
   * @return undefined
   */
  _addBackNavButton: function (step, $buttons) {
    var ui = this,
      nav = this.nav,
      step_id = step.getStep().getId(),
      prev_step_id = ui.nav.getPrevStepId(),
      cur_step = this._program.steps[step_id];

    var btn_text = nav.isQuoteReviewStep(step_id)
      ? 'Go Back'
      : 'Save & Go Back';

    if (cur_step.backLabel) {
      btn_text = cur_step.backLabel;
    }

    var $btn_back = $('<button />')
      .text(btn_text)
      .attr('id', 'btn_save_back')
      .click(function (event) {
        var $this = $(this),
          text = $this.text();

        $this.disable().text('Please wait...');
        event.preventDefault();

        ui.saveStep(
          step,
          function () {
            $this.enable().text(text);
            ui.emit(ui.__self.$('EVENT_STEP_CHANGE'), ui.nav.getPrevStepId());
          },
          // fail
          function () {
            $this.enable().text(text);
          }
        );
      });

    $buttons.append($btn_back);
  },

  /**
   * Adds the continue navigation button to the provided element
   *
   * FIXME: This should not be modifying button text in a rater-specific
   * manner!
   *
   * @param Step   step     the step to operate on
   * @param jQuery $buttons element to add button to
   *
   * @return undefined
   */
  _addContinueNavButton: function (step, $buttons) {
    var ui = this,
      nav = this.nav,
      step_id = step.getStep().getId(),
      last_step = nav.isLastStep(step_id),
      cur_step = this._program.steps[step_id];

    var $btn_continue = $('<button />')
      .addClass('default')
      .click(function (event) {
        var $this = $(this),
          text = $this.text();

        if (!last_step) {
          $this.disable().text('Please wait...');
        }
        event.preventDefault();

        ui.saveStep(
          step,
          function () {
            $this.enable().text(text);
            var next_step_id = nav.isManageQuoteStep(step_id)
              ? nav.getTopVisitedStepId()
              : nav.getNextStepId();

            ui.emit(ui.__self.$('EVENT_STEP_CHANGE'), next_step_id);
          },
          // fail
          function () {
            $this.enable().text(text);
          },
          // no UI update (IE will display a security warning
          // otherwise)
          last_step,
          last_step
        );
      });

    var btn_text = nav.isLastStep(step_id)
      ? 'View Binding Documents'
      : nav.isQuoteReviewStep(step_id)
      ? 'Continue to Complete Application'
      : 'Save & Continue';

    if (cur_step.continueLabel) {
      btn_text = cur_step.continueLabel;
    }

    $btn_continue
      .text(btn_text)
      .attr(
        'id',
        nav.isLastStep(step_id)
          ? ui.quote.isImported()
            ? 'btn_view_bind_docs'
            : 'btn_save_bind_docs'
          : 'btn_save_continue'
      );

    $buttons.append($btn_continue);
  },

  /**
   * Returns the step the user is currently on
   *
   * @return Step the current step
   */
  getCurrentStep: function () {
    return this.currentStep;
  },

  /**
   * Sets the quote to represent in the UI
   *
   * @return Ui self to allow for method chaining
   */
  setQuote: function (quote, program, clear_step) {
    this.quote = quote;

    // if the quote was cleared, don't do anything (this is just to prevent
    // step navigation)
    if (quote === null) {
      return this;
    }

    this._program = program;

    // update nav
    this.nav.setTopVisitedStepId(quote.getTopVisitedStepId());
    this.navStyler.quoteLocked(quote.isLocked());
    this._toggleLockedInd();

    this.sidebar
      .setProgramTitle(program.title)
      .setQuoteId(quote.getId())
      .setAgentId(quote.getAgentId());

    // update the step buckets
    $.each(this.stepCache, function () {
      this.getStep().updateQuote(quote);
    });

    if (this.quoteReadyEvent !== null) {
      this.quoteReadyEvent.resume(true);
      this.quoteReadyEvent = null;
    } else {
      this._navInitialStep(clear_step);
    }

    // ensure the step is properly displayed, taking into account the new
    // quote
    if (this.currentStep) {
      var _self = this;

      this._postRenderStep(function () {
        _self.currentStep.visit(function () {
          _self.emit(_self.__self.$('EVENT_RENDER_STEP'), _self.currentStep);
        });
      });
    }

    return this;
  },

  /**
   * Performs initial step navigation once a quote has been set
   *
   * If the current step is valid for the quote, or if the current step is the
   * step current quote step (if no step was given), then the current step
   * will be updated. Otherwise, we'll navigate to the current step in the
   * quote.
   *
   * @param {boolean} clear_step whether to clear the step
   *
   * @return undefined
   */
  _navInitialStep: function (clear_step) {
    clear_step = clear_step === undefined ? false : !!clear_step;

    if (
      clear_step &&
      this.quote.getCurrentStepId() !== this.currentStep.getStep().getId()
    ) {
      this.emit(
        this.__self.$('EVENT_STEP_CHANGE'),
        this.quote.getCurrentStepId()
      );
      return;
    }

    // if we're already on the current step in the quote, or the user has
    // already visited the current (or requested) step, then simply reset
    // the current step
    if (this.quote.hasVisitedStep(this.nav.getCurrentStepId())) {
      this.nav.navigateToStep(this.nav.getCurrentStepId(), false, false);

      return;
    }

    // navigate to the current step in the quote
    this.emit(
      this.__self.$('EVENT_STEP_CHANGE'),
      this.quote.getCurrentStepId()
    );

    // ensure we apply the style
    this.navStyler.highlightStep(this.quote.getCurrentStepId());
  },

  /**
   * Hooks or triggers the saveStep event
   *
   * This event should be called when a step needs to be saved. If only a
   * function is passed as a single parameter, it is used as a hook.
   * Otherwise, the step to be saved and a callback should be passed.
   *
   * @return Ui self to allow for method chaining
   */
  saveStep: function () {
    var ui = this;

    // if only one argument was given, it must be the function hook
    if (arguments.length === 1) {
      var hook = arguments[0];
      if (!(hook instanceof Function)) {
        throw 'TypeError: Invalid hook provided to Ui saveStep event';
      }

      // add the hook
      this.saveStepHooks.push(arguments[0]);
      return this;
    }

    var len = this.saveStepHooks.length,
      step = arguments[0] || this.getCurrentStep(),
      callback = arguments[1] || function () {},
      fail_callback = arguments[2] || function () {},
      immediately_save = arguments[3] !== undefined ? arguments[3] : false,
      concluding_save = arguments[4] !== undefined ? !!arguments[4] : false,
      abort = false;

    var event = {
      forceCallback: false,
      errors: [],
      concluding_save: concluding_save,
      aborted: false,
      abort: function () {
        abort = true;
      },
    };

    // saving the step can be processor intensive in older browsers, so we
    // want a UI update first
    var doSave = function () {
      if (!step.isValid(ui._cmatch)) {
        try {
          var invalid = step.getFirstInvalidField(ui._cmatch);

          // XXX: this is convoluted and disgusting
          // last element indicates whether it was a require check
          if (invalid[2] === true) {
            // this does the scrolling for us
            var err = {},
              thiserr = (err[invalid[0]] = []);

            // do not set a failure message; use default
            thiserr[invalid[1]] = '';
            ui.invalidateForm(err);
          } else {
            // just scroll
            step.scrollTo(invalid[0], invalid[1]);
          }
        } catch (e) {
          // uh oh. The step is invalid, but we're unable to indicate
          // which element is invalid. This means that the user cannot
          // correct the problem!
          ui.emit(
            'error',
            Error(
              'Step is invalid, but failed element could ' +
                'not be displayed: ' +
                e.message
            )
          );
        }

        if (typeof fail_callback === 'function') {
          fail_callback.call(ui);
        }

        return this;
      }

      var hold = false;
      event.hold = function () {
        hold = true;

        // allow delayed aborting
        event.abort = doabort;

        return finish;
      };

      // allows deferral
      function doabort() {
        if (event.forceCallback && callback) {
          callback.call(ui);
        }

        if (typeof fail_callback === 'function') {
          fail_callback.call(ui);
        }

        event.aborted = true;
      }

      // raise the event
      try {
        ui.saving = true;

        for (var i = 0; i < len; i++) {
          ui.saveStepHooks[i].call(event, step);

          // no use in continuing if we aborted
          if (abort) {
            ui.invalidateForm(event.errors, step);
            break;
          }
        }
      } catch (e) {
        // a hook misbehaved; abort! (will not catch async events,
        // obviously)
        abort = true;
        ui.emit('error', Error('Step save hook failure: ' + e.message));
      }

      ui.saving = false;

      // if we aborted, we do not want to call the callback
      if (abort) {
        doabort();
        return ui;
      }

      var finished = false;
      function finish() {
        // prevent multiple hold requests from executing this callback,
        // which could be disasterous!
        if (finished) {
          return;
        }

        finished = true;

        // successful; make sure the error box is hidden and all errors
        // are cleared out
        ui.hideErrors();

        // call the callback
        callback.call(ui);
      }

      // if a hold has been requested, then wait to finish; the holder
      // will call finish for us (hopefully!)
      if (!hold) {
        finish();
      }
    };

    if (immediately_save) {
      doSave();
    } else {
      // allow the UI to update
      setTimeout(doSave, 25);
    }

    return this;
  },

  /**
   * Hide errors
   *
   */
  'virtual protected hideErrors': function () {
    this.errorBox.hide();
  },

  /**
   * Whether there is a save event in progress
   *
   * @return {boolean}
   */
  isSaving: function () {
    return !!this.saving;
  },

  /**
   * Invalidates a form, highlighting invalid fields and displaying the error
   * box
   *
   * @param Array  errors list of errors in validation format
   * @param StepUi step   optional step to operate one (defaults to current)
   *
   * @return Ui self to allow for method chaining
   */
  invalidateForm: function (errors, step) {
    step = step || this.currentStep;

    if (errors === null) {
      return this;
    }

    // adapt data to maintain BC (TODO: remove)
    var adapted_errors = {};
    for (var name in errors) {
      for (var i in errors[name]) {
        this._program.addFailure(adapted_errors, name, [i], '', [name]);
      }
    }

    this._dataValidator.updateFailures({}, adapted_errors);

    // scroll to the first element and do NOT show a tooltip (we'll be doing
    // that manually when it receives focus)
    var invalid = step.getFirstInvalidField(this._cmatch);
    if (invalid) {
      invalid.push(false); // 3rd argument
      step.scrollTo.apply(step, invalid);
    }

    return this;
  },

  /**
   * Returns the navigation buttons for the given step
   *
   * @param StepUi step to get navigation buttons from
   *
   * @return jQuery collection of navigation buttons
   */
  _getNavButtons: function (stepui) {
    if (!stepui) {
      return $();
    }

    var $content = this._getStepContent(stepui);
    if (!$content) {
      return $();
    }

    return $content.find('.navbtns > *').add('input.navbtn') || $();
  },

  /**
   * Freezes navigation bar and buttons to prevent user from performing
   * navigation
   *
   * @return Ui self to allow for method chaining
   */
  freezeNav: function () {
    // disable navigation bar
    this.navFrozen = true;
    this.$navBar.addClass('frozen');

    // if we're not yet on a step, don't worry about nav buttons
    if (this.currentStep == null) {
      return this;
    }

    // store previous state of nav buttons and disable them
    this._getNavButtons(this.currentStep).each(function () {
      var $this = $(this);
      $this.data('prevDisabled', $this.attr('disabled'));
      $this.disable();
    });

    return this;
  },

  /**
   * Unfreezes navigation bar and nav buttons
   *
   * STEP defaults to the current step. It is recommended that STEP always
   * be passed, since it may be unpredictable with asynchrnous events.
   *
   * @Param {StepUi} step step target of unfreeze
   *
   * @return Ui self to allow for method chaining
   */
  unfreezeNav: function (step) {
    step = step || this.currentStep;

    // enable navigation bar
    this.navFrozen = false;
    this.$navBar.removeClass('frozen');

    // reset nav buttons to their previous state
    this._getNavButtons(step).each(function () {
      var $this = $(this);

      $this.attr('disabled', $this.data('prevDisabled'));

      $this.removeData('prevDisabled');
    });

    return this;
  },

  /**
   * Called when quote submit is complete
   *
   * FIXME: This should not exist here!
   *
   * @return {Ui} self
   */
  importComplete: function () {
    if (!this.nav.isLastStep()) {
      return this;
    }

    if ($(this._getNavButtons(this.currentStep)[1]).text() != 'Compare') {
      $(this._getNavButtons(this.currentStep)[1]).text(
        'View Binding Documents'
      );
    }

    this.updateLocked();
    return this;
  },

  'public updateLocked': function () {
    this._toggleLockedInd();

    if (!this.currentStep) {
      return;
    }

    // transform the current step
    this._postRenderStep();

    // transform navigation
    this.navStyler.quoteLocked(this.quote.isLocked());
    this.navStyler.highlightStep(this.currentStep.getStep().getId());

    return this;
  },

  'private _toggleLockedInd': function () {
    this.$content
      .toggleClass('quote-locked', this.quote.isLocked())
      .toggleClass(
        'quote-locked-full',
        this.quote.isLocked() && this.quote.getExplicitLockStep() === 0
      );
  },

  getStep: function (step_id) {
    return this.stepCache[step_id];
  },

  getSidebar: function () {
    return this.sidebar;
  },

  redrawNav: function () {
    this.navStyler.highlightStep(this.currentStep.getStep().getId());
    return this;
  },

  'public showNotifyBar': function (content) {
    this._notifyBar.setContent(content).show();

    return this;
  },

  'public hideNotifyBar': function () {
    this._notifyBar.hide();
    return this;
  },

  'public setCmatch': function (cmatch) {
    this.nav.updateStepVisibility(cmatch.__classes);
    this.redrawNav();
    this._cmatch = cmatch;
  },

  'public setInternal': function (internal) {
    this.$content.toggleClass('is-internal', internal);
  },

  'public virtual createDynamicContext': function (c) {
    var _self = this;
    c(DynamicContext(this._rootContext));

    return this;
  },

  'public createStepContext': function (c) {
    var content = this._getStepContent(this.getCurrentStep());

    this._rootContext.split(content[0].id, function (context) {
      c(context);
    });

    return this;
  },
});
