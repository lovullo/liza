/**
 * Tests ClientQuote
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

'use strict';

const chai = require('chai');
const expect = chai.expect;
const {BaseQuote} = require('../../../').quote;
const {ClientQuote: Sut} = require('../../../').client.quote;
const {QuoteDataBucket} = require('../../../').bucket;

describe('ClientQuote', () => {
  it('Getters retrieve the correct data', () => {
    const base_quote = BaseQuote(123, QuoteDataBucket());
    const start_date = 12345;
    const agent_id = 90000;
    const agent_name = 'John Doe';
    const agent_entity_id = 12434300;
    const initial_rated_date = 1531507748;
    const last_prem_date = 1531508748;
    const created_by = 'foo@foo';
    const last_updated_by = 'bar@bar';

    const quote = Sut(
      base_quote,
      {
        startDate: start_date,
        agentId: agent_id,
        agentName: agent_name,
        agentEntityId: agent_entity_id,
        initialRatedDate: initial_rated_date,
        lastPremDate: last_prem_date,
        meta: {
          created_by_username: [created_by],
          last_updated_by_username: [last_updated_by],
        },
      },
      bucket => bucket
    );

    expect(quote.getStartDate()).to.equal(start_date);
    expect(quote.getAgentId()).to.equal(agent_id);
    expect(quote.getAgentName()).to.equal(agent_name);
    expect(quote.getAgentEntityId()).to.equal(agent_entity_id);
    expect(quote.getInitialRatedDate()).to.equal(initial_rated_date);
    expect(quote.getLastPremiumDate()).to.equal(last_prem_date);
    expect(quote.getCreatedByUserName()).to.equal(created_by);
    expect(quote.getLastUpdatedByUserName()).to.equal(last_updated_by);
  });

  it('isDirty is true when autosave occurs', done => {
    const bucket = createMockBucket();
    const base_quote = createMockBaseQuote(bucket);
    const data = {foo: 'bar'};
    const transport = createMockTransport(data);

    const sut = getSut(base_quote, {}, bucket => bucket);

    // test default is dirty
    expect(sut.isDirty()).to.be.equal(true);

    // test that save clears the dirty indication
    sut.save(transport, function () {});
    expect(sut.isDirty()).to.be.equal(false);

    // autosave makes it dirty again
    sut.autosave(transport);
    expect(sut.isDirty()).to.be.equal(true);

    done();
  });

  it('isDirty is false after step save', done => {
    const bucket = createMockBucket();
    const base_quote = createMockBaseQuote(bucket);
    const data = {foo: 'bar'};
    const transport = createMockTransport(data);

    let dirty_indication = [];
    bucket.commit = () => {
      dirty_indication.push(sut.isDirty());
    };

    const sut = getSut(base_quote, {}, bucket => bucket);
    // default is true
    expect(sut.isDirty()).to.be.true;

    sut.autosave(transport);
    sut.save(transport, function () {});

    // autosave will commit the bucket and set the dirty true;
    // then step save will commit and clear dirty flag
    expect(dirty_indication).to.deep.equal([true, false]);
    done();
  });

  it('autosave commits and sets top visited step on transport success', done => {
    const bucket = createMockBucket();
    const base_quote = createMockBaseQuote(bucket);
    const data = {foo: 'bar'};
    const transport = createMockTransport(data);

    let current_step_id = 2;
    let given_top_step_id = 0;
    base_quote.setTopVisitedStepId = step_id => {
      given_top_step_id = step_id;
    };
    base_quote.getCurrentStepId = () => current_step_id;
    bucket.commit = () => {
      expect(given_top_step_id).to.be.equals(current_step_id);
      done();
    };

    const sut = getSut(base_quote, {}, bucket => bucket);

    sut.autosave(transport);
  });

  it('autosave commit not called on transport error', done => {
    let commit_call_count = 0;

    const bucket = createMockBucket();
    const base_quote = createMockBaseQuote(bucket);
    const data = {foo: 'bar'};
    const error = 'Oh no!!!';
    const transport = createMockTransport(data, error);

    bucket.commit = () => {
      commit_call_count++;
    };

    const sut = getSut(base_quote, {}, bucket => bucket);

    sut.autosave(transport, () => {
      expect(commit_call_count).to.equal(0);
      done();
    });
  });

  it('autosave commit is superceded when invalidate is called', () => {
    let commit_call_count = 0;

    const bucket = createMockBucket();
    const base_quote = createMockBaseQuote(bucket);
    const data = {foo: 'bar'};
    const transport = createMockTransport(data);

    bucket.commit = () => {
      commit_call_count++;
    };

    const sut = getSut(base_quote, {}, bucket => bucket);

    transport.send = (_, cb) => {
      sut.invalidateAutosave();

      cb('', data);
    };

    sut.autosave(transport);
    expect(commit_call_count).to.equal(0);
  });

  it('autosave does not continue if there is a pending autosave', () => {
    const bucket = createMockBucket();
    const base_quote = createMockBaseQuote(bucket);
    const data = {foo: 'bar'};
    const transport = createMockTransport(data);

    let send_call_count = 0;

    const sut = getSut(base_quote, {}, bucket => bucket);

    let send_cb = () => {};

    transport.send = (_, cb) => {
      send_call_count++;

      send_cb = cb;
    };

    sut.autosave(transport);
    sut.autosave(transport);

    send_cb('', data);

    expect(send_call_count).to.equal(1);
  });

  it('subsequent autosave can happen if previous autosave completed', () => {
    const bucket = createMockBucket();
    const base_quote = createMockBaseQuote(bucket);
    const data = {foo: 'bar'};
    const transport = createMockTransport(data);

    let send_call_count = 0;

    const sut = getSut(base_quote, {}, bucket => bucket);

    let send_cb = () => {};

    transport.send = (_, cb) => {
      send_call_count++;

      send_cb = cb;
    };

    sut.autosave(transport);

    send_cb('', data);

    sut.autosave(transport);
    expect(send_call_count).to.equal(2);
  });

  it('autosave commit is superceded by a step save', done => {
    const bucket = createMockBucket();
    const base_quote = createMockBaseQuote(bucket);
    const data = {foo: 'bar'};
    const transport = createMockTransport(data);

    let commit_call_count = 0;
    bucket.commit = () => {
      commit_call_count++;
    };

    const sut = getSut(base_quote, {}, bucket => bucket);

    let transport_send_called = false;

    transport.send = (_, cb) => {
      if (transport_send_called === false) {
        transport_send_called = true;

        sut.save(transport, () => {});
      }

      cb('', data);
    };

    sut.autosave(transport, () => {
      expect(commit_call_count).to.equal(1);
      done();
    });
  });
});

function getSut(quote, data, staging_callback) {
  return Sut.extend({
    'override initQuote': function (quote, data) {
      return quote;
    },
  })(quote, data, staging_callback);
}

function createMockBucket(bucket_dirty = false) {
  return {
    on: _ => {},
    isDirty: () => !!bucket_dirty,
    commit: () => {},
  };
}

function createMockBaseQuote(bucket) {
  const quote = {
    visitData: cb => {
      cb(bucket);
    },
    getCurrentStepId: _ => {
      return 0;
    },
    setData: _ => {
      return quote;
    },
    setCurrentStepId: _ => {
      return quote;
    },
    setTopVisitedStepId: _ => {
      return quote;
    },
    setAgentId: _ => {
      return quote;
    },
    setAgentName: _ => {
      return quote;
    },
    setAgentEntityId: _ => {
      return quote;
    },
    setStartDate: _ => {
      return quote;
    },
    setInitialRatedDate: _ => {
      return quote;
    },
    setLastPremiumDate: _ => {
      return quote;
    },
    setCreatedByUserName: _ => {
      return quote;
    },
    setLastUpdatedByUserName: _ => {
      return quote;
    },
    setImported: _ => {
      return quote;
    },
    setBound: _ => {
      return quote;
    },
    needsImport: _ => {
      return quote;
    },
    setExplicitLock: _ => {
      return quote;
    },
    on: (_, cb) => {
      cb();
    },
  };

  return quote;
}

function createMockTransport(data = {}, err = '') {
  return {
    send(_, cb) {
      cb(err, data);
    },
  };
}
