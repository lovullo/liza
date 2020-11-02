/* TODO auto-generated eslint ignore, please fix! */
/* eslint no-unused-vars: "off", node/no-unpublished-require: "off", no-var: "off", prefer-arrow-callback: "off", no-dupe-keys: "off", eqeqeq: "off", no-unreachable: "off", block-scoped-var: "off", no-undef: "off" */
/*
 * Contains program Server class
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
 * @todo like Client and Ui, this mammoth did not evolve well and has too
 *       many responsibilities; refactor
 */

const {Class} = require('easejs');
const {EventEmitter} = require('../events');

const fs = require('fs');
const util = require('util');

const {
  bucket: {
    bucket_filter,
    QuoteDataBucket,
    BucketSiblingDescriptor,
    delta,

    diff: {
      StdBucketDiffContext,
      GroupedBucketDiffContext,
      StdBucketDiffResult,
      GroupedBucketDiffResult,
      StdBucketDiff,
    },
  },

  error: {
    NoPendingError: {NoPendingError},
    MissingParamError: {MissingParamError},
  },

  field: {FieldClassMatcher},

  server: {
    request: {
      DataProcessor: {DataProcessor},
    },
    service: {
      RatingService: {RatingService},
    },
    encsvc: {QuoteDataBucketCipher},
    quote: {ServerSideQuote: Quote},
  },

  util: {ShallowArrayDiff},
} = require('..');

