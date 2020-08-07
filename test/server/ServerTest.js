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
      visited_step_id: 4,
      saved_step_id: 3,
      internal: false,
      expected_failure: true,
      expected_action: [{action: 'gostep', id: 4}],
    },
    {
      label: 'Sends error when step is not defined',
      step_id: 99,
      first_step_id: 2,
      current_step_id: 2,
      visited_step_id: 3,
      saved_step_id: 2,
      internal: false,
      expected_failure: true,
      expected_action: [{action: 'gostep', id: 2}],
    },
    {
      label: 'Non-internal user cannot visit manage step',
      step_id: 1,
      first_step_id: 2,
      current_step_id: 2,
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
      visited_step_id: 4,
      saved_step_id: 3,
      internal: false,
      expected_failure: false,
      expected_action: undefined,
    },
    {
      label:
        'Send step when navigating to the next valid step (top visited + 1)',
      step_id: 3,
      first_step_id: 2,
      current_step_id: 2,
      visited_step_id: 2,
      saved_step_id: 2,
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
        const program = createMockProgram(first_step_id);
        const session = createMockSession(internal);
        const request = createMockRequest();
        sut.sendStep(request, quote, program, step_id, session);
      });
    }
  );
});

function getSut(response) {
  return new Sut(
    response,
    createMockDao(),
    createMockLogger(),
    {},
    createMockDataProcessor(),
    {},
    {},
    {}
  );
}

function createMockQuote(current_step_id, saved_step_id, visited_step_id) {
  return {
    getExplicitLockStep: () => 0,
    setLastPremiumDate: () => {},
    setInitialRatedDate: () => {},
    getCurrentStepId: () => current_step_id,
    getTopSavedStepId: () => saved_step_id,
    getTopVisitedStepId: () => visited_step_id,
    refreshData: () => {},
    isLocked: () => {},
    getId: () => '111111',
  };
}

function createMockLogger() {
  return {
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

function createMockRequest() {
  return {
    end: () => {},
  };
}

function createMockResponse() {
  return {
    error: () => {},
    from: () => {},
  };
}

function createMockSession(internal) {
  return {
    isInternal: () => internal,
  };
}

function createMockDataProcessor() {
  return sinon.createStubInstance(DataProcessor);
}

function createMockProgram(first_step_id) {
  return {
    id: () => 'foo',
    getFirstStepId: () => first_step_id,
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
  };
}

function createMockCache() {
  return {
    get: key => Promise.resolve(createMockCache()),
  };
}

function createMockRater() {
  return {
    init: () => {},
  };
}

function createMockDao() {
  return {
    on: () => createMockDao(),
    init: () => {},
  };
}
