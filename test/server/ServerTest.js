/**
 * Tests Server
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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

'use strict';

const chai = require('chai');
const DataProcessor = require('../../src/server/request/DataProcessor')
  .DataProcessor;
const expect = chai.expect;
const sinon = require('sinon');
const Sut = require('../../src/server/Server');

describe('Server#sendStep', () => {
  [
    {
      label: 'Sends error when navigating to step that has not been reached',
      step_id: 6,
      first_step_id: 2,
      current_step_id: 3,
      next_visible_step_id: 5,
      visited_step_id: 4,
      saved_step_id: 3,
      internal: false,
      expected_failure: true,
      expected_action: [{action: 'gostep', id: 4}],
    },
    {
      label: 'Non-internal user cannot visit manage step',
      step_id: 1,
      first_step_id: 2,
      current_step_id: 2,
      next_visible_step_id: 3,
      visited_step_id: 2,
      saved_step_id: 2,
      internal: false,
      expected_failure: false,
      expected_action: [{action: 'gostep', id: 2}],
    },
    {
      label: 'Internal user can visit manage step',
      step_id: 1,
      first_step_id: 2,
      current_step_id: 2,
      next_visible_step_id: 3,
      visited_step_id: 2,
      saved_step_id: 2,
      internal: true,
      expected_failure: false,
      expected_action: undefined,
    },
    {
      label: 'Send step when navigating to a previous step',
      step_id: 2,
      first_step_id: 2,
      current_step_id: 3,
      next_visible_step_id: 4,
      visited_step_id: 4,
      saved_step_id: 3,
      internal: false,
      expected_failure: false,
      expected_action: undefined,
    },
    {
      label: 'Send step when navigating to the next valid step (top saved + 1)',
      step_id: 99,
      first_step_id: 2,
      current_step_id: 2,
      next_visible_step_id: 3,
      visited_step_id: 3,
      saved_step_id: 2,
      internal: false,
      expected_failure: true,
      expected_action: [{action: 'gostep', id: 2}],
    },
    {
      label:
        'Send step when navigating to the next visible step (top saved + 1) skip hidden steps',
      step_id: 5,
      first_step_id: 2,
      current_step_id: 3,
      next_visible_step_id: 5,
      visited_step_id: 3,
      saved_step_id: 3,
      internal: false,
      expected_failure: false,
      expected_action: undefined,
    },
  ].forEach(
    ({
      label,
      step_id,
      first_step_id,
      current_step_id,
      next_visible_step_id,
      visited_step_id,
      saved_step_id,
      internal,
      expected_failure,
      expected_action,
    }) => {
      it(label, done => {
        let response = createMockResponse();

        let error_is_sent = false;
        let response_is_sent = false;

        response.from = (_, __, action) => {
          response_is_sent = true;
          expect(expected_failure).to.be.false;
          expect(error_is_sent).to.be.false;
          expect(response_is_sent).to.equal(true);
          expect(action).to.deep.equal(expected_action);
          done();
        };
        response.error = (_, action, __) => {
          error_is_sent = true;
          expect(expected_failure).to.be.true;
          expect(error_is_sent).to.be.true;
          expect(action).to.deep.equal(expected_action);
          expect(response_is_sent).to.be.false;
          done();
        };

        const sut = getSut(response);
        sut.init(createMockCache(), createMockRater());
        let quote = createMockQuote(
          current_step_id,
          saved_step_id,
          visited_step_id
        );
        const program = createMockProgram(
          first_step_id,
          undefined,
          next_visible_step_id
        );
        const session = createMockSession(internal);
        const request = createMockRequest();

        sut.sendStep(request, quote, program, step_id, session);
      });
    }
  );
});

describe('Server#visitStep', () => {
  it('Valid step visit sets current step and sends response', done => {
    const step_to_visit = 3;
    const current_step = 2;
    const top_saved_step = 5;
    const top_visited_step = 5;
    let error_is_sent = false;

    const quote = createMockQuote(
      current_step,
      top_saved_step,
      top_visited_step
    );
    const program = createMockProgram();
    const session = createMockSession();
    const request = createMockRequest(session);
    const response = createMockResponse();
    const sut = getSut(response);

    // check that a response is sent to user w/no actions (do not kick back)
    response.from = (_, __, action) => {
      expect(error_is_sent).to.be.false;
      expect(action).to.deep.equal(undefined);
      expect(given_cur_step_id).to.be.equal(step_to_visit);
      done();
    };

    program.isStepVisible = () => true;

    let given_cur_step_id = undefined;
    quote.setCurrentStepId = step_id => {
      given_cur_step_id = step_id;
    };

    response.error = (_, action, __) => {
      error_is_sent = true;
    };

    sut.visitStep(step_to_visit, request, quote, program);
  });

  it('Invisible step kicks user back to first step', done => {
    const step_to_visit = 3;
    const current_step = 2;
    const top_saved_step = 5;
    const top_visited_step = 5;
    const first_step_id = 1;
    let error_is_sent = false;

    const quote = createMockQuote(
      current_step,
      top_saved_step,
      top_visited_step
    );
    const program = createMockProgram(first_step_id);
    const session = createMockSession();
    const request = createMockRequest(session);
    const response = createMockResponse();
    const logger = createMockLogger();
    const sut = getSut(response, undefined, undefined, logger);

    // make this step invisible
    program.isStepVisible = () => false;

    let log_is_called = false;
    logger.log = (level, message, step_id, __) => {
      log_is_called = true;
      expect(level).to.be.equal(logger.PRIORITY_INFO);
      expect(step_id).to.be.equal(step_to_visit);
      expect(message).to.contain('not applicable step');
      expect(log_is_called).to.be.true;
    };

    // check that a response is sent to user w/kickback action
    response.from = (_, __, action) => {
      expect(error_is_sent).to.be.false;
      expect(log_is_called).to.be.true;
      expect(action).to.deep.equal([{action: 'gostep', id: first_step_id}]);
      done();
    };

    response.error = (_, action, __) => {
      error_is_sent = true;
    };

    sut.visitStep(step_to_visit, request, quote, program);
  });
});

describe('Server#handlePost', () => {
  it('Prevents step save when not next immediate step', done => {
    // attempt to post on a step 2 steps ahead - not ok!
    const step_to_post = 4;
    const current_step = 2;
    const next_visible_step_id = 3;
    const top_saved_step = 2;
    const top_visited_step = 2;
    const expected_kick_back = 3;

    const quote = createMockQuote(
      current_step,
      top_saved_step,
      top_visited_step
    );
    const program = createMockProgram(1, undefined, next_visible_step_id);
    const session = createMockSession();
    const request = createMockRequest(session);
    const response = createMockResponse();
    const autosave = false;
    const sut = getSut(response);

    let get_post_data_called = false;
    request.getPostData = () => {
      get_post_data_called = true;
    };

    const expected_error_action = [
      {action: 'gostep', id: expected_kick_back, title: 'Go Back'},
    ];
    response.error = (message, action, __) => {
      expect(get_post_data_called).to.be.false;
      expect(action).to.deep.equal(expected_error_action);
      expect(message).to.contain(
        'Unable to save step: you have not yet reached'
      );
      done();
    };

    sut.handlePost(step_to_post, request, quote, program, session, autosave);
  });

  [
    {
      label: 'Allows autosave when not next immediate step',
      autosave: true,
      step_to_post: 4,
      next_visible_step_id: 5,
      current_step: 2,
      top_saved_step: 2,
      top_visited_step: 2,
    },
    {
      label: 'Allows save when next immediate step',
      autosave: false,
      step_to_post: 4,
      next_visible_step_id: 4,
      current_step: 3,
      top_saved_step: 3,
      top_visited_step: 3,
    },
    {
      label: 'Allows save when next immediate step is hidden',
      autosave: false,
      step_to_post: 5,
      next_visible_step_id: 5,
      current_step: 3,
      top_saved_step: 3,
      top_visited_step: 3,
    },
  ].forEach(
    ({
      label,
      autosave,
      step_to_post,
      next_visible_step_id,
      current_step,
      top_saved_step,
      top_visited_step,
    }) => {
      it(label, done => {
        const quote = createMockQuote(
          current_step,
          top_saved_step,
          top_visited_step
        );
        const program = createMockProgram(1, undefined, next_visible_step_id);
        const session = createMockSession();
        const request = createMockRequest(session);
        const response = createMockResponse();
        const sut = getSut(response);

        let error_is_sent = false;
        response.error = (message, action, __) => {
          error_is_sent = true;
          // no errors are expected
          expect(message).to.be.equal(undefined);
          done();
        };

        // TODO: assert on actual saves which requires a lot more mocking
        //  (BucketCipher is directly instantiated in Sut)
        let get_post_data_called = false;
        request.getPostData = () => {
          expect(error_is_sent).to.be.false;
          done();
        };

        sut.handlePost(
          step_to_post,
          request,
          quote,
          program,
          session,
          autosave
        );
        expect(get_post_data_called).to.be.true;
      });
    }
  );
});

describe('Server#initQuote', () => {
  it('Gets existing quote data from db then sets defaults', done => {
    let response = createMockResponse();
    let dao = createMockDao();

    const expected_quote_id = 12345;
    const quote_data = {key1: 'value1', key2: 'value2'};
    let pull_quote_is_called = false;

    // make sure quote data is retrieved for our quote
    dao.pullQuote = (quote_id, callback) => {
      expect(quote_id).to.be.equal(expected_quote_id);
      pull_quote_is_called = true;
      callback(quote_data);
    };

    const default_bucket_data = {default: 'value'};
    let prog_init = createMockProgramInit();
    prog_init.init = (program, data) => {
      return Promise.resolve(default_bucket_data);
    };

    const agent_id = '11111';
    const username = 'foo@bar';
    const agent_name = 'Some Agency';
    const entity_id = '9988776';
    const session = createMockSession(
      true,
      agent_id,
      username,
      agent_name,
      entity_id
    );

    let quote = createMockQuote(0, 0, 0, expected_quote_id);
    let set_data_is_called = false;
    quote.setData = given_default_bucket => {
      set_data_is_called = true;
      expect(given_default_bucket).to.deep.equal(default_bucket_data);
      return quote;
    };

    quote.setMetadata = () => quote;

    // make sure the session username is set on the quote
    let set_username_is_called = false;
    quote.setUserName = given_user_name => {
      set_username_is_called = true;
      expect(given_user_name).to.be.equal(username);
      return quote;
    };

    quote.setAgentId = () => quote;
    quote.setAgentName = () => quote;
    quote.setAgentEntityId = () => quote;
    quote.setInitialRatedDate = () => quote;
    quote.setStartDate = () => quote;
    quote.setImported = () => quote;
    quote.setBound = () => quote;
    quote.needsImport = () => quote;

    // will not set a current step that is less than the first step
    const first_step = 2;
    let program = createMockProgram(first_step);

    let pcache = createMockCache();
    pcache.get = key => {
      return Promise.resolve(program);
    };
    let cache = createMockCache(pcache);

    quote.setCurrentStepId = given_current_step => {
      expect(given_current_step).to.be.equal(first_step);
      return quote;
    };

    quote.setTopVisitedStepId = () => quote;
    quote.setTopSavedStepId = () => quote;
    quote.setProgram = () => quote;
    quote.setProgramVersion = () => quote;
    quote.setExplicitLock = () => quote;
    quote.setError = () => quote;
    quote.setCreditScoreRef = () => quote;
    quote.setLastPremiumDate = () => quote;
    quote.setRatedDate = () => quote;
    quote.setRatingData = () => quote;
    quote.setRetryAttempts = () => quote;
    quote.on = () => quote;

    const sut = getSut(response, dao, prog_init);
    sut.init(cache, createMockRater());

    const request = createMockRequest(session);

    const callback = () => {
      expect(pull_quote_is_called).to.be.true;
      expect(set_data_is_called).to.be.true;
      expect(set_username_is_called).to.be.true;
      done();
    };

    sut.initQuote(quote, program, request, callback);
  });

  it('Defaults data on new quote and saves quote meta', function (done) {
    this.timeout(0);
    let response = createMockResponse();
    let dao = createMockDao();

    const expected_quote_id = 12345;
    let pull_quote_is_called = false;

    // return no quote data (new quote)
    dao.pullQuote = (quote_id, callback) => {
      expect(quote_id).to.be.equal(expected_quote_id);
      pull_quote_is_called = true;
      callback(undefined);
    };

    const default_bucket_data = {default: 'value'};
    let prog_init = createMockProgramInit();
    prog_init.init = (program, data) => {
      return Promise.resolve(default_bucket_data);
    };

    const agent_id = '11111';
    const username = 'foo@bar';
    const agent_name = 'Some Agency';
    const entity_id = '9988776';
    const start_date = 12341234;
    const program_id = 'foo';
    const program_ver = 'foover';
    const session = createMockSession(
      true,
      agent_id,
      username,
      agent_name,
      entity_id
    );

    let quote = createMockQuote(
      0,
      0,
      0,
      expected_quote_id,
      program_id,
      program_ver
    );

    let set_data_is_called = false;
    quote.setData = given_default_bucket => {
      set_data_is_called = true;
      expect(given_default_bucket).to.deep.equal(default_bucket_data);
      return quote;
    };

    quote.getStartDate = () => start_date;
    let program = createMockProgram(1, program_ver);
    let save_quote_is_called = false;
    dao.saveQuote = (quote, success, failure, save_data) => {
      save_quote_is_called = true;
      const expected_data = {
        agentId: agent_id,
        agentName: agent_name,
        agentEntityId: entity_id,
        startDate: quote.getStartDate(),
        programId: program_id,
        initialRatedDate: 0,
        importedInd: 0,
        boundInd: 0,
        importDirty: 0,
        syncInd: 0,
        notifyInd: 0,
        syncDate: 0,
        lastPremDate: 0,
        internal: 1,
        pver: program_ver,
        explicitLock: '',
        explicitLockStepId: 0,
      };
      expect(save_data).to.deep.equal(expected_data);
    };

    let set_meta_data_calls = 0;
    let set_meta_data = [];
    quote.setMetadata = meta_data => {
      set_meta_data_calls++;
      set_meta_data.push(meta_data);
      return quote;
    };

    let save_quote_meta_is_called = false;
    dao.saveQuoteMeta = given_quote => {
      save_quote_meta_is_called = true;
      expect(given_quote).to.be.equal(quote);
    };

    quote.setUserName = () => quote;
    quote.setAgentId = () => quote;
    quote.setAgentName = () => quote;
    quote.setAgentEntityId = () => quote;
    quote.setInitialRatedDate = () => quote;
    quote.setStartDate = () => quote;
    quote.setImported = () => quote;
    quote.setBound = () => quote;
    quote.needsImport = () => quote;
    quote.setCurrentStepId = () => quote;
    quote.setTopVisitedStepId = () => quote;
    quote.setTopSavedStepId = () => quote;
    quote.setProgram = () => quote;
    quote.setProgramVersion = () => quote;
    quote.setExplicitLock = () => quote;
    quote.setError = () => quote;
    quote.setCreditScoreRef = () => quote;
    quote.setLastPremiumDate = () => quote;
    quote.setRatedDate = () => quote;
    quote.setRatingData = () => quote;
    quote.setRetryAttempts = () => quote;
    quote.on = () => quote;

    const sut = getSut(response, dao, prog_init);
    sut.init(createMockCache(), createMockRater());

    const request = createMockRequest(session);

    const callback = () => {
      expect(pull_quote_is_called).to.be.true;
      expect(set_data_is_called).to.be.true;
      expect(save_quote_is_called).to.be.true;

      // set meta occurs twice on new quote
      expect(set_meta_data_calls).to.be.equal(1);
      expect(set_meta_data[0]).to.deep.equal({});
      expect(save_quote_meta_is_called).to.be.true;
      done();
    };

    sut.initQuote(quote, program, request, callback);
  });
});

function getSut(response, dao, prog_init, logger) {
  return new Sut(
    response,
    dao || createMockDao(),
    logger || createMockLogger(),
    {},
    createMockDataProcessor(),
    prog_init || createMockProgramInit(),
    () => {},
    {}
  );
}

function createMockQuote(
  current_step_id,
  saved_step_id,
  visited_step_id,
  quote_id,
  program_id
) {
  return {
    setData: () => {},
    setMetadata: () => {},
    setUserName: () => {},
    setAgentId: () => {},
    setAgentName: () => {},
    setAgentEntityId: () => {},
    setInitialRatedDate: () => {},
    setStartDate: () => {},
    setImported: () => {},
    setBound: () => {},
    needsImport: () => {},
    setCurrentStepId: () => {},
    setTopVisitedStepId: () => {},
    setTopSavedStepId: () => {},
    setProgram: () => {},
    setProgramVersion: () => {},
    setExplicitLock: () => {},
    setError: () => {},
    setCreditScoreRef: () => {},
    setLastPremiumDate: () => {},
    setRatedDate: () => {},
    setRatingData: () => {},
    setRetryAttempts: () => {},
    on: () => {},
    getExplicitLockReason: () => '',
    getExplicitLockStep: () => 0,
    getCurrentStepId: () => current_step_id || 0,
    getTopSavedStepId: () => saved_step_id || 0,
    getTopVisitedStepId: () => visited_step_id || 0,
    refreshData: () => {},
    isLocked: () => false,
    getId: () => quote_id || '111111',
    getStartDate: () => '',
    getProgramId: () => program_id || '',
    isImported: () => false,
    isBound: () => false,
    getBucket: () => {
      return {getData: () => {}};
    },
  };
}

function createMockLogger() {
  return {
    PRIORITY_ERROR: 0,
    PRIORITY_IMPORTANT: 1,
    PRIORITY_DB: 2,
    PRIORITY_INFO: 3,
    PRIORITY_SOCKET: 4,
    debug(msg, object) {},
    info(msg, object) {},
    notice(msg, object) {},
    warning(msg, object) {},
    error(msg, object) {},
    critical(msg, object) {},
    alert(msg, object) {},
    emergency(msg, object) {},
    log(level, msg, object) {},
  };
}

function createMockRequest(session) {
  return {
    end: () => {},
    getSession: () => session,
    getPostData: () => {},
  };
}

function createMockResponse() {
  return {
    error: () => {},
    from: () => {},
  };
}

function createMockSession(
  internal,
  agent_id,
  username,
  agent_name,
  entity_id
) {
  return {
    isInternal: () => internal,
    agentId: () => agent_id || '',
    userName: () => username || '',
    agentName: () => agent_name || '',
    agentEntityId: () => entity_id || '',
  };
}

function createMockDataProcessor() {
  return sinon.createStubInstance(DataProcessor);
}

function createMockProgram(first_step_id, program_ver, next_step) {
  return {
    id: () => 'foo',
    version: program_ver || '',
    getFirstStepId: () => first_step_id,
    isStepVisible: () => false,
    steps: [
      ,
      {id: 'Manage Quote', type: 'manage'},
      {id: 'Step1', type: ''},
      {id: 'Step2', type: ''},
      {id: 'Step3', type: ''},
      {id: 'Step4', type: ''},
      {id: 'Step5', type: ''},
      {id: 'Step6', type: ''},
    ],
    processNaFields: () => {},
    getNextVisibleStep: () => next_step || 0,
    classify: () => {},
  };
}

function createMockProgramInit() {
  return {
    init: () => {},
  };
}

function createMockCache(pcache) {
  return {
    get: key => Promise.resolve(pcache || createMockCache()),
  };
}

function createMockRater() {
  return {
    init: () => {},
  };
}

function createMockDao(min_quote_id, max_quote_id) {
  return {
    on: () => createMockDao(),
    init: () => {},
    pullQuote: () => {},
    saveQuote: () => {},
    saveQuoteMeta: () => {},
    getMinQuoteId: c => c(min_quote_id || 0),
    getMaxQuoteId: c => c(max_quote_id || 999999),
  };
}
