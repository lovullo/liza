/**
 * Daemon class
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
 */

var AbstractClass = require('easejs').AbstractClass,
  liza = require('../..'),
  MemcachedClient = require('memcached');

/**
 * Facade handling core logic for the daemon
 *
 * TODO: Factor out unrelated logic
 */
module.exports = AbstractClass('Daemon', {
  /**
   * System configuration
   * @type {Store}
   */
  'private _conf': null,

  /**
   * Server to accept HTTP requests
   * @type {HttpServer}
   */
  'private _httpServer': null,

  /**
   * Path to access log
   * @var {string}
   */
  'private _accessLogPath': '',

  /**
   * Path to debug log
   * @var {string}
   */
  'private _debugLogPath': '',

  /**
   * Access logger
   * @type {AccessLog}
   */
  'private _accessLog': null,

  /**
   * Debug logger
   * @type {DebugLog}
   */
  'private _debugLog': null,

  /**
   * Encryption service
   * @type {EncryptionService}
   */
  'private _encService': null,

  /**
   * Memcache client
   * @type {Object}
   */
  'private _memcache': null,

  /**
   * Routers to use to handle user requests, ordered from most likely to be
   * used to least for performance reasons
   *
   * @type {Array.<Object>}
   */
  'private _routers': null,

  /**
   * Rating service
   * @type {Object}
   */
  'private _rater': null,

  'public __construct': function (conf) {
    this._conf = conf;
  },

  /**
   * Starts initializing the daemon
   *
   * @return {undefined}
   */
  'public start'() {
    return Promise.all([
      this._createDebugLog(),
      this._createAccessLog(),
      this._conf.get('skey'),
      this._conf.get('services.rating.postRatePublish'),
    ])
      .then(([debug_log, access_log, skey, post_rate]) => {
        this._debugLog = debug_log;
        this._accessLog = access_log;

        this._httpServer = this.getHttpServer();
        this._rater = liza.server.rater.ProcessManager();
        this._encService = this.getEncryptionService();
        this._memcache = this.getMemcacheClient();

        return post_rate
          .reduce((accum, value, key) => {
            accum[key] = value;
            return accum;
          }, {})
          .then(
            post_rate_publish =>
              (this._routers = this.getRouters(skey, post_rate_publish))
          );
      })
      .then(() => this._startDaemon());
  },

  'private _startDaemon'() {
    this._debugLog.log(
      this._debugLog.PRIORITY_IMPORTANT,
      'Access log path: %s',
      this._accessLogPath
    );

    this._debugLog.log(
      this._debugLog.PRIORITY_IMPORTANT,
      'Debug log path: %s',
      this._debugLogPath
    );

    this._initSignalHandlers();
    this._testEncryptionService(() => {
      this._initMemoryLogger();

      this._initRouters();
      this._initHttpServer(() => {
        this._initUncaughtExceptionHandler();

        // ready to roll
        this._debugLog.log(
          this._debugLog.PRIORITY_INFO,
          'Daemon initialization complete.'
        );
      });
    });
  },

  'protected getDebugLog': function () {
    return this._debugLog;
  },

  'protected getHttpServer': function () {
    return require('./http_server');
  },

  'protected getAccessLog': function () {
    return liza.server.log.AccessLog;
  },

  'protected getPriorityLog': function () {
    return liza.server.log.PriorityLog;
  },

  /**
   * Get (and initialize) controller
   *
   * The controller will only be initialized with the session key SKEY and
   * post-rate AMQP configuration if they are provided, respectively.
   *
   * @param {string=} skey              session key
   * @param {Object=} post_rate_publish configuration for post-rate messages
   *
   * @return {Object} controller
   */
  'protected getProgramController': function (skey, post_rate_publish) {
    var controller = require('./controller');

    controller.rater = this._rater;

    controller.post_rate_publish =
      post_rate_publish || controller.post_rate_publish;

    if (skey) {
      controller.skey = skey;
    }

    return controller;
  },

  'protected getScriptsController': function () {
    return require('./scripts');
  },

  'protected getClientErrorController': function () {
    return require('./clienterr');
  },

  'protected getUserRequest': function () {
    return liza.server.request.UserRequest;
  },

  'protected getUserSession': function () {
    return liza.server.request.UserSession;
  },

  'protected getMemcacheClient': function () {
    var memc_host = process.env.MEMCACHE_HOST || 'localhost',
      memc_port = process.env.MEMCACHE_PORT || 11211,
      memc = new MemcachedClient(memc_host + ':' + memc_port),
      _self = this;

    return memc
      .on('issue', function (details) {
        _self._debugLog.log(
          _self._debugLog.PRIORITY_IMPORTANT,
          'Memcached error: %s',
          details.messages.join(', ')
        );
      })
      .on('failure', function (details) {
        _self._debugLog.log(
          _self._debugLog.PRIORITY_ERROR,
          'Failed to connect to memcached: %s',
          details.messages.join(', ')
        );
      })
      .on('reconnecting', function (_details) {
        _self._debugLog.log(
          _self._debugLog.PRIORITY_IMPORTANT,
          'Attempting to reconnect to memcached server...'
        );
      })
      .on('reconnect', function (_details) {
        _self._debugLog.log(
          _self._debugLog.PRIORITY_IMPORTANT,
          'Reconnected to memcached server.'
        );
      });
  },

  'abstract protected getEncryptionService': [],

  'protected getRouters': function (skey, post_rate_publish) {
    return [
      this.getProgramController(skey, post_rate_publish),
      this.getScriptsController(),
      this.getClientErrorController(),
    ];
  },

  /**
   * Perform a graceful shutdown
   *
   * @param {string} signal the signal that caused the shutdown
   *
   * @return {undefined}
   */
  'protected shutdown': function (signal) {
    this._debugLog.log(
      this._debugLog.PRIORITY_IMPORTANT,
      'Received %s. Beginning graceful shutdown...',
      signal
    );

    this._debugLog.log(this._debugLog.PRIOIRTY_IMPORTANT, 'Closing routers...');
    this._routers.forEach(function (router) {
      if (router.close instanceof Function) {
        router.close();
      }
    });

    this._debugLog.log(
      this._debugLog.PRIOIRTY_IMPORTANT,
      'Closing HTTP server...'
    );
    this._httpServer.close();

    this._debugLog.log(
      this._debugLog.PRIORITY_IMPORTANT,
      'Shutdown complete. Exiting...'
    );

    process.exit();
  },

  'private _createAccessLog': function () {
    return this._conf.get('log.access.path').then(log_path => {
      this._accessLogPath = log_path;
      return this.getAccessLog()(this._accessLogPath);
    });
  },

  'private _createDebugLog': function () {
    return Promise.all([
      this._conf.get('log.priority'),
      this._conf.get('log.debug.path'),
    ]).then(([priority, debug_log_path]) => {
      this._debugLogPath = debug_log_path;

      return this.getPriorityLog()(debug_log_path, priority);
    });
  },

  /**
   * Catches and logs uncaught exceptions to prevent early termination
   *
   * @return {undefined}
   */
  'private _initUncaughtExceptionHandler': function () {
    var _self = this;

    // chances are, we don't want to crash; we are, after all, a webserver
    process.on('uncaughtException', function (err) {
      _self._debugLog.log(
        _self._debugLog.PRIORITY_ERROR,
        'Uncaught exception: %s\n%s',
        err,
        err.stack ? err.stack : '(No stack trace)'
      );

      // should we terminate on uncaught exceptions?
      if (process.env.NODEJS_UCE_TERM) {
        _self._debugLog.log(
          _self._debugLog.PRIORITY_ERROR,
          'NODEJS_UCE_TERM set; terminating...'
        );

        // SIGINT
        process.kill(process.pid);
      }
    });

    // notify the user of the UCE_TERM flag is set
    if (process.env.NODEJS_UCE_TERM) {
      this._debugLog.log(
        1,
        'NODEJS_UCE_TERM set; ' + 'will terminate on uncaught exceptions.'
      );
    }
  },

  'private _initSignalHandlers': function () {
    var _self = this;

    // graceful shutdown on SIGINT and SIGTERM (cannot catch SIGKILL)
    try {
      process
        .on('SIGHUP', function () {
          _self._debugLog.log(
            _self._debugLog.PRIORITY_IMPORTANT,
            'SIGHUP received; requesting reload'
          );

          _self.getProgramController().reload();
        })
        .on('SIGINT', function () {
          _self.shutdown('SIGINT');
        })
        .on('SIGTERM', function () {
          _self.shutdown('SIGTERM');
        });
    } catch (e) {
      console.log('note: signal handling unsupported on this OS');
    }
  },

  'private _testEncryptionService': function (callback) {
    var enc_test = 'test string',
      _self = this;

    this._debugLog.log(
      this._debugLog.PRIORITY_INFO,
      'Performing encryption service sanity check...'
    );

    // encryption sanity check to ensure we won't end up working with data
    // that will only become corrupt
    this._encService.encrypt(enc_test, function (data) {
      _self._encService.decrypt(data, function (data) {
        if (enc_test !== data.toString('ascii')) {
          _self._debugLog.log(
            _self._debugLog.PRIORITY_ERROR,
            'Encryption service is incompetant. Aborting.'
          );
          process.exit(1);
        }

        _self._debugLog.log(
          _self._debugLog.PRIORITY_INFO,
          'Encryption service sanity check passed.'
        );

        callback();
      });
    });
  },

  'private _initMemoryLogger': function () {
    var _self = this;

    // log memory usage (every 15 min)
    setInterval(function () {
      _self._debugLog.log(
        _self._debugLog.PRIORITY_IMPORTANT,
        'Memory usage: %s MB (rss), %s/%s MB (V8 heap)',
        (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
        (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
        (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2)
      );
    }, 900000);
  },

  'private _initRouters': function () {
    var _self = this;

    // initialize each router
    this._routers.forEach(function (router) {
      if (router.init instanceof Function) {
        router.init(
          _self._debugLog,
          _self._encService,
          _self._conf,
          process.env.NODE_ENV || 'local'
        );
      }
    });
  },

  'private _initHttpServer': function (callback) {
    var _self = this;

    /**
     * Builds UserRequest from the provided request and response objects
     *
     * @param {HttpServerRequest} request
     * @param {HttpServerResponse} response
     *
     * @return {UserRequest} instance to represent current request
     */
    function request_builder(request, response) {
      return _self.getUserRequest()(request, response, function (sess_id) {
        // build a new user session from the given session id
        return _self.getUserSession()(sess_id, _self._memcache);
      });
    }

    // create the HTTP server and listen for connections
    try {
      this._httpServer = this.getHttpServer().create(
        this._routers,
        request_builder,
        this._accessLog,
        this._debugLog
      );

      this._conf
        .get('http.port')
        .then(port =>
          this._httpServer.listen(port, () => {
            this._debugLog.log(1, 'Server running on port %d', port);

            callback();
          })
        )
        .catch(e => this._httpError(e));
    } catch (e) {
      this._httpError(e);
    }
  },

  'private _httpError'(e) {
    this._debugLog.log(
      this._debugLog.PRIORITY_ERROR,
      'Unable to start HTTP server: %s',
      err
    );

    // TODO: use daemon-level promise and reject it
    process.exit(1);
  },
});
