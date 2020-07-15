/**
 * Test data validator
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

'use strict';

const root = require('../../');
const validate = root.validate;
const Sut = validate.DataValidator;
const MemoryStore = root.store.MemoryStore;
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');

const BucketDataValidator = validate.BucketDataValidator,
  ValidStateMonitor = validate.ValidStateMonitor;

chai.use(require('chai-as-promised'));

describe('DataValidator', () => {
  describe('#validate', () => {
    it('validates against bucket validator', () => {
      const bvalidator = createMockBucketValidator(function (
        data,
        err,
        inplace
      ) {
        expect(data).to.equal(diff);
        expect(inplace).to.be.true;

        // since we're mocking #validate, the callback will not
        // be called; we'll have to do so ourselves (eventually
        // this will be a promise)
        err('foo', expected_value, 1);
      });

      const {sut, vmonitor, dep_factory, getStore} = createStubs({
        bvalidator: bvalidator,
      });

      const {bstore} = getStore();

      const mock_bstore = sinon.mock(bstore);
      const mock_vmonitor = sinon.mock(vmonitor);
      const mock_dep_factory = sinon.mock(dep_factory);

      const diff = {foo: ['a', 'b', 'c']};
      const expected_failure = {};
      const expected_value = 'errmsg';
      const expected_failures = {
        foo: {1: expected_failure},
      };

      // call to actual validator
      mock_vmonitor
        .expects('update')
        .once()
        .withExactArgs(getStore().store, expected_failures)
        .returns(Promise.resolve(undefined));

      mock_dep_factory
        .expects('createFieldFailure')
        .once()
        .withExactArgs('foo', 1, expected_value)
        .returns(expected_failure);

      // clears previous diffs
      mock_bstore.expects('clear').once().returns(Promise.resolve(bstore));

      return Sut(bvalidator, vmonitor, dep_factory, getStore)
        .validate(diff)
        .then(() => {
          mock_vmonitor.verify();
          mock_dep_factory.verify();

          // cleared on call to err in above mock validator
          return expect(getStore().bstore.get('foo')).to.eventually.deep.equal([
            'a',
            undefined,
            'c',
          ]);
        });
    });

    it('merges classification changes with diff', () => {
      // SUT will only care about the indexes
      const classes = {
        first: {indexes: [], is: false},
        second: {indexes: [0, 1], is: true},
      };

      const {sut, getStore} = createStubs({});
      const {cstore} = getStore();

      const mock_cstore = sinon.mock(cstore);

      // clears previous diffs
      mock_cstore.expects('clear').once().returns(Promise.resolve(cstore));

      return sut.validate({}, classes).then(() => {
        // clear should have been called
        mock_cstore.verify();

        // keep in mind that we are using MemoryStore for this
        // test (whereas a real implementation would probably be
        // using a DiffStore)
        return Promise.all(
          Object.keys(classes).map(key =>
            expect(cstore.get(key)).to.eventually.deep.equal(
              classes[key].indexes
            )
          )
        );
      });
    });

    it('considers failures from external validator', () => {
      const expected_failure = {};

      const bvalidator = createMockBucketValidator(function (data, err, _) {
        // see `failures` below
        err('foo', 'moo', 2);
      });

      const {sut, vmonitor, dep_factory, getStore} = createStubs({
        bvalidator: bvalidator,
      });

      const diff = {foo: ['a', 'b', 'c']};
      const expected_failures = {
        foo: {
          0: expected_failure,
          2: expected_failure,
        },
      };

      const validatef = (given_diff, given_failures) => {
        expect(given_diff).to.equal(diff);
        expect(given_failures.foo[2]).to.equal(expected_failure);

        given_failures.foo[0] = expected_failure;
      };

      // TODO: this is an implementation detail left over from the
      // good 'ol days; remove it
      sinon
        .mock(vmonitor)
        .expects('update')
        .once()
        .withExactArgs(getStore().store, expected_failures)
        .returns(Promise.resolve(undefined));

      sinon
        .mock(dep_factory)
        .expects('createFieldFailure')
        .returns(expected_failure);

      return Sut(bvalidator, vmonitor, dep_factory, getStore).validate(
        diff,
        {},
        validatef
      );
    });

    it('rejects if field monitor update rejects', () => {
      const {sut, vmonitor} = createStubs({});

      const expected_e = Error();

      sinon
        .mock(vmonitor)
        .expects('update')
        .once()
        .returns(Promise.reject(expected_e));

      return expect(sut.validate({})).to.eventually.be.rejectedWith(expected_e);
    });

    // otherwise system might get into an unexpected state
    it('queues concurrent validations', () => {
      const expected_failure = {};

      let vcalled = 0;

      const bvalidator = createMockBucketValidator((_, __, ___) => vcalled++);

      const vmonitor = sinon.createStubInstance(ValidStateMonitor);

      const {sut, getStore} = createStubs({
        bvalidator: bvalidator,
        vmonitor: vmonitor,
      });

      const diff_a = {foo: ['a', 'b', 'c']};
      const diff_b = {foo: ['d']};

      const validatef = (diff, failures) => {
        // not a real failure; just used to transfer state to stub
        // (see below)
        failures.failedon = diff;
      };

      return new Promise((accept, reject) => {
        // by the time it gets to this the second time, store could
        // be in any sort of state depending on what callbacks were
        // invoked first (implementation details)
        vmonitor.update = (_, failures) => {
          const orig_diff = failures.failedon;

          // if the external validator was called twice, then they
          // didn't wait for us to finish
          if (orig_diff === diff_a && vcalled !== 1) {
            reject(Error('Request not queued'));
          }

          // if this key doesn't exist, then the store has been
          // cleared (which happens before it's re-populated with
          // the new diff)
          return expect(getStore().bstore.get('foo'))
            .to.eventually.deep.equal(orig_diff.foo)
            .then(() => {
              // the second test, after which we're done
              if (orig_diff === diff_b) {
                accept();
              }
            })
            .catch(e => reject(e));
        };

        sut.validate(diff_a, {}, validatef);
        sut.validate(diff_b, {}, validatef);
      });
    });
  });

  describe('#updateFailures', () => {
    it('directly updates failures', () => {
      const {sut, vmonitor, getStore} = createStubs({});
      const {bstore} = getStore();

      const diff = {
        foo: ['bar'],
        bar: ['baz'],
      };

      const failures = {};

      const mock_vmonitor = sinon.mock(vmonitor);
      const mock_bstore = sinon.mock(bstore);

      // clears previous diffs
      mock_bstore.expects('clear').once().returns(Promise.resolve(bstore));

      mock_vmonitor
        .expects('update')
        .once()
        .withExactArgs(getStore().store, failures);

      return sut.updateFailures(diff, failures).then(() => {
        mock_vmonitor.verify();
        mock_bstore.verify();

        // keep in mind that we are using MemoryStore for this
        // test (whereas a real implementation would probably be
        // using a DiffStore)
        return Promise.all(
          Object.keys(diff).map(key =>
            expect(bstore.get(key)).to.eventually.deep.equal(diff[key])
          )
        );
      });
    });

    it('queues concurrent requests', () => {
      const {sut, vmonitor, getStore} = createStubs({
        vmonitor: sinon.createStubInstance(ValidStateMonitor),
      });
      const {bstore} = getStore();

      // linked list (to previous)
      const fails = [{}, {}, {}];
      fails.forEach((fail, i) => (fail.prev = fails[i - 1]));

      const failcalls = [];

      vmonitor.update = (_, fail) => {
        failcalls.push(fail);
        return Promise.resolve(true);
      };

      return Promise.all([
        sut
          .updateFailures({}, fails[0])
          .then(() => expect(failcalls[0]).to.equal(fails[0])),

        sut
          .updateFailures({}, fails[1])
          .then(() => expect(failcalls[1]).to.equal(fails[1])),

        sut
          .updateFailures({}, fails[2])
          .then(() => expect(failcalls[2]).to.equal(fails[2])),
      ]).then(() => {
        // sanity check to make sure the above stuff was
        // actually called
        expect(failcalls.length).to.equal(fails.length);
      });
    });
  });

  describe('#clearFailures', () => {
    it('proxies to validator', () => {
      const {sut, vmonitor} = createStubs({});
      const mock_vmonitor = sinon.mock(vmonitor);

      const failures = ['foo', 'bar'];

      mock_vmonitor.expects('clearFailures').once().withExactArgs(failures);

      expect(sut.clearFailures(failures)).to.equal(sut);

      mock_vmonitor.verify();
    });
  });
});

function createMockBucketValidator(validatef) {
  validatef = validatef || ((x, y, z) => {});

  return BucketDataValidator.extend({
    'override public validate': validatef,
  })();
}

// This isn't yet moved into liza (at least at the time of writing this)
function createMockDependencyFactory(map) {
  // alternative to mocking since the ClientDependencyFactory is not going
  // to be used in the future
  return {
    createFieldFailure: () => {},
  };
}

function createStubStore() {
  const stores = {
    store: MemoryStore(),
    bstore: MemoryStore(),
    cstore: MemoryStore(),
  };

  return () => stores;
}

function createStubs({
  bvalidator = createMockBucketValidator(),
  vmonitor = ValidStateMonitor(),
  dep_factory = createMockDependencyFactory(),
  getStore = createStubStore(),
}) {
  return {
    bvalidator: bvalidator,
    vmonitor: vmonitor,
    dep_factory: dep_factory,
    getStore: getStore,
    sut: Sut(bvalidator, vmonitor, dep_factory, getStore),
  };
}