module.exports = Class('Server').extend(EventEmitter, {
  'private response': null,

  /**
   * Dao
   * @type {MongoServerDao}
   */
  'private dao': null,

  /**
   * Stores references to program objects
   * @type {Object}
   */
  'private programs': {},

  'private quoteFillHooks': [],

  /**
   * Logger to use
   * @type  {PriorityLog}
   */
  'private logger': null,

  /**
   * Default bucket data for various programs
   * @type {Object}
   */
  'private _defaultBuckets': {},

  /**
   * Encryption service client
   * @type {EncryptionService}
   */
  'private _encService': null,

  /**
   * Holds bucket ciphers for each program
   * @type {Object.<string,QuoteDataBucketCipher>}
   */
  'private _bucketCiphers': {},

  /**
   * Step and program cache
   *
   * @type {Store}
   */
  'private _cache': null,

  /**
   * Client-provided data processor
   * @type {DataProcessor}
   */
  'private _dataProcessor': null,

  /**
   * Initializes program
   * @type {ProgramInit}
   */
  'private _progInit': null,

  /**
   * Constructs a timestamp
   * @type {function}
   */
  'private _ts_ctor': null,

  /**
   * A feature flag object to evaluate whether flags are on or off
   * @type {FeatureFlag}
   */
  'private _feature_flag': null,

  /**
   * A function to call when the dapi returns
   * @type {function}
   */
  'private _postDapi': null,

  /**
   * Rater
   * @type {Rater}
   */
  'private _rater': null,

  /**
   *
   * @param {JsonResponse}      response       server Response
   * @param {ServerDao}         dao            server DAO
   * @param {Logger}            logger         log manager
   * @param {EncryptionService} encsvc         encryption service
   * @param {DataProcessor}     data_processor data processor
   * @param {ProgramInit}       init           program initializer
   * @param {function}          ts_ctor        timestamp constructor
   * @param {FeatureFlag}       feature_flag   a feature flag object
   */
  'public __construct': function (
    response,
    dao,
    logger,
    encsvc,
    data_processor,
    init,
    ts_ctor,
    feature_flag
  ) {
    if (!Class.isA(DataProcessor, data_processor)) {
      throw TypeError('Expected DataProcessor');
    }

    this.response = response;
    this.dao = dao;
    this.logger = logger;
    this._encService = encsvc;
    this._dataProcessor = data_processor;
    this._progInit = init;
    this._ts_ctor = ts_ctor;
    this._feature_flag = feature_flag;
  },

  'public init': function (cache, rater) {
    this._rater = rater;
    this._cache = cache;

    this._initDb();
    this.reload(rater);
  },

  'public reload': function (rater) {
    this._rater = rater;

    var _self = this;

    rater.init(
      // log
      function (msg) {
        _self.logger.log(_self.logger.PRIORITY_IMPORTANT, msg);
      },

      // error
      function (msg, stack) {
        stack = stack || '<no stack trace>';

        _self.logger.log(
          _self.logger.PRIORITY_ERROR,
          '%s\n-!%s',
          msg,
          stack.replace(/\n/g, '\n-!')
        );
      }
    );
  },

  /**
   * Shut down any active connections and close gracefully
   */
  'public close': function () {
    this._feature_flag.close();
  },

  /**
   * Initializes the database (attempt DAO connection)
   *
   * @return undefined
   */
  'private _initDb': function () {
    var server = this;

    // error listeners
    this.dao
      .on('connectError', function (err) {
        server.logger.log(
          server.logger.PRIORITY_ERROR,
          'Database connection failure: (%s) %s',
          err.errno || '-',
          err.message || ''
        );

        // attempt to reconnect every 5 seconds
        setTimeout(function () {
          server.logger.log(
            server.logger.PRIORITY_DB,
            '[Server] Attempting to reconnect to database...'
          );
          server.dao.connect();
        }, 5000);
      })
      .on('saveQuoteError', function (err, quote) {
        server.logger.log(
          server.logger.PRIORITY_ERROR,
          'Failed to save quote %d: %s',
          quote.getId(),
          err.message || ''
        );
      })
      .on('seqError', function (err) {
        server.logger.log(
          server.logger.PRIORITY_ERROR,
          'Sequence error: %s',
          err
        );
      })
      .on('seqInit', function (seq) {
        server.logger.log(
          server.logger.PRIORITY_DB,
          'Initialized default sequence: %s',
          seq
        );
      })
      .on('ready', function () {
        server.logger.log(
          server.logger.PRIORITY_DB,
          '[Server] Connected to database; DAO ready'
        );
      });

    server.logger.log(
      server.logger.PRIORITY_DB,
      '[Server] Connecting to database...'
    );

    this.dao.init();
  },

  sendResponse: function (request, quote, data, action) {
    request.end(this.response.from(quote, data, action));
    return this;
  },

  sendError: function (request, message, action, btn_caption) {
    request.end(this.response.error(message, action, btn_caption));
    return this;
  },

  /**
   * Initializes a quote with any existing quote data
   *
   * @param Integer           quote_id  id of the quote
   * @param Program           program   program that the quote will be a part of
   * @param Object            request   request to create quote
   * @param Function( quote ) callback  function to call when quote is ready
   * @param Function( quote ) callback  function to call when an error occurs
   *
   * @return Server self to allow for method chaining
   */
  initQuote: function (quote, program, request, callback, error_callback) {
    var server = this,
      quote_id = quote.getId(),
      session = request.getSession(),
      agent_id = session.agentId(),
      username = session.userName(),
      agent_name = session.agentName();

    // get the data for this quote
    this.dao.pullQuote(quote_id, function (quote_data) {
      var new_quote = false;
      if (!quote_data) {
        quote_data = {};
        new_quote = true;

        // ensure it's a valid quote id
        server.dao.getMinQuoteId(function (min_id) {
          // don't allow before the min quote id
          if (quote_id < min_id) {
            error_callback.call(server);
            return;
          }

          server.dao.getMaxQuoteId(function (max_id) {
            if (quote_id > max_id) {
              // we has a problem
              error_callback.call(server);
              return;
            }

            // we're good
            server
              ._getDefaultBucket(program, quote_data)
              .then(default_bucket => {
                program.processNaFields(default_bucket);
                init_finish(program, default_bucket);
              });
          });
        });
      } else {
        // quote is not new; just continue
        server.getProgram(quote_data.programId).then(function (quote_program) {
          server
            ._getDefaultBucket(quote_program, quote_data)
            .then(default_bucket => init_finish(quote_program, default_bucket));
        });
      }

      function init_finish(quote_program, default_bucket) {
        // fill in the quote data (with reasonable defaults if the quote
        // does not yet exist); IMPORTANT: do not set pver to the
        // current version here; the quote will be repaired if it is not
        // set
        quote
          .setData(default_bucket)
          .setMetadata(quote_data.meta || {})
          .setUserName(username)
          .setAgentId(quote_data.agentId || agent_id)
          .setAgentName(quote_data.agentName || agent_name)
          .setAgentEntityId(quote_data.agentEntityId || '')
          .setInitialRatedDate(quote_data.initialRatedDate || 0)
          .setStartDate(quote_data.startDate || server._ts_ctor())
          .setImported(quote_data.importedInd || false)
          .setBound(quote_data.boundInd || false)
          .needsImport(quote_data.importDirty || false)
          .setCurrentStepId(
            Math.max(
              quote_data.currentStepId || 0,
              quote_program.getFirstStepId()
            )
          )
          .setTopVisitedStepId(
            quote_data.topVisitedStepId || quote_program.getFirstStepId()
          )
          // it is important that we set this to top visited to
          // ensure that (a) they cannot init a quote and skip the
          // first step and (b) that older quotes without this field
          // are properly initialized
          .setTopSavedStepId(
            quote_data.topSavedStepId || quote.getTopVisitedStepId() - 1
          )
          .setProgram(quote_program)
          .setProgramVersion(quote_data.pver || '')
          .setExplicitLock(
            quote_data.explicitLock || '',
            quote_data.explicitLockStepId || 0
          )
          .setError(quote_data.error || '')
          .setCreditScoreRef(quote_data.creditScoreRef || 0)
          .setLastPremiumDate(quote_data.lastPremDate || 0)
          .setRatedDate(quote_data.initialRatedDate || 0)
          .setRatingData(quote_data.ratedata || {})
          .setRetryAttempts(quote_data.retryAttempts || 0)
          .on('stepChange', function (step_id) {
            // save the quote state (we don't care if it succeeds or
            // fails because (a) failures will be automatically
            // logged and (b) we may not be dealing with a request,
            // so we may not be able to send a response to the
            // client)
            server.dao.saveQuoteState(quote);
          });

        // if no data was returned, then the quote doesn't exist in the
        // database
        if (new_quote) {
          // initialize it
          server.dao.saveQuote(quote, null, null, {
            agentId: agent_id,
            agentName: agent_name,
            agentEntityId: session.agentEntityId(),
            startDate: quote.getStartDate(),
            programId: quote.getProgramId(),
            initialRatedDate: 0,
            importedInd: quote.isImported() ? 1 : 0,
            boundInd: quote.isBound() ? 1 : 0,
            importDirty: 0,
            syncInd: 0,
            notifyInd: 0,
            syncDate: 0,
            lastPremDate: 0,
            internal: session.isInternal() ? 1 : 0,
            pver: program.version,

            explicitLock: quote.getExplicitLockReason(),
            explicitLockStepId: quote.getExplicitLockStep(),
          });

          server.dao.saveQuoteMeta(quote);
        }

        callback.call(server);
      }
    });

    return this;
  },

  'private _checkQuotePver': function (quote, program, callback) {
    // note that if program.version is not set, then something is likely
    // wrong with the build that generates it: always clean in this case to
    // be safe
    if (program.version && quote.getProgramVersion() === program.version) {
      callback(false, false);
      return;
    }

    var _self = this;

    this.logger.log(
      this.logger.PRIORITY_INFO,
      'Quote %s program version change (%s -> %s); will be scanned.',
      quote.getId(),
      quote.getProgramVersion(),
      program.version
    );

    // TODO: thread
    // service any other requests first, and then proceed to cleaning
    process.nextTick(function () {
      var nwait = 0,
        msg = [],
        handled = false;

      // by default, clear is undefined; event handlers should call the
      // appropriate function to state whether the quote has been properly
      // upgraded; if no handlers indicate success, or if any indiciate
      // failure, then disallow servicing the quote
      var clear = undefined,
        event = {
          good: function () {
            // if undefined, then we're good, otherwise keep the
            // existing value (we cannot override bad)
            clear = clear === undefined ? true : clear;
          },

          bad: function (s) {
            // bad trumps all
            clear = false;
            msg.push(s);
          },

          wait: function () {
            nwait++;
            return c;
          },
        };

      // trigger the event and let someone (hopefully) take care of this
      try {
        _self.emit('quotePverUpdate', quote, program, event);
      } catch (e) {
        // ruh roh...
        event.bad(e.message);
        nwait = 0;

        // this is an unhandled exception, as far as we're concerned;
        // re-throw so that we have a stack trace, but do so after we're
        // done processing
        process.nextTick(function () {
          throw e;
        });
      }

      function c() {
        // do nothing until we're done waiting
        if (--nwait > 0) {
          return;
        }

        if (clear === true) {
          // clear for version update
          quote.setProgramVersion(program.version);
        } else {
          // default message
          if (msg.length === 0) {
            msg.push('' + clear);
          }

          // see comments for clear var above
          _self.logger.log(
            _self.logger.PRIORITY_ERROR,
            'Quote %s scan failed (' + msg.join('; ') + ')',
            quote.getId()
          );
        }

        if (!handled) {
          handled = true;
          callback(!clear, true);
        }
      }

      // if nothing has requested that we wait, then continue immediately
      if (!handled && nwait === 0) {
        handled = true;
        c();
      }
    });
  },

  /**
   * Generates default bucket data for the given program
   *
   * @return {Object} default bucket data
   */
  'private _getDefaultBucket': function (program, quote_data) {
    // TOOD: this duplicates some logic with ProgramQuoteCleaner; we
    // probably do not need both of them
    return this._progInit.init(program, quote_data.data);
  },

  /**
   * Sends a new quote initialization request to the client
   *
   * @param {HttpServerRequest} request
   * @param {Function}          quote_new function to create new quote
   *
   * @return {Server} self
   */
  sendNewQuote: function (request, quote_new) {
    var server = this,
      session = request.getSession();

    function donew(quote_id) {
      var quote = quote_new(quote_id);
      server.sendResponse(request, quote, {valid: false});
    }

    // get the next available quote id
    this.dao.getNextQuoteId(donew);

    return this;
  },

  sendInit: function (request, quote, program, quote_new, prev) {
    var _self = this,
      args = arguments;

    this._checkQuotePver(quote, program, function (err, mod) {
      if (err) {
        // return as fatal
        _self.sendError(request, 'Quote sanitization failed');
        return;
      }

      // save the quote updates (but only if it was modified)
      if (mod) {
        var error_cb = function () {
          _self.sendError(request, 'Quote sanitization failed to commit');
        };

        _self.dao.saveQuote(
          quote,
          function () {
            _self.dao.saveQuoteMeta(
              quote,
              undefined,
              function () {
                _self._processInit.apply(_self, args);
              },
              error_cb
            );
          },
          error_cb
        );
      } else {
        _self._processInit.apply(_self, args);
      }
    });

    return this;
  },

  /**
   * Sends /init response
   *
   * @param UserRequest request
   * @param Quote       quote
   * @param {Program}   program
   * @param {Function}  quote_new  function to create new quote
   *
   * @return Server self to allow for method chaining
   *
   * @todo generate quote # rather than prompting
   */
  _processInit: function (request, quote, program, quote_new, prev) {
    var actions = null,
      valid = true,
      program_id = program.getId(),
      session = request.getSession(),
      internal = session.isInternal();

    // if no quote id was given, simply prompt for one for now
    if (quote.getId() == 0) {
      this.sendNewQuote(request, quote_new);
      return this;
    } else if (quote.getProgramId() !== program_id) {
      // invalid program; change the program id
      actions = [
        {
          action: 'setProgram',
          id: quote.getProgramId(),
          quoteId: quote.getId(),
        },
      ];

      valid = false;
    } else if (quote.hasError()) {
      this.sendError(request, quote.getError());
      return this;
    }
    // ensure that the agent id matches the quote's agent (unless internal)
    else if (
      internal === false &&
      request.getSession().agentId() != quote.getAgentId()
    ) {
      // todo: generate a new quote #
      actions = [{action: 'quotePrompt'}];
      valid = false;
    }

    // don't return any quote data if invalid - we don't want people spying
    // on the data!
    if (valid === false) {
      this.sendResponse(
        request,
        quote,
        {
          valid: false,
        },
        actions
      );

      return this;
    }

    var data = quote.getBucket().getData() || {};

    // if we're not internal, filter out the internal questions from the
    // data array to ensure that they can't spy on our internal data
    if (request.getSession().isInternal() === false) {
      for (var id in program.internal) {
        delete data[id];
      }
    }

    // Expire quote as needed
    if (quote.hasExpired(this._ts_ctor())) {
      quote.setExplicitLock(
        'This quote has expired and cannot be modified. ' +
          'Please contact support with any questions.'
      );
    }

    var bucket = quote.getBucket(),
      lock = quote.getExplicitLockReason(),
      lock_step = quote.getExplicitLockStep(),
      _self = this;

    if (valid && !lock && prev) {
      actions = [
        {
          action: 'warning',
          message:
            'Somebody else is currently viewing this quote; it ' +
            'has been locked and will be read-only until the ' +
            'other person is finished. Please try again later.' +
            (internal
              ? '<br /><br />N.B.: You are an internal user, so you ' +
                'may unlock the quote above, but be warned that ' +
                'concurrent writes may have negative affects on ' +
                'the integrity of the quote.' +
                '<br /><br />' +
                'Currently viewing: ' +
                prev
              : ''),
        },
      ];

      lock = 'Quote is locked due to concurrent access.';
    }

    this._feature_flag
      .isEnabled('liza_autosave', {user: program.id})
      .then(autosave_flag => {
        // decrypt bucket contents, if necessary, and return
        this._getBucketCipher(program).decrypt(bucket, function () {
          _self.sendResponse(
            request,
            quote,
            {
              valid: valid,
              data: bucket.getData() || {},

              meta: internal ? quote.getMetabucket().getData() : {},

              programId: program_id,

              currentStepId: quote.getCurrentStepId(),
              topVisitedStepId: quote.getTopVisitedStepId(),
              imported: quote.isImported(),
              bound: quote.isBound(),
              needsImport: quote.needsImport(),
              explicitLock: lock,
              explicitLockStepId: lock_step,
              agentId: quote.getAgentId(),
              agentName: quote.getAgentName(),
              agentEntityId: internal ? quote.getAgentEntityId() : 0,
              startDate: quote.getStartDate(),
              initialRatedDate: quote.getInitialRatedDate(),
              lastPremDate: quote.getLastPremiumDate(),
              autosave: autosave_flag,

              // set to undefined if not internal so it's not included in the
              // JSON response
              internal:
                request.getSession().isInternal() === true ? true : undefined,
            },
            actions
          );
        });
      });

    return this;
  },

  /**
   * Sends a step to the client
   *
   * @param UserRequest request
   * @param Quote       quote
   * @param Integer     program
   * @param Integer     step_id id of the step
   *
   * @return void
   */
  sendStep: function (request, quote, program, step_id, session) {
    var cur_id = quote.getCurrentStepId(),
      saved_id = quote.getTopSavedStepId(),
      program_id = program.id;

    if (program.steps[step_id] === undefined) {
      this.sendError(
        request,
        'Invalid step request; step ' + step_id + ' does not exist.',
        [{action: 'gostep', id: cur_id}]
      );

      return;
    }

    var type = program.steps[step_id].type;

    // is this a management step? if so, we must be internal
    if (type === 'manage' && !session.isInternal()) {
      // we're not internal, so let's send them back to the first step
      this.sendResponse(request, quote, {}, [
        {action: 'gostep', id: program.getFirstStepId()},
      ]);

      return;
    }

    let top_allowed_step = program.getNextVisibleStep(
      program.classify(quote.getBucket().getData()),
      quote.getTopVisitedStepId()
    );

    if (!top_allowed_step) {
      top_allowed_step = quote.getTopVisitedStepId() + 1;
    }

    // are they permitted to navigate to this step?
    if (top_allowed_step && step_id > top_allowed_step) {
      // knock them back to the next step they're able to save
      var tostep_id = quote.getTopSavedStepId() + 1;

      this.logger.log(
        this.logger.PRIORITY_ERROR,
        'Quote ' +
          quote.getId() +
          ' has not yet reached step ' +
          step_id +
          '; forcing to step ' +
          tostep_id +
          '. Top allowed step is ' +
          top_allowed_step
      );

      this.sendError(
        request,
        'Failed to navigate to step: you have not yet reached ' +
          'the requested step.',
        [{action: 'gostep', id: tostep_id}]
      );

      return;
    }

    // perform forward-validations *on the current step* to ensure that they
    // cannot leave the quote and then return, requesting a future step (if
    // permitted), thereby evading client-side forward-validations
    if (step_id > cur_id) {
      const validated = this._forwardValidate(quote, program, cur_id, session);

      if (!validated) {
        this.sendError(
          request,
          'The previous step contains errors; please correct them ' +
            'before continuing.',
          [{action: 'gostep', id: cur_id}]
        );
        return;
      }
    }

    var server = this;

    this._cache
      .get('step_html')
      .then(prog => prog.get(program_id))
      .then(shtml => shtml.get(step_id))
      .then(data => {
        // send the step HTML to the client
        server.sendResponse(request, quote, {
          html: data,
        });
      })
      .catch(err => {
        server.logger.log(
          server.logger.PRIORITY_ERROR,
          "Failed to load program '%s' step %d: %s",
          program_id,
          step_id,
          err.message
        );

        server.sendError(
          request,
          'The step you requested could not be loaded.'
        );

        throw err;
      });

    return this;
  },

  /**
   * Step HTML cache miss function
   *
   * Load step HTML from disk.  This is intended to be used as a
   * miss function.
   *
   * TODO: Extract method
   *
   * @param {string} program_id program containing step
   * @param {number} step_id    step to load
   *
   * @return {Promise}
   */
  'public loadStepHtml': function (program_id, step_id) {
    var step_filename =
      process.env.LV_ROOT_PATH +
      '/src/_gen/views/scripts/quote/' +
      program_id +
      '/steps/' +
      step_id +
      '.phtml';

    return new Promise(function (resolve, reject) {
      fs.readFile(step_filename, 'utf-8', function (err, data) {
        // we had a problem with the step
        if (err !== null) {
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  },

  /**
   * Perform forward-validations for a given quote and step
   *
   * This check is necessary to ensure that the client-side events are not
   * bypassed, which is realatively simple to do. For example, one could leave
   * the quote and return at a future step (so long as the operation is
   * otherwise permitted), preventing the `forward' event from triggering on
   * the client (as it is a relative event).
   *
   * @param {Quote}       quote   quote to forward-validate
   * @param {Program}     program program to validate against
   * @param {number}      step_id id of current step (before navigation)
   * @param {UserSession} session user session
   *
   * @return {boolean} validation success/failure
   */
  'private _forwardValidate': function (quote, program, step_id, session) {
    var success = false,
      _self = this;

    // TODO: we need cmatch data to pass to `forward'
    return true;

    quote.visitData(function (bucket) {
      try {
        // WARNING: must set immediately before running assertions,
        // ensuring that stack doesn't clear
        program.isInternal = session.isInternal();

        // forward event returns an object containing failures
        success = program.forward(step_id, bucket, {}) === null;
      } catch (e) {
        // this should never happen, but in case it does, we need to
        // make sure the user isn't left hanging with no response from
        // the server; return gracefully after logging the error
        _self.logger.log(
          _self.logger.PRIORITY_ERROR,
          'Forward-validation error (%s): WEB#%s, step %s',
          program.id,
          quote.getId(),
          step_id
        );
      }
    });

    // N.B.: defaults to false above
    return success;
  },

  visitStep: function (step_id, request, quote, program) {
    const classes = program.classify(quote.getBucket().getData());

    if (
      !program.isManageQuoteStep(step_id) &&
      !program.isStepVisible(classes, +step_id)
    ) {
      this.logger.log(
        this.logger.PRIORITY_INFO,
        'Attempt to visit not applicable step %s for quote: %s',
        step_id,
        quote.getId()
      );

      this.sendResponse(request, quote, {}, [
        {action: 'gostep', id: program.getFirstStepId()},
      ]);

      return this;
    }

    let top_allowed_step = program.getNextVisibleStep(
      classes,
      quote.getTopVisitedStepId()
    );

    if (!top_allowed_step) {
      top_allowed_step = quote.getTopVisitedStepId() + 1;
    }

    // update the quote step, if valid
    if (step_id <= top_allowed_step) {
      quote.setCurrentStepId(step_id);
      this.dao.saveQuoteState(quote, () =>
        this.sendResponse(request, quote, {})
      );
    } else {
      this.sendResponse(request, quote, {});
    }

    return this;
  },

  sendProgramJs: function (request, program_id) {
    var server = this;

    this._cache
      .get('program_js')
      .then(progjs => progjs.get(program_id))
      .then(data => {
        // send the JS to the client
        request.setContentType('text/javascript').end(data);
      })
      .catch(err => {
        server.logger.log(
          server.logger.PRIORITY_ERROR,
          "Failed to load program '%s' JS: %s",
          program_id,
          err
        );

        server.sendError(request, 'Unable to retrieve program data');

        throw err;
      });

    return this;
  },

  /**
   * Program JS cache miss function
   *
   * Loads program JS from disk.  This is intended to be used as a
   * miss function.
   *
   * TODO: Extract method
   *
   * @param {string} program_id program to load
   *
   * @return {Promise}
   */
  'public loadProgramFiles': function (program_id) {
    var root_path =
        process.env.LV_ROOT_PATH + '/src/_gen/scripts/program/' + program_id,
      js_filename = root_path + '/Program.js',
      inc_filename = root_path + '/include.js',
      retjs = '';

    return new Promise(function (resolve, reject) {
      // read both files
      fs.readFile(js_filename, 'utf8', function (err, data) {
        if (err !== null) {
          reject(err);
          return;
        }

        // wrap in closure
        data =
          '(function(require,module){' +
          'var exports=module.exports={};' +
          data +
          "\n})(require,modules['program/" +
          program_id +
          "/Program']={});";

        retjs = data;

        // read include file
        fs.readFile(inc_filename, 'utf8', function (err, data) {
          if (err === null) {
            retjs += data;
          }

          // we have all of our data; return the result
          resolve(retjs);
        });
      });
    });
  },

  /**
   * Handles a quote data post
   *
   * This function is called when an HTTP POST is made to save quote data.
   *
   * @param Integer     step_id  id of the step
   * @param UserRequest request  request object
   * @param Quote       quote    instance of quote to operate on
   * @param Program     program  program associated with the quote
   *
   * @param {UserSession} session  user session
   * @param {Boolean}     autosave identifies the POST as autosave
   *
   * @return undefined
   */
  handlePost: function (
    step_id,
    request,
    quote,
    program,
    session,
    autosave = false
  ) {
    var server = this;

    // do not allow quote modification if locked unless logged in as an
    // internal user (FS#5772) and the program is unlockable
    if (
      (quote.isLocked() || step_id < quote.getExplicitLockStep()) &&
      !(session.isInternal() && program.unlockable)
    ) {
      server.logger.log(
        server.logger.PRIORITY_INFO,
        'Cannot save imported quote: %s',
        quote.getId()
      );

      server.sendError(
        request,
        'This quote has been locked and can no longer be modified.'
      );

      return this;
    }

    let top_allowed_step = program.getNextVisibleStep(
      program.classify(quote.getBucket().getData()),
      quote.getTopSavedStepId()
    );

    if (!top_allowed_step) {
      top_allowed_step = quote.getTopSavedStepId() + 1;
    }

    // are they getting too far ahead of themselves?
    if (step_id > top_allowed_step && !autosave) {
      // knock back to next step that they're able to save
      var tostep_id = top_allowed_step;

      this.logger.log(
        this.logger.PRIORITY_ERROR,
        'Quote ' +
          quote.getId() +
          ' cannot yet save step ' +
          step_id +
          '; forcing to step ' +
          tostep_id
      );

      this.sendError(
        request,
        'Unable to save step: you have not yet reached ' +
          'the requested step.',
        [{action: 'gostep', id: tostep_id, title: 'Go Back'}]
      );

      // prohibit save
      return this;
    }

    request.getPostData(function (post_data) {
      // fill the quote with the posted data
      if (post_data.data) {
        try {
          var rdelta_data;
          var parsed_data = JSON.parse(post_data.data);
          var bucket = quote.getBucket();
          const concluding_save = post_data.concluding_save === 'true';

          const {
            filtered,
            dapis,
            meta_clear,
            rdiff,
          } = server._dataProcessor.processDiff(
            parsed_data,
            request,
            program,
            bucket,
            quote
          );

          // Leave rdelta_data undefined if rdiff is an empty object
          // but if there is a concluding save we still want to send
          // the delta
          if (concluding_save || Object.keys(rdiff).length > 0) {
            rdelta_data = {
              'rdelta.data': {
                data: rdiff,
                concluding_save: concluding_save,
                timestamp: server._ts_ctor(),
                step_id: step_id,
              },
            };
          }

          if (concluding_save) {
            quote.setImported(true);
          }

          server._monitorMetadataPromise(
            quote,
            dapis,
            meta_clear,
            request,
            program
          );
        } catch (err) {
          server.logger.log(
            server.logger.PRIORITY_ERROR,
            'Invalid POST data string (%s): %s',
            err,
            post_data.data
          );

          server.sendError(
            request,
            'There was an error saving your data. Please ' + 'try again.',
            [{action: 'gostep', id: step_id, title: 'Go Back'}]
          );

          return this;
        }
      }

      // save the quote
      server._doQuoteSave(
        step_id,
        request,
        quote,
        program,
        rdelta_data,
        autosave
      );
    });

    return this;
  },

  /**
   * Set a function to call when dapis return
   *
   * @param {function} postDapi a function which will return a promise
   *
   * @return {Server}
   */
  'public onDapiReturn': function (postDapi) {
    this._postDapi = postDapi;

    return this;
  },

  /**
   * Call the dapis and then perform post-call logic
   *
   * @param {ServerSideQuote} quote      - instance of quote to operate on
   * @param {array<Promise>}  dapis      - dapis to call
   * @param {Object}          meta_clear - old metadata to clear
   * @param {UserRequest}     request    - request object
   * @param {Program}         program    - program associated with the quote
   *
   * @return {undefined}
   */
  'private _monitorMetadataPromise'(
    quote,
    dapis,
    meta_clear,
    request,
    program
  ) {
    const save_data = {};

    // Format the data so that it is saved as an array. Dapis data with an
    // empty value for meta_clear should not be saved
    Object.keys(meta_clear).forEach(key => {
      const val = meta_clear[key];

      if (val && val.length > 0) {
        save_data['meta.' + key] = val;
      }
    });

    this.dao.mergeData(quote, save_data);

    dapis.map(promise =>
      promise
        .then(({field, index, data}) => {
          return new Promise((resolve, reject) => {
            this.dao.saveQuoteMeta(
              quote,
              data,
              saved_quote => resolve(quote),
              e => reject(e)
            );
          });
        })
        .then(quote => this._postDapi(quote.getId(), request, program))
        .catch(e => {
          if (Class.isA(NoPendingError, e)) {
            this.logger.log(
              this.logger.PRIORITY_INFO,
              'Did not rate on DAPI return (quote id %d): %s',
              quote.getId(),
              e.message
            );
          } else if (!Class.isA(MissingParamError, e)) {
            this.logger.log(
              this.logger.PRIORITY_ERROR,
              'Failed to save metadata (quote id %d): %s',
              quote.getId(),
              e.message
            );
          }
        })
    );
  },

  'private _doQuoteSave': function (
    step_id,
    request,
    quote,
    program,
    rdelta_data,
    autosave,
    c
  ) {
    var server = this;

    // whenever they save, we want to make sure we invalidate the premium,
    // unless this is a rating step or autosave
    if (!autosave && (program.rateSteps || [])[step_id] !== true) {
      const meta = {liza_timestamp_rate_request: [0]};

      quote.setLastPremiumDate(0);
      quote.setRetryAttempts(0);
      quote.setMetadata(meta);

      server.dao.saveQuoteMeta(quote, meta);
    }

    let save_data = undefined;

    // If this is a concluding save and we are going to import, clear any
    // rates that are currently pending
    if (rdelta_data && rdelta_data.concluding_save === true) {
      save_data = {};

      const quote_data = quote.getBucket().getData();

      Object.keys(quote_data).forEach(
        key => (save_data['data.' + key] = quote_data[key])
      );

      save_data['ratedata.__rate_pending'] = [0];
    }

    server.quoteFill(
      quote,
      step_id,
      request.getSession(),
      // success
      function () {
        // encrypt bucket
        var bucket = quote.getBucket();
        server._getBucketCipher(program).encrypt(bucket, function () {
          if (!autosave) {
            quote.setTopSavedStepId(step_id);
          }

          // set current and top visited steps
          quote.setCurrentStepId(step_id);
          quote.setTopVisitedStepId(step_id);
          server.dao.saveQuoteState(quote);

          // only reset published indicator on a step save
          const force_publish = !autosave;

          server.dao.saveQuote(
            quote,
            // quote was saved successfully
            function () {
              if (autosave) {
                server.sendResponse(request, quote, {}, {});
              } else {
                server._postSubmit(request, quote, step_id, program);
              }

              c && c(true);
            },
            // failed to save the quote
            function () {
              // todo: option to allow them to try again
              server.sendError(
                request,
                'There was a problem saving your quote. ' +
                  '<em>The previous step was not saved!</em>'
              );

              c && c(false);
            },
            save_data,
            rdelta_data,
            force_publish
          );
        });
      },
      // failure
      function (failures) {
        // todo: detailed logging (this shouldn't happen)
        server.logger.log(
          server.logger.PRIORITY_ERROR,
          'Server-side quote data validation failure for ' +
            'quote #%s, program %s, step %d:\n%s',
          quote.getId(),
          program.id,
          step_id,
          util.inspect(server._formatValidationFailures(failures))
        );

        server.sendError(
          request,
          'There was a problem with the data you entered. ' +
            'Please click "Go Back" below to go back to the ' +
            'previous step and correct the errors.',
          [
            {action: 'gostep', id: step_id},
            {action: 'invalidate', errors: failures},
          ],
          'Go Back'
        );

        c && c(false);
      },
      autosave
    );
  },

  /**
   * Format validation failures for encoded display
   *
   * That is, output data in a format that is useful for JSON-encoded display.
   *
   * @param {Object} failures failure array per key
   *
   * @return {Object} formatted object
   */
  'private _formatValidationFailures'(failures) {
    return Object.keys(failures).reduce((results, id) => {
      results[id] = failures[id].map(failure => failure.toString());
      return results;
    }, {});
  },

  'private _postSubmit': function (request, quote, step_id, program) {
    var server = this,
      bucket = null;

    // XXX
    quote.visitData(function (b) {
      bucket = b;
    });

    var result = program.postSubmit(step_id, bucket, (event, quote_id, value) =>
      server._handlePostSubmitEvent(
        request,
        quote,
        step_id,
        program,
        event,
        value
      )
    );

    // if there's no events, then just respond with a generic OK
    if (result === false) {
      server.sendResponse(request, quote);
    }
  },

  /**
   * Handle any post submit events and send response to client
   *
   * @param {Request} request - client request
   * @param {Quote}   quote   - current quote for request
   * @param {integer} step_id - id of submitted step
   * @param {Program} program - associated with the quote
   * @param {string}  event   - post submit event to handle
   * @param {string}  value   - (optional) value supplied for event
   *
   * @todo: remove from this class
   */
  _handlePostSubmitEvent: function (
    request,
    quote,
    step_id,
    program,
    event,
    value
  ) {
    var internal = request.getSession().isInternal(),
      actions = [],
      server = this;

    switch (event) {
      // kick back to the given step, if they're already past it
      case 'kickBack':
        var to_step_id = +value;

        if (quote.getTopVisitedStepId() > to_step_id) {
          // knock them back to the step if they're currently
          // further
          if (quote.getCurrentStepId() > to_step_id) {
            quote.setCurrentStepId(to_step_id);
            actions.push({
              action: 'gostep',
              id: to_step_id,
            });
          }
        }

        mergeAndFinish();
        break;

      // Handle this case only to avoid logging errors
      case 'rate':
        break;

      default:
        server.logger.log(
          server.logger.PRIORITY_ERROR,
          'Unknown postSubmit event: %s',
          event
        );

        finish();
        return;
    }

    function mergeAndFinish() {
      // clear any fields scheduled to be cleared on kickback
      var retdata = server._kbclear(program, quote);

      server.dao.mergeBucket(quote, retdata, function () {
        // if we're not internal, strip any potential
        // internal data from the response
        // XXX: maybe we should do this in
        // sendResponse() to ensure consistency
        if (internal === false) {
          for (id in program.internal) {
            delete retdata[id];
          }
        }

        // don't send the response until the bucket
        // is saved; we don't want a race condition
        // if they're speeding through steps!
        finish(retdata);
      });
    }

    function finish(data) {
      data = data || {};
      server.sendResponse(request, quote, data, actions);
    }
  },

  'private _kbclear': function (program, quote) {
    var set = {};

    const class_data = program.classify(quote.getBucket().getData());

    for (var field in program.kbclear) {
      const data = quote.getDataByName(field);

      for (const i in data) {
        val =
          program.clearNaFields && program.hasNaField(field, class_data, i)
            ? program.naFieldValue
            : program.defaults[field] || '';

        data[i] = val;
      }

      set[field] = data;
    }

    quote.setData(set);

    // return the fields that have changed
    return set;
  },

  quoteFill: function (data, step_id, session, success, failure, autosave) {
    if (data instanceof Function) {
      this.quoteFillHooks.push(data);
      return this;
    }

    var abort = false,
      failures = {};

    var event = {
      abort: function (failure_data) {
        failures = failure_data;
        abort = true;
      },
    };

    var len = this.quoteFillHooks.length;
    for (var i = 0; i < len; i++) {
      this.quoteFillHooks[i].call(event, data, step_id, session, autosave);

      // if we aborted, there's no need to continue
      if (abort) {
        break;
      }
    }

    // only call the callback if we did not abort
    if (abort) {
      failure.call(this, failures);
    } else {
      success.call(this);
    }

    return this;
  },

  /**
   * Lazily loads and returns the requested Program object
   *
   * @param String program_id id of the program to retrieve
   *
   * @return Server self to allow for method chaining
   */
  'public getProgram': function (program_id) {
    var _self = this;

    return this._cache
      .get('program')
      .then(pcache => pcache.get(program_id))
      .catch(function (e) {
        // looks like it doesn't exist
        _self.logger.log(
          _self.logger.PRIORITY_ERROR,
          "Program class '%s' could not be loaded: %s",
          program_id,
          e.message
        );

        throw e;
      });
  },

  /**
   * Program object cache miss function
   *
   * Instantiates program.  This is intended to be used as a miss
   * function.
   *
   * TODO: Extract method
   *
   * @param {string} program_id program to instantiate
   *
   * @return {Promise}
   */
  'public loadProgram': function (program_id) {
    var server = this;

    return new Promise(function (resolve, reject) {
      try {
        const program_path = 'program/' + program_id + '/Program';

        // node caches modules; make sure it's cleared
        delete require.cache[require.resolve(program_path)];

        // attempt to load the program class
        const program_module = require(program_path);
        const program = program_module();

        // hook ourselves
        server.quoteFill(function (quote, step_id, session, autosave) {
          var _self = this;

          // only perform quote validation if the quote is
          // using this program
          if (quote.getProgramId() !== program_id) {
            return;
          }

          // todo: unnecessary dependency
          var bucket_quote = quote.getBucket().getData(),
            bucket_tmp = QuoteDataBucket(),
            data_tmp = {};

          // this actually takes only 1ms, even with a reasonably
          // sized bucket (tested with snowmobile) - both the copy and
          // setValues()
          for (item in bucket_quote) {
            if (!Array.isArray(bucket_quote[item])) {
              // this is a problem (FS#5849)
              bucket_quote[item] = [];

              server.logger.log(
                server.logger.PRIORITY_ERROR,
                "Bucket item '%s' not an array for " +
                  'quote id %s in program %s; set to empty',

                item,
                quote.getId(),
                program_id
              );
            }

            data_tmp[item] = bucket_quote[item].slice(0);
          }

          bucket_tmp.setValues(data_tmp);

          // autosave does not need to perform assertions
          if (autosave) {
            return;
          }

          // Run all initialization stuff (e.g. calculated
          // values) on the bucket to prepare for
          // assertions. It's important to note that we
          // duplicate the bucket to ensure that none of the
          // calculated values are saved (the ones we want
          // to save are already in there).
          program.initQuote(bucket_tmp);

          var classdata = program.classify(bucket_tmp.getData());

          // XXX
          FieldClassMatcher(program.whens).match(classdata, function (cmatch) {
            // WARNING: must set immediately before running
            // assertions, ensuring that stack doesn't clear
            program.isInternal = session.isInternal();

            var failures = program.submit(step_id, bucket_tmp, cmatch);

            // if there's any failures, abort the operation
            if (failures !== null) {
              server.logger.log(
                server.logger.PRIORITY_ERROR,
                'Server-side validation failure'
              );
              _self.abort(failures);
            }
          });
        });

        resolve(program);
      } catch (e) {
        reject(e);
      }
    });
  },

  'private _getBucketCipher': function (program) {
    var _self = this;

    return (
      this._bucketCiphers[program.id] ||
      (function () {
        // create a new bucket cipher
        var c = (_self._bucketCiphers[program.id] = QuoteDataBucketCipher(
          _self._encService,
          program.secureFields.slice(0) || []
        ));

        c.on('encrecover', function (field, length) {
          _self.logger.log(
            _self.logger.PRIORITY_ERROR,
            'Invalid encrypted field data (%s of length %d); cleared.',
            field,
            length
          );
        });

        return c;
      })()
    );
  },

  'public createRevision': function (request, quote) {
    var _self = this;

    this.dao.createRevision(quote, function (err) {
      if (err) {
        _self.logger.log(
          _self.logger.PRIORITY_DB,
          '[mkrev] failed to create revision: ' + err
        );

        _self.sendError(request, 'Failed to create revision.');
        return;
      }

      _self.logger.log(
        _self.logger.PRIORITY_INFO,
        '[mkrev] created new revision for quote %s',
        quote.getId()
      );

      _self.sendEmptyReply(request, quote);
    });
  },

  // TODO: currently only diffs against current revision (that is, the live
  // bucket)
  'public diffRevisionGroup': function (request, program, quote, gid, revid) {
    var _self = this,
      progid = quote.getProgramId();

    // this really should not happen...unless we delete a program, I suppose
    if (program === undefined) {
      this.sendError(request, "Quote program id '" + progid + "' unknown");

      return;
    }

    // get all fields linked to this group---not just the exclusive fields
    var gfields = program.groupFields[gid];
    if (gfields === undefined) {
      this.sendError(
        request,
        "Unknown group '" + gid + "' for program '" + progid + "'"
      );

      return;
    }

    // do we have leaders?
    var lead_data = request.getGetData().leaders;
    if (!lead_data) {
      this.sendError(
        request,
        "No leaders provided for group '" +
          gid +
          "'; available " +
          'fields are: ' +
          gfields.join(', ')
      );

      return;
    }

    var leaders = lead_data.split(',');
    this.dao.getRevision(quote, revid, function (revdata) {
      if (!revdata) {
        _self.sendError(
          request,
          'Revision ' + revid + ' not found for quote ' + quote.getId()
        );
        return;
      }

      var revbucket = QuoteDataBucket().setValues(revdata.data);

      // XXX: tightly coupled; temporary impl
      try {
        var desc = BucketSiblingDescriptor()
          .defineGroup(gid, gfields)
          .markGroupLeaders(gid, leaders);

        var diff = StdBucketDiff(ShallowArrayDiff(), function (
          context,
          changes
        ) {
          return GroupedBucketDiffResult(
            StdBucketDiffResult(context, changes),
            context
          );
        }).diff(
          GroupedBucketDiffContext(
            StdBucketDiffContext(quote.getBucket(), revbucket),
            desc,
            gid
          )
        );
      } catch (e) {
        _self.sendError(
          request,
          'An error occurred during processing: ' + e.message
        );
        throw e;
      }

      _self.sendResponse(request, quote, {
        map: diff.createIndexMap(),
        diff: diff.describeChangedValues(),
      });
    });
  },

  'public sendEmptyReply': function (request, quote) {
    this.sendResponse(request, quote, {});
  },
});
