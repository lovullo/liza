/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-unused-vars: "off", no-undef: "off", no-var: "off", eqeqeq: "off", prefer-arrow-callback: "off", block-scoped-var: "off" */
/**
 * Liza client
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
const EventEmitter = require('../events').EventEmitter;
const DomFieldNotFoundError = require('../ui/field/DomFieldNotFoundError');
const UnknownEventError = require('./event/UnknownEventError');

/**
 * Controller for the program client
 *
 * This controls and mediates pretty much everything that goes on in the
 * client.  It has far too many responsibilities.
 *
 * @todo any time this class is touched, extract code.
 * @todo bring up to par with modern code standards
 */
module.exports = Class('Client').extend(EventEmitter, {
  /**
   * When an event is triggered (before it is handled)
   * @type {string}
   */
  'const EVENT_TRIGGER': 'trigger',

  /**
   * Triggered after a quote is changed, after a response is received from the
   * server
   *
   * @type {string}
   */
  'const EVENT_QUOTE_CHANGE': 'quoteChange',

  /**
   * Trigger after rates are retrieved from the server
   * @type {string}
   */
  'const EVENT_POST_RATE': 'postRate',

  /**
   * Triggered after save is complete and a response from the server is
   * received
   *
   * @type {string}
   */
  'const EVENT_POST_SAVE': 'postSave',
  'const EVENT_POST_SAVE_ALL': 'postSaveAll',

  /**
   * Factory used to create all needed objects
   * @type {ClientDependencyFactory}
   */
  _factory: null,

  /**
   * Element that the client should operate upon
   * @type {jQuery}
   */
  $body: null,

  /**
   * Used to communicate with the server
   * @type {ClientDataProxy}
   */
  dataProxy: null,

  /**
   * Used to style all elements for the UI
   * @type {ElementStyler}
   */
  elementStyler: null,

  /**
   * Handles navigation
   * @type {Nav}
   */
  nav: null,

  /**
   * Contains the object that controls the user interface
   * @type {Ui}
   */
  ui: null,

  /**
   * Handles dialog display
   * @type {UiDialog}
   */
  uiDialog: null,

  /**
   * Navigation bar
   * @type {jQuery}
   */
  $navBar: null,

  /**
   * Current quote
   * @type {ClientQuote}
   */
  'private _quote': null,

  /**
   * Holds group metadata
   * @type {Object}
   */
  groupData: {},

  /**
   * Holds the program id (e.g. 'artisan')
   * @type {string}
   */
  programId: '',

  /**
   * Holds the Program object generated from the XML
   * @type {Object}
   */
  program: null,

  /**
   * Whether to run the submit event client-side to provide a better user
   * experience
   *
   * Set this to FALSE to test server-side functionality.
   *
   * @type {boolean}
   */
  clientSideSubmitEvent: true,

  /**
   * Functions to call when quote is ready for importing
   * @type {Array.<Function>}
   */
  importHooks: [],

  /**
   * Functions to call when docs are requested
   * @type {Array.<Function>}
   */
  viewDocHooks: [],

  /**
   * The number of outstanding save requests
   * @type {number}
   */
  saving: 0,

  /**
   * Whether we are logged in internally
   * @type {boolean}
   */
  'private _isInternal': false,

  /**
   * Quick reference to the current step id
   * @type {number}
   */
  'private _currentStepId': 0,

  /**
   * Validate bucket data types
   * @type {DataValidator}
   */
  'private _dataValidator': null,

  /**
   * Track field failures and fixes
   * @type {ValidStateMonitor}
   */
  'private _fieldMonitor': null,

  /**
   * Validate and format fields
   * @type {BucketDataValidator}
   */
  'private _validatorFormatter': null,

  /**
   * Classification match handler
   * @type {Cmatch}
   */
  'private _cmatch': null,

  /**
   * Automatically discards staging bucket contents
   * @type {StagingBucketAutoDiscard}
   */
  'private _stagingDiscard': null,

  /**
   * Current save event
   * @type {Object}
   */
  'private _saveEvent': undefined,

  /**
   * Current navigation event
   * @type {boolean}
   */
  'private _is_navigating': false,

  /**
   * UI styler controller
   * @type {UiStyler}
   */
  'private _uiStyler': null,

  /**
   * Handles client-side events
   * @type {DelegateEventHandler}
   */
  'private _eventHandler': null,

  /**
   * Greater than 0 if urrently showing an error dialog
   * @type {number}
   */
  'private _showingError': 0,

  /**
   * Root DOM document node
   */
  'private _rootContext': null,

  /**
   * DataApi Manager
   * @type {DataApiManager}
   */
  'private _dapiManager': null,

  /**
   * User-visible validation error messages
   * @type {Object}
   */
  'private _validationMessages': {},

  /**
   * Default program id (if none provided)
   * @type {string}
   */
  'private _defaultId': 'default',

  /**
   * jQuery Object
   * @type {jQuery}
   */
  'private _jquery': null,

  /**
   * DOM
   * @type {Document}
   */
  'private _document': null,

  /**
   * Window object
   * @type {window}
   */
  'private _window': null,

  /**
   * Instantiates all the necessary objects and initializes the UI.
   *
   * The DEFAULT_ID represents whatever default program should be used in
   * the event that no program id can be determined from the URL (defaults
   * to `default`).
   *
   * @param {jQuery}                 $body      client body
   * @param {ClientDependencyFactor} factory    dependency factory
   * @param {string}                 default_id default program id
   * @param {jQeury}                _jquery     (optional)
   * @param {Document}              _document   (optional)
   * @param {window}                _window     (optional)
   *
   * @return undefined
   */
  __construct: function (
    $body,
    factory,
    default_id,
    _jquery,
    _document,
    _window
  ) {
    this._factory = factory;
    this.$body = $body;
    this._jquery = _jquery || jQuery;
    this._document = _document || document;
    this._window = _window || window;
    this.elementStyler = factory.createElementStyler(this._jquery);
    this.$navBar = this.$body.find('ul.step-nav');
    this.$navBarSection = this.$body.find('ul.section-nav');

    this._defaultId = default_id || 'default';

    // initialize our more complicated objects
    this._init();
  },

  /**
   * Returns the UI object
   *
   * @return lovullo.program.Ui
   *
   * XXX: Breaks encapsulation
   */
  getUi: function () {
    return this.ui;
  },

  /**
   * Returns the Element Styler object
   *
   * @return lovullo.program.ElementStyler
   */
  getElementStyler: function () {
    return this.elementStyler;
  },

  /**
   * Initializes common objects
   *
   * @return undefined
   */
  _init: function () {
    var client = this;
    var $ = this._jquery;

    // create the widget selector for jQuery
    $.extend($.expr[':'], {
      widget: this.elementStyler.getWidgetSelector(),
      'widget-id': this.elementStyler.getWidgetIdSelector(),
    });

    // used to communicate with the server
    this.dataProxy = this._createDataProxy(this._jquery);

    this.uiDialog = this._factory.createUiDialog();
    this.programId = this._getProgramId();
    this.program = this._createProgram();
    this.nav = this._factory.createNav(this.program);
    this.hashNav = this._createHashNav(this.nav);

    this._stagingDiscard = this._factory.createStagingBucketDiscard();

    this._fieldMonitor = this._factory.createFieldValidator();

    this._dataValidator = this._factory.createDataValidator(
      this.program.meta.qtypes,
      this._fieldMonitor
    );

    this.ui = this._createUi(this.nav);

    this._factory
      .createDataApiMediator(
        this.ui,
        this._dataValidator,
        this.program.dapimap || {},
        () => this.getQuote()
      )
      .monitor(this._dapiManager);

    this._eventHandler = this._factory.createClientEventHandler(
      this,
      this._dataValidator,
      this.elementStyler,
      this.dataProxy,
      this._jquery
    );

    this._cmatch = this._factory.createCmatch(this.program, this.__inst);

    this._validatorFormatter = this._factory.createValidatorFormatter(
      this.program.meta.qtypes
    );

    // set sidebar data
    this.ui.getSidebar().setData(this.program.sidebar);

    // no use in doing anything if our program logic is missing
    if (this.program == null) {
      return;
    }

    this.nav.setFirstStepId(this.program.getFirstStepId());

    var meta = this.program.meta;
    this.elementStyler
      .setTypeData(meta.qtypes)
      .setAnswerRefs(meta.arefs)
      .setHelpData(this.program.help)
      .setDefaults(this.program.defaults)
      .setDisplayDefaults(this.program.displayDefaults)
      .setSelectData(meta.qdata);

    this.groupData = meta.groups;

    // when the quote id changes, initialize a new quote
    this.nav
      .on('quoteIdChange', function (quote_id, clear_step) {
        var step_cur = client.ui.getCurrentStep(),
          do_change = function () {
            // perform quote change
            client._changeQuote(quote_id, clear_step);
          };

        var quote = client.getQuote();

        // if the current step is dirty, first prompt the user
        // TODO: check discardable flag
        if (step_cur && quote.isDirty()) {
          client.uiDialog.showDirtyDialog(
            // save
            function () {
              // save and perform quote change
              client.ui.saveStep(step_cur, function () {
                do_change();
              });
            },

            // discard
            function () {
              // get rid of the error box if it's shown
              // fixme
              client.ui.errorBox.hide();

              // now perform the quote change
              do_change();
            }
          );

          return;
        }

        // step isn't dirty, so we're good to perform the quote change
        do_change();
      })
      .on('stepChange', function (step_id) {
        client.ui.displayStep(step_id, function () {
          client._cmatch.forceCmatchAction();
        });

        client._currentStepId = step_id;

        // scroll to the top of the page
        client._window.scrollTo(0, 0);
      })
      .on('unload', function (event) {
        if (!client.ui.getCurrentStep()) {
          return;
        }

        var quote = client.getQuote();
        if (quote && quote.isDirty()) {
          event.returnValue =
            'You have unsaved changes to the ' +
            'current step. If you leave this page, changes to ' +
            'this step will be lost.';
        }
      });

    this._initBeforeLoadHook();
    this.ui.init();

    this.hashNav.init();
  },

  /**
   * Performs quote change
   */
  'private _changeQuote': function (quote_id, clear_step) {
    var client = this;

    this.ui.setQuote((client._quote = null));

    // initialize the quote (we don't need to do anything because the
    // hooks on the data proxy will allow us to get all the info we're
    // looking for)
    client.dataProxy.get(quote_id + '/init', function (data) {
      // if the server responds that the quote is invalid, then don't
      // bother passing it off to the UI (by now we probably already
      // have another quote object instantiated for the quote that the
      // server redirected us to)
      if (data.content.valid !== true) {
        return;
      }

      if (!data.content.autosave) {
        client.program.autosave = false;
      }

      // stop any currently running XHRs to ensure they don't conflict
      // with the new quote
      client.dataProxy.abortAll();

      // create a new quote instance
      client._quote = client._factory.createQuote(quote_id, data.content);

      // TODO: this seems like it should be a ctor argument
      client._quote.setProgram(client.program);

      client.nav.setMinStepId(client._quote.getExplicitLockStep());

      client._monitorFields();

      // store internal status
      client._isInternal = client.program.isInternal = data.content.internal
        ? true
        : false;
      client.ui.setInternal(client._isInternal);

      // attach the bucket to the sidebar (note: order of these method
      // calls is important)
      client.ui
        .getSidebar()
        .setInternal(client._isInternal)
        .setQuote(client._quote);

      // initialize
      client._quote.visitData(function (bucket) {
        client.program.initQuote(bucket);
      });

      client._cmatch.hookClassifier(client._dataValidator);

      client.ui.setQuote(client._quote, client.program, clear_step);

      // if logged in internally, show internal questions and do other
      // internal stuff (no, not that stuff)
      if (data.content.internal === true) {
        client.elementStyler.showInternal();
      }

      if (
        client._quote.isLocked() ||
        (data.content.internal && client._quote.getExplicitLockStep() > 0)
      ) {
        client.ui.showLockedNotification(data.content.internal);
      } else {
        client._hideLockedNotification();
      }

      client._hookQuote();

      client.emit(client.__self.$('EVENT_QUOTE_CHANGE'));

      // kick off the classifier (it may not be kicked off on step change
      // if there are no questions on the step that are used by it)
      client._quote.forceClassify();
    });
  },

  /**
   * Hooks quote for performing validations on data change
   *
   * @param {Object} diff Diff to validate
   *
   * @return {undefined}
   */
  validateChange: function (diff) {
    var _self = this;

    this._quote.visitData(function (bucket) {
      // it is important that we pass `undefined` here for class data,
      // _not_ an empty object
      _self._dataValidator
        .validate(diff, undefined, (vdiff, failures) => {
          _self._validateProgramChange(bucket, vdiff, failures);
        })
        .catch(e => _self.handleError(e));
    });
  },

  /**
   * Validate changes with program
   *
   * @param {QuoteDataBucket} bucket   quote data bucket
   * @param {Object}          diff     diff to process
   * @param {Object}          failures validation failures
   *
   * @return {undefined}
   */
  'private _validateProgramChange': function (bucket, diff, failures) {
    var trigger_callback = this._getValidationTriggerHandler();

    for (var name in diff) {
      // if we already have a problem with the field, then
      // save ourselves some effort and ignore it for now
      if (failures[name]) {
        continue;
      }

      var result = this.program.change(
        this._currentStepId,
        name,
        bucket,
        diff,
        this._cmatch.getMatches(),
        function () {
          var args = arguments;

          setTimeout(function () {
            // allow DOM operations to complete before we
            // trigger manipulations on it (TODO: this is
            // a workaround for group show/hide issues; we
            // need a better solution to guarantee order
            trigger_callback.apply(null, args);
          }, 25);
        }
      );

      for (var rname in result) {
        failures[rname] = [];

        for (var i in result[rname]) {
          // the expected format is for it to contain the
          // value for each index
          failures[rname][i] = result[rname][i];
        }

        this._genValidationMessages(this._validationMessages, result);
      }
    }
  },

  /**
   * Produce validation error messages intended for user display
   *
   * @param {Object} msg_dest destination for messages per field and index
   * @param {Object} failures failures per field name and index
   *
   * @return {undefined}
   */
  'private _genValidationMessages': function (msg_dest, failures) {
    for (var rname in failures) {
      msg_dest[rname] = [];

      for (var i in failures[rname]) {
        msg_dest[rname][i] = failures[rname][i];
      }
    }
  },

  /**
   * Perform a validation and invalidate the form if necessary
   *
   * @param {Function} validate_callback function to perform validation
   *
   * @return {undefined}
   */
  'private _performValidation': function (validate_callback) {
    var _self = this;

    this.getQuote().visitData(function (bucket) {
      // N.B.: We pass {} as the diff because nothing has actually changed
      _self.ui.invalidateForm(
        validate_callback(bucket, {}, _self._cmatch.getMatches())
      );
    });
  },

  /**
   * Retrieve function to handle validation triggers
   *
   * @return {Function} trigger handler
   */
  'private _getValidationTriggerHandler': function () {
    var client = this;
    return function (event_name, element_name, value, indexes) {
      client.handleEvent(event_name, {
        elementName: element_name,
        indexes: indexes,
        value: value,
        onEvent: 'validation',
      });
    };
  },

  /**
   * Retrieve function to handle visit triggers
   *
   * @return {Function} trigger handler
   */
  'private _getVisitTriggerHandler': function () {
    var client = this;
    return function (event_name, element_name, value, indexes) {
      client.handleEvent(event_name, {
        elementName: element_name,
        indexes: indexes,
        value: value,
        onEvent: 'visit',
      });
    };
  },

  /**
   * Retrieves the program ID from the URL
   *
   * @return String program id
   */
  _getProgramId: function () {
    // grab out of the url
    var data = this._window.location.href.match(/\/quote\/([a-z0-9-]+)\//i);

    return data === null ? this._defaultId : data[1];
  },

  /**
   * Instantiates the program object
   *
   * If it cannot be found, an error is displayed to the user
   *
   * @return Program|null the program object, or null if it could not be found
   */
  _createProgram: function () {
    var _self = this;

    try {
      this._dapiManager = this._factory.createDataApiManager();

      var program = this._factory.createProgram(
        this.programId,
        this._dapiManager
      );
    } catch (e) {
      // todo: better suited for brokers
      this.handleError(Error('Error loading program data: ' + e.message));

      return null;
    }

    program.on('error', function (e) {
      _self.handleError(e);
    });

    // handle field updates
    this._dapiManager.on('error', function (e) {
      _self.handleError(e);
    });

    return program;
  },

  _createDataProxy: function (jquery, prohibit_abort) {
    prohibit_abort = !!prohibit_abort;

    var client = this;
    var proxy = this._factory.createDataProxy(jquery);

    // process the data before returning it to the requesters
    proxy.on('received', function (data, event) {
      var quote_id = data.quoteId || proxy.quoteId;
      var has_error = data.hasError || false;
      var actions = data.actions || [];

      // the requester shouldn't be bothered with details that we're going
      // to be handling
      delete data.quoteId;
      delete data.hasError;

      // if there's an error, then the content should be treated as the
      // error message
      if (has_error) {
        // don't let the data get to the requester; there was a problem
        if (prohibit_abort) {
          data.hasError = has_error;
        } else {
          event.abort();
        }

        var caption = data.btnCaption || '';
        var callback = null;

        // if an action was provided, we want it to be executed when the
        // dialog is closed
        if (actions.length > 0) {
          callback = function () {
            client._processActions(actions);
          };
        }

        // is there an error callback?
        if (data.errorCallback instanceof Function) {
          if (data.errorCallback() === true) {
            // they handled displaying the dialog
            return;
          }
        }

        // show the dialog only if there's an error message
        if (data.content) {
          client.uiDialog.showErrorDialog(
            data.content,
            caption,
            callback,

            // if we're internal, it's likely our error messages
            // will be more involved, so increase the width
            client._isInternal ? 450 : undefined
          );
          client.ui.unfreezeNav();
        }
        // otherwise, just call the callback
        else if (callback instanceof Function) {
          callback();
        }

        return;
      }

      // if the quote id changed, then change the quote id
      var curid = client._quote ? client._quote.getId() : 0;
      if (quote_id !== curid) {
        client.nav.setQuoteId(quote_id);
      }

      // was there an action?
      if (actions.length > 0) {
        client._processActions(actions);

        // no longer needed
        delete data.actions;
      }
    });

    return proxy;
  },

  _processActions: function (actions) {
    actions = actions || [];

    // don't do anything if we don't have any actions
    if (actions.length == 0) {
      return;
    }

    // process each of the actions
    var len = actions.length;
    for (var i = 0; i < len; i++) {
      this._processAction(actions[i]);
    }
  },

  /**
   * Processes server actions
   *
   * These actions are received from the server and should be carried out by
   * the client obediently.
   *
   * @param Object action action data
   *
   * @return undefined
   */
  _processAction: function (action) {
    var action_type = action.action,
      client = this;

    switch (action_type) {
      case 'gostep':
        var id = action.id || this.nav.getCurrentStepId();
        this.nav.navigateToStep(id, true);

        break;

      case 'invalidate':
        var errors = action.errors || [];
        this.ui.invalidateForm(errors);

        break;

      case 'quotePrompt':
        this.uiDialog.showQuoteNumberPrompt(
          // ok
          function (quote_id) {
            // attempt to navigate to the quote id
            client.nav.setQuoteId(quote_id);
          }
        );
        break;

      case 'warning':
        this.uiDialog.showErrorDialog(action.message);
        break;

      case 'setProgram':
        this._document.location.href =
          '/quote/' + action.id + '/#' + action.quoteId;
        break;

      case 'lock':
        // we don't need the reason client-side
        this._quote.setExplicitLock('quote server');
        this.ui.updateLocked();
        this._showLockedNotification(this.isInternal());
        break;

      case 'unlock':
        this._quote.clearExplicitLock().setImported(false);
        this.ui.updateLocked();
        this._hideLockedNotification();
        break;

      case 'indvRate':
        this._eventHandler.handle(action_type, function () {}, {
          stepId: this.nav.getCurrentStepId(),
          indv: action.id,
        });
        break;

      case 'kickBack':
      case 'delay':
        this._eventHandler.handle(action_type, function () {}, action);
        break;

      default:
        window.console &&
          console.error('Unrecognized action: %s', action.action);
    }
  },

  /**
   * Instantiates the UI object
   *
   * @param lovullo.program.Nav nav navigation object to use for UI
   *
   * @return lovullo.program.Ui new UI object
   */
  _createUi: function (nav) {
    var client = this,
      $rater_step = this.$body.find('#rater-step'),
      $sidebar = this.$body.find('#rater-sidebar'),
      $error_box = $sidebar.find('#error-box'),
      $rater_content = this.$body.find('#rater-content'),
      errbox = this._factory.createFormErrorBox($error_box),
      root_context = null;

    var ui = this._factory.createUi({
      content: this.$body,
      styler: this.elementStyler,
      nav: nav,
      navStyler: this._factory.createNavStyler(
        this.$navBar,
        this.$navBarSection,
        nav
      ),
      errorBox: errbox,
      sidebar: this._createSidebar($sidebar, this.elementStyler),
      dialog: this.uiDialog,
      notifyBar: this._factory.createNotifyBar($rater_content, this.$navBar),

      uiStyler: this._createUiStyler($error_box),
      navBar: this._factory.createUiNavBar(
        this._jquery,
        this.$navBar,
        this.$navBarSection
      ),

      dataValidator: this._dataValidator,

      rootContext: (root_context = this._factory.createRootDomContext(
        // root html node
        this._document.childNodes[this._document.childNodes.length - 1],

        this._factory.createDomFieldFactory(this.elementStyler)
      )),

      stepContainer: $rater_step,
      stepBuilder: function (id, callback) {
        return client._buildStep(id, callback);
      },
    });

    this._rootContext = root_context;

    // handle context errors
    root_context.on('error', function (e) {
      client.handleError(e);
    });

    // must init after the Ui obj is available
    this._initUiStyler(ui, errbox);

    ui.on('stepChange', function (step_id) {
      // don't do anything if navigation is frozen
      if (ui.navFrozen) {
        window.console && console.log('Navigation is frozen. Ignoring input.');
        return;
      }

      if (nav.isValidNextStep(step_id)) {
        // clear out any validation problems we may have had, since
        // clearly they didn't prevent us from moving forward
        // (FS#11252)
        if (ui.getCurrentStep()) {
          ui.getCurrentStep().getStep().setValid(true);
        }

        nav.navigateToStep(step_id);
      }
    })
      .on('action', function (type, ref, index) {
        // use a char that's prohibited in event names as the separator
        var action_event = 'action$' + type;

        if (client._eventHandler.hasHandler(action_event)) {
          client._eventHandler.handle(action_event, function (err, data) {}, {
            ref: ref,
            index: index,
          });
        }

        client._quote.visitData(function (bucket) {
          // trigger the action (this is part of the Program code,
          // is generated from the program XML)
          client.program.action(
            client._quote.getCurrentStepId(),
            type,
            ref,
            index,
            bucket,
            client._getValidationTriggerHandler()
          );
        });
      })
      .on('quoteRelock', function () {
        client.emit('quoteRelock');
      })
      .on('error', function (e) {
        client.handleError(e);
      });

    return ui
      .saveStep(function (stepui) {
        var event = this;

        // attempt to save the step and abort the operation if it failed
        client.saveStep(stepui, event, function (result) {
          if (result === false) {
            event.abort();
          }
        });
      })
      .on('renderStep', function (step) {
        var step_id = step.getStep().getId(),
          url = client._quote.getId() + '/step/' + step_id + '/visit';

        client._quote.setCurrentStepId(step_id);
        client._is_navigating = false;

        // run any visit hooks
        client._quote.visitData(function (bucket) {
          // Just let the server know we're visiting this step (we don't even
          // care about a response). This will allow the server to save our
          // current step even if it's cached client-side.
          client.dataProxy.get(url, function () {
            client.program.visitStep(
              step_id,
              bucket,
              client._getVisitTriggerHandler()
            );
          });
        });
      })
      .on('preRenderStep', function (step, $content) {
        client._is_navigating = true;
        client.elementStyler.setContext($content);
      });
  },

  'private _createUiStyler': function ($error_box) {
    return (this._uiStyler = this._factory.createUiStyler(
      this.$body,
      this.elementStyler
    ));
  },

  'private _initUiStyler': function (ui, errbox) {
    this._uiStyler
      // default error messages to the help message, if any
      .attach(this._factory.createStepErrorStyler(this.program.help))
      .attach(
        this._factory.createSidebarErrorStyler(this.program.help, errbox, ui)
      );
  },

  _createSidebar: function ($sidebar, styler) {
    var _self = this,
      sidebar = this._factory.createSidebar($sidebar, styler);

    sidebar.on('uwmanage', function () {
      // TODO: will it always be one? Magic number! Use constant if need
      // be.
      _self.nav.navigateToStep(1);
    });

    return sidebar
      .on('quoteIdClick', function quoteIdClick() {
        // when the quote id is clicked, display a dialog listing their
        // options
        _self.uiDialog.showNavErrorDialog({
          title: 'Change quote id',
          text: 'Would you like to:',
          noX: false,

          search: function () {
            _self._doQuoteSearch();
          },

          enter: function () {
            _self._doQuoteIdPrompt({
              error: function () {
                // re-call this function
                quoteIdClick();
              },
            });
          },

          cancel: function () {},
        });
      })
      .on('agentIdClick', function agentIdClick() {
        // do nothing if we're not internal
        if (_self._isInternal === false) {
          return;
        }

        // XXX: hardcoding internal links is not the best of ideas;
        // ideally, send to a page that will redirect, or receive URL
        // from the server as a configuration value
        window.open(
          'http://marketing.lovullo.local/' + _self._quote.getAgentId()
        );
      });
  },

  /**
   * Creates the hash navigation object
   *
   * This method also sets up an error dialog to be displayed when hash
   * navigation fails.
   *
   * @param Nav nav navigation object
   *
   * @return undefined
   */
  _createHashNav: function (nav) {
    var client = this,
      hashnav = this._factory.createHashNav(nav, this.program.steps);

    return hashnav.hashError(function () {
      client.uiDialog.showNavErrorDialog({
        noX: true,

        search: function () {
          client._doQuoteSearch();
        },

        enter: function () {
          client._doQuoteIdPrompt({
            error: function () {
              hashnav.hashError();
            },
          });
        },
      });
      return hashnav;
    });
  },

  _doQuoteSearch: function () {
    // redirect to pa_rating (this will change in the future)
    window.location.href = '/pa_rating.php';
  },

  _doQuoteIdPrompt: function (options) {
    var client = this;

    // prompt for the quote number
    this.uiDialog.showQuoteNumberPrompt(
      // ok
      function (quote_id) {
        // if the quote id is the same, just restore the
        // hash
        if (client._quote && quote_id == client._quote.getId()) {
          client.hashNav.updateHash();
          return;
        }

        // attempt to navigate to the quote id
        client.nav.setQuoteId(quote_id, true);
      },

      // cancel
      function () {
        // redisplay the error
        if (options.error instanceof Function) {
          options.error();
        }
      }
    );
  },

  /**
   * Retrieves the step from the server
   *
   * @param Integer  step_id  id of the step to retrieve
   * @param Function callback function to call after retrieval is successful
   *
   * @return undefined
   */
  _getStepContent: function (step_id, callback) {
    var _self = this,
      quote_id = this._quote.getId();

    if (this.saving > 1) {
      // if we're in the process of saving more than one step, then block
      // until at least one of them finishes (in an attempt to prevent
      // race conditions as in FS#12085 that would prevent navigating
      // ahead two steps)
      setTimeout(function () {
        // re-try
        _self._getStepContent.apply(_self, arguments);
      }, 100);

      return;
    }

    // retrieve the step
    this.dataProxy.get(quote_id + '/step/' + step_id, callback);
  },

  /**
   * Builds a new group object from the given content
   *
   * @param {HTMlElement}     content   group content
   * @param {ElementStyler}   styler    styler to use for elements
   * @param {FieldStyler}     na_styler N/A field styler
   *
   * @return lovullo.program.Group new group object
   */
  _buildGroup: function (content, styler, na_styler) {
    var group = this._factory.createGroup(),
      ui = this._factory.createGroupUi(
        group,
        content,
        styler,
        this._rootContext,
        na_styler,
        this.program.meta.qtypes,
        this.program.meta.arefs
      ),
      id = ui.getId(),
      data = this.groupData[id],
      exclusive_fields = this.program.groupExclusiveFields[id] || [],
      cmatch_fields = this._cmatch.getCmatchFields(exclusive_fields);

    group
      .setIndexFieldName(this.program.groupIndexField[id] || '')
      .setFieldNames(this.program.groupFields[id] || [])
      .setExclusiveFieldNames(exclusive_fields)
      .setExclusiveCmatchFieldNames(cmatch_fields)
      .setInternal(this._isInternal)
      .setUserFieldNames(this.program.groupUserFields[id] || [])
      .setWhenFieldName(this.program.groupWhens[id] || '');

    // do we have any data on this group?
    if (data) {
      // apply it
      if (data.max) {
        group.maxRows(+data.max);
      }
      if (data.min) {
        group.minRows(+data.min);
      }
    }

    // initialize the group
    ui.init(this._quote);

    return ui;
  },

  /**
   * Create a collection
   *
   * @param {HTMLElement} content - main UI element
   * @param {GroupUi}     groups  - groups in the UI
   *
   * @return {Collection} a collection of groups
   */
  _buildCollection: function (content, groups) {
    return this._factory.createCollection(content, groups);
  },

  /**
   * Builds a new step
   *
   * @param {number} id id of the step
   *
   * @return {StepUi} new instance
   */
  _buildStep: function (id, callback) {
    var client = this;

    var step = this._factory
      .createStep(id, this._quote)
      .setRequiredFieldNames(this.program.requiredFields[id])
      .setSortedGroupSets(this.program.sortedGroups[id]);

    var step_ui = this._factory.createStepUi(
      step,
      this.elementStyler,
      this._validatorFormatter,

      // group builder
      function (content, styler) {
        return client._buildGroup(
          content,
          styler,
          client._factory.createNaFieldStyler()
        );
      },

      // collection builder
      function (content, groups) {
        return client._buildCollection(content, groups);
      },

      // step builder
      function (step_id, callback) {
        return client._getStepContent(step_id, callback);
      },

      function (ui) {
        client._initStepUi(ui, callback);

        ui.on('dataChange', function (data) {
          client._quote.setData(data);
        });
      }
    );
  },

  _initStepUi: function (step_ui, callback) {
    var client = this,
      id = step_ui.getStep().getId();

    step_ui
      .on('indexAdd', function (index, groupui) {
        var fields = groupui.getGroup().getFieldNames(),
          i = fields.length,
          data = {};

        while (i--) {
          var name = fields[i];

          data[name] = [];
          data[name][index] = client.elementStyler.getDefault(name);
        }

        // add defaults to staging bucket
        client._quote.setData(data);
      })
      .on('indexRemove', function (index, groupui) {
        var fields = groupui.getGroup().getFieldNames(),
          i = fields.length,
          values = {},
          quote = client._quote;

        // loop through each of the fields associated with the group (note
        // that this will include linked groups)
        while (i--) {
          var cur_i = index,
            name = fields[i],
            prev_data = quote.getDataByName(name),
            len = prev_data.length,
            prev_val = null;

          values[name] = [];

          // cascade the values downward atop of the index that is being
          // removed
          while (++cur_i < len) {
            prev_val = prev_data[cur_i];

            values[name][cur_i - 1] = prev_val;
          }

          if (cur_i == 1) {
            // first row reset value to default
            var def_val = client.elementStyler.getDefault(name);
            values[name][cur_i - 1] = def_val;
          } else {
            // mark as removed in dirty bucket
            values[name][cur_i - 1] = null;
          }
        }

        // set data all at once to avoid extraneous calls
        quote.setData(values);
      })
      .on('indexReset', function (index, groupui) {
        var fields = groupui.getGroup().getFieldNames(),
          i = fields.length,
          values = {},
          quote = client._quote;

        // loop through each of the fields associated with the group (note
        // that this will include linked groups)
        while (i--) {
          var name = fields[i],
            def_val = client.elementStyler.getDefault(name);

          // set index to original value
          values[name] = [];
          values[name][index] = def_val;
        }

        // set data all at once to avoid extraneous calls
        quote.setData(values);
      });

    // when the step is rendered, run the onchange events
    this.ui.on('renderStep', function (step) {
      if (step.getStep().getId() !== id) {
        return;
      }

      client.program.eachChangeById(
        id,
        function (name, callback) {
          client._performValidation(callback);
        },
        client._getValidationTriggerHandler()
      );
    });

    callback(step_ui);
  },

  /**
   * Saves a step
   *
   * @param StepUi stepui step to save
   *
   * @return {boolean} true on success, false on failure
   */
  'public saveStep': function (stepui, event, callback) {
    var client = this;

    // if the step contains invalid data, they must correct it
    if (!stepui.isValid(this._cmatch.getMatches())) {
      // well we didn't get very far
      callback(false);
    }

    if (this._quote.isLocked() === true) {
      // we still want to call the callback
      event.forceCallback = true;
      callback(false);
    }

    var step_id = stepui.getStep().getId();
    var bucket = stepui.getStep().getBucket();

    // we want to do this before save so that we don't re-mark the bucket as
    // dirty by populating it with uncommitted data
    client._cmatch.clearCmatchFields();

    // give devs the option to disable client-side submit events so we can
    // test server-side functionality
    if (this.clientSideSubmitEvent) {
      // let's see what our program class has to say about this so-called
      // "valid data"
      // XXX: Shouldn't this have a trigger_callback? If triggerse
      // shouldn't occurr, we should still throw an exception if one is
      // triggered
      var failures = this.program.submit(
        step_id,
        bucket,
        this._cmatch.getMatches()
      );

      if (failures !== null) {
        this._genValidationMessages(this._validationMessages, failures);

        // TODO: move above validation logic into here
        client._dataValidator.updateFailures({}, failures);

        event.errors = failures;
        callback(false);

        return;
      }
    }

    this._quote.needsImport(true);

    // transport used to transfer the bucket data to the server, prohibiting
    // callback aborts (to ensure that we can handle failures ourselves)
    var transport = this._createBucketTransport(
      step_id,
      true,
      event.concluding_save
    );

    var finish, timeout;
    function dosave() {
      // if we're already saving, then block
      if (client.isSaving()) {
        // request a continuation that will allow us to finish the
        // request when we are ready
        if (!finish) {
          finish = event.hold();
          timeout = client._setSaveWaitTimeout(event);
        }

        // only poll if the event has not been aborted
        if (!event.aborted) {
          setTimeout(dosave, 50);
        }

        return;
      }

      // store the save event so that it can be aborted in case of an
      // error that we cannot handle
      client._clearSaveWaitTimeout(timeout);
      client._saveEvent = event;
      client.saving++;

      // save the quote
      // todo: refactor this saving crap
      stepui.saving = true;
      client._quote.save(transport, function (data) {
        client.saving--;
        client._saveEvent = undefined;
        stepui.saving = false;

        // do not process save callback if the save failed
        if (data.hasError) {
          return;
        }

        // can be hooked to perform an actual after saving is fully
        // complete (preventing, say, race conditions for future
        // requests)
        client.emit(client.__self.$('EVENT_POST_SAVE'), client.saving);

        if (client.saving === 0) {
          client.emit(client.__self.$('EVENT_POST_SAVE_ALL'));
        }
      });

      callback(true);
      finish && finish();
    }

    // run post-submit hooks (it is important that we do this immediately,
    // otherwise we may run hooks intended for the current step while we're
    // on another)
    client.program.postSubmit(stepui.getStep().getId(), bucket, function (
      event,
      question_id,
      value
    ) {
      client.handleEvent(event, {
        stepId: +value,
        onEvent: 'submit',
      });
    });

    dosave();
  },

  'private _setSaveWaitTimeout': function (event) {
    var _self = this;

    // display a timeout if the save seems to not be completing...just as a
    // fallback
    return setTimeout(function () {
      event.abort();

      _self.handleError(Error('Save timeout; please try again'));
    }, 15000);
  },

  'private _clearSaveWaitTimeout': function (timeout) {
    clearTimeout(timeout);
  },

  /**
   * Whether there is a current save event
   *
   * @return {boolean}
   */
  'public isSaving': function () {
    return this._saveEvent !== undefined;
  },

  /**
   * Whether there is a navigation event in progress
   *
   * @return {boolean}
   */
  'public isNavigating': function () {
    return !!this._is_navigating;
  },

  'public abortSave': function () {
    if (!this.isSaving()) {
      return this;
    }

    this._saveEvent.abort();
    this._saveEvent = undefined;

    return this;
  },

  /**
   * Heartbeat
   *
   * Previously, this would save the staging bucket to the server (for
   * debug/recovery purposes).  While data are still sent, it should be
   * ignored by the server.
   *
   * TODO: Remove once we have a proper heartbeat route.
   *
   * @return {Client} self
   */
  'public saveStaging': function () {
    // abort if no quote is currently loaded
    if (!this._quote) {
      return this;
    }

    var transport = this._createStagingBucketTransport();

    // we don't care whether or not it succeeds; just give it a shot
    this._quote.saveStaging(transport);
    return this;
  },

  'private _createBucketTransport': function (
    step_id,
    prohibit_abort,
    concluding_save
  ) {
    return this._factory.createDataBucketTransport(
      this._quote.getId() + '/step/' + step_id + '/post',
      this._createDataProxy(this._jquery, prohibit_abort),
      concluding_save
    );
  },

  'private _createStagingBucketTransport': function () {
    return this._factory.createStagingDataBucketTransport(this._quote.getId());
  },

  /**
   * Initializes hook that will trigger the beforeLoad event
   *
   * @return undefined
   */
  _initBeforeLoadHook: function () {
    var client = this;

    this.nav.on('preStepChange', function (event) {
      var step = client.ui.getCurrentStep(),
        quote = client.getQuote();

      // if we don't even have a quote loaded, then don't allow navigation
      // fixme
      if (client.ui.quote === null) {
        event.abort = true;

        // fixme
        client.ui.quoteReadyEvent = event;
        return;
      }

      // if this is the initial step change, we may not yet have a current
      // step
      if (step) {
        var step_id = step.getStep().getId(),
          ui = client.ui;

        // forward validations should be run when advancing a step
        if (client._forwardValidate(event) === false) {
          event.abort = true;
          return;
        }

        // if the current step is not dirty or the quote has been
        // locked, just let them through
        const autosave_backwards =
          client.program.autosave && event.stepId < event.currentStepId;

        if (
          !(
            autosave_backwards ||
            client._quote.isLocked() ||
            step_id < quote.getExplicitLockStep()
          ) &&
          quote.isDirty() &&
          !event.force
        ) {
          // the step is dirty; abort the navigation and display the
          // dirty dialog, prompting the user what to do
          event.abort = true;

          var dosave = function () {
            ui.saveStep(step, function () {
              event.resume(true);
            });
          };

          // if discarding is not permitted, then do not even show the
          // dialog; just save and continue
          if (!client.program.discardable[step_id] || client.program.autosave) {
            dosave();
            return;
          }

          client.uiDialog.showDirtyDialog(
            // save
            dosave,

            // discard
            function () {
              // errors for this step are no longer valid
              client._dataValidator.clearFailures();

              client._queueBucketDiscard();
              step.reset(function () {
                event.resume(true, function () {
                  client._disableBucketDiscard(false);
                });
              });
            }
          );

          return;
        }

        // clear any failures if user is navigating backwards via top nav
        if (autosave_backwards) {
          client._dataValidator.clearFailures();
        }
      }

      // if this is the last step and the user is trying to go further,
      // we'll be doing the import
      if (
        client.nav.isLastStep(event.currentStepId) &&
        event.stepId > event.currentStepId
      ) {
        // don't allow navigation
        event.abort = true;

        // if the quote has not yet been imported, or needs to be
        // updated, then import it
        if (client._quote.needsImport()) {
          client.importQuote();
        }
        // otherwise, request the documents
        else {
          client.viewDocs();
        }

        return;
      }

      // keep track of the events so we know whether or not we need to
      // wait for the asynchronous ones to complete
      var event_count = 0,
        fail_count = 0,
        waiting = false;

      var try_continue_nav = function () {
        event_count--;

        // if they're waiting on us and there's no more
        // events, resume navigation
        if (waiting && event_count == 0) {
          client.ui.unfreezeNav();

          // if there's any failures, we do not want to
          // unfreeze the UI
          if (fail_count == 0) {
            event.resume();
          }
        }
      };

      // the trigger callback is not asynchronous (XXX: we shouldn't have
      // to do this with the bucket; refactor)
      client._quote.visitData(function (bucket) {
        client.program.beforeLoadStep(event.stepId, bucket, function (
          event_name,
          element_name,
          value,
          indexes
        ) {
          event_count++;

          client.handleEvent(
            event_name,
            {
              stepId: event.stepId,
              elementName: element_name,
              indexes: indexes,
              value: value,
              onEvent: 'beforeLoad',
            },
            function () {
              try_continue_nav();
            },
            // failure
            function () {
              fail_count++;
              try_continue_nav();
            }
          );
        });
      });

      // if we still have events running, then abort until they're
      // complete
      waiting = true;
      if (event_count > 0 || fail_count > 0) {
        event.abort = true;

        // freeze navigation to ensure user doesn't try to navigate
        // again while events are still running, thereby triggering a
        // bunch of them
        if (event_count > 0) {
          client.ui.freezeNav();
        }
      }
    });
  },

  'private _queueBucketDiscard': function () {
    var _self = this;
    this.getQuote().visitData(function (staging) {
      staging.once('revert', function () {
        _self._clearValidationErrors();
        _self._stagingDiscard.enable(staging);
      });
    });
  },

  /**
   * Clear all validation errors
   *
   * @return {undefined}
   */
  'private _clearValidationErrors': function () {
    var _self = this;

    this.getQuote().visitData(function (bucket) {
      _self._dataValidator.updateFailures(bucket.getData(), {});
    });
  },

  'private _disableBucketDiscard': function () {
    var _self = this;
    this.getQuote().visitData(function (staging) {
      _self._stagingDiscard.disable(staging);
    });
  },

  /**
   * Perform `forward' validations if needed
   *
   * Forward validations are performed when the user advances one or more
   * steps, permitting the user to save and return to previous steps without
   * receiving certain errors. See FS#9014.
   *
   * @param {Object} event navigation event as received from preStepChange
   *
   * @return {undefined}
   */
  'private _forwardValidate': function (event) {
    var step = this.ui.getCurrentStep().getStep(),
      cur_step_id = step.getId(),
      bucket = step.getBucket(),
      client = this;

    // perform the validations only if we are advancing one or more steps
    if (event.stepId <= cur_step_id) {
      return;
    }

    // same concept as "submit" event
    var failures = this.program.forward(
      cur_step_id,
      bucket,
      this._cmatch.getMatches(),
      function (trigger_event, question_id, value) {
        client.handleEvent(trigger_event, {
          stepId: +value,
          onEvent: 'forward',
        });
      }
    );

    // in the event of a failure, abort navigation and display the errors
    // just as we would with the `submit' event.
    if (failures !== null) {
      this._genValidationMessages(this._validationMessages, failures);

      this._dataValidator.updateFailures({}, failures);

      return false;
    }

    return true;
  },

  importQuote: function (hook) {
    var client = this;

    if (hook instanceof Function) {
      this.importHooks.push(hook);
      return this;
    }

    var hook_count = this.importHooks.length,
      callback_count = 0,
      callback_check = function (show_locked) {
        show_locked = show_locked === undefined ? true : !!show_locked;

        // did we receive responses from each of the hooks (crude
        // check - a single hook could be pushy and call it multiple
        // times)
        if (callback_count === hook_count) {
          // import is complete
          client.setImported(client.isInternal(), show_locked);
        }
      };

    // call the hooks
    for (var i = 0; i < hook_count; i++) {
      this.importHooks[i].call(this, this._quote, function (show_lock) {
        callback_count++;
        callback_check(show_lock);
      });
    }

    return this;
  },

  'public setImported': function (internal, show_locked) {
    show_locked = show_locked === undefined ? true : !!show_locked;

    this._quote.setImported(true);
    this.ui.importComplete();

    if (show_locked) {
      this.ui.showLockedNotification(internal);
    }
  },

  viewDocs: function (hook) {
    if (hook instanceof Function) {
      this.viewDocHooks.push(hook);
      return this;
    }

    // call the hooks
    for (var i = 0, len = this.viewDocHooks.length; i < len; i++) {
      this.viewDocHooks[i].call(this, this._quote);
    }

    return this;
  },

  /**
   * Creates a new quote
   *
   * @return Client self to allow for method chaining
   */
  newQuote: function () {
    // temporary way to accomplish this
    this.nav.setQuoteId(0);

    return this;
  },

  /**
   * Handles client-side events
   *
   * @param {string}           event_name     name of the event
   * @param {Object}           data           data to pass to event
   * @param {function(Object)} callback       function to call when event is done
   * @param {function(Error)}  error_callback function to call if event fails
   *
   * @return {Client} self to allow for method chaining
   */
  handleEvent: function (event_name, data, callback, error_callback) {
    var _self = this,
      stepui = this.ui.getCurrentStep();

    this.emit(this.__self.$('EVENT_TRIGGER'), event_name, data);

    this._eventHandler.handle(
      event_name,
      function (err, data) {
        if (err) {
          error_callback && error_callback(err);
          return this;
        }

        // XXX: move me
        if (event_name === 'rate') {
          _self.emit(_self.__self.$('EVENT_POST_RATE'), data);
        }

        callback && callback(data);
      },
      data
    );

    return this;
  },

  /**
   * Returns the current quote
   *
   * @return {ClientQuote}
   */
  getQuote: function () {
    return this._quote;
  },

  'private _hideLockedNotification': function () {
    var client = this;

    // permit redraw before we show/hide, since it's at the top of the creen
    // and it'll redraw everything
    setTimeout(function () {
      client.ui.hideNotifyBar();
    }, 25);
  },

  'private _monitorFields': function () {
    var _self = this,
      ui = this.ui,
      styler = this._uiStyler,
      msgs = this._validationMessages,
      err = styler.register('fieldError'),
      fixed = styler.register('fieldFixed');

    this._fieldMonitor
      .on('failure', function (failures) {
        var cause = _self._genValidCause(failures);
        ui.getCurrentStep().getStep().setValid(false, cause);

        err(failures, msgs);
      })
      .on('fix', function (fixes) {
        if (!_self._fieldMonitor.hasFailures()) {
          ui.getCurrentStep().getStep().setValid(true, '');
        }

        fixed(fixes);

        for (var name in fixes) {
          // don't matter if we delete indexes that are still
          // in use; this data is no longer needed
          delete msgs[name];
        }
      })
      .on('error', function (e) {
        _self.handleError(e);
      });
  },

  /**
   * Attach any quote hooks for the current quote
   */
  'private _hookQuote': function () {
    this._createQuoteHooks().forEach(hook => hook(this._quote));
  },

  /**
   * Create hooks to attach to the quote
   *
   * @return {array} an array of functions to hook the quote
   */
  'private _createQuoteHooks': function () {
    var hooks = [];

    hooks.push(this._factory.createQuotePreStagingHook(this));

    hooks.push(
      this._factory.createQuoteStagingHook(
        this,
        this.program,
        this._quote.getId(),
        this.dataProxy
      )
    );

    return hooks;
  },

  'private _genValidCause': function (failures) {
    var cause = '';
    for (var name in failures) {
      var failure = failures[name];

      for (var i in failure) {
        cause += cause ? '; ' : '';
        cause += name + '[' + i + ']';
      }
    }

    return cause;
  },

  /**
   * Handle error events
   *
   * Ideally, this should never happen. This method indicates an error that
   * could not be properly handled by another part of the system. Let the user
   * know that this should not be happening and trigger our own error event.
   *
   * @param {Error} e error
   *
   * @return {undefined}
   */
  'public handleError': function (e) {
    if (!e) {
      e = Error('Client received an empty error!');
    }

    // emit this error on our own error event
    this.emit('error', e);

    // if we're not internal, do not spam error dialogs (that looks bad ;))
    if (this._showingError++) {
      // if we're internal, notify of the problems
      if (this._showingError === 2 && this.isInternal()) {
        this.uiDialog.showErrorDialog(
          '[Internal] A number of errors have occurred; please ' +
            'see the console for more information. (Avoiding ' +
            'dialog spam.)',

          'Okay'
        );
      }

      return;
    }

    // let the user know that something is amiss.
    this.uiDialog.showErrorDialog(
      'An unexpected error has occurred. If you continue to receive ' +
        'this message, please contact our support team.' +
        // if internal, show the actual error
        (this.isInternal() ? '<br /><br />[Internal] ' + e.message : ''),

      'Close',

      function () {
        this._showingError = 0;
      }
    );
  },

  'public isInternal': function () {
    return this._isInternal;
  },

  /**
   * Retrieve current program id
   *
   * @return {string} program id
   */
  'public getProgramId': function () {
    return this.program.id;
  },
});
