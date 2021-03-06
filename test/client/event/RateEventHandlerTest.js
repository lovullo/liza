/**
 * Tests RateEventHandler
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

'use strict';

const {expect} = require('chai');
const Sut = require('../../..').client.event.RateEventHandler;

describe('RateEventHandler', () => {
  describe('Handle Rating Event with all conditions met for clean rating', () => {
    it('calls #handle to do the rating', done => {
      let test_init_date = false;
      let test_last_prem_date = false;
      let test_lock_quote = false;

      const stepId = 1;
      const lockStep = 0;
      const indv = 'somerater';
      const initial_rated_date = 111;
      const last_premium_date = 222;

      const quote = {
        getExplicitLockStep: () => lockStep,
        setLastPremiumDate: given => {
          expect(given).to.equal(last_premium_date);
          test_init_date = true;
        },
        setInitialRatedDate: given => {
          expect(given).to.equal(initial_rated_date);
          test_last_prem_date = true;
        },
        getCurrentStepId: () => stepId,
        refreshData: () => {},
        isLocked: given => {
          test_lock_quote = true;
          return false;
        },
        getId: () => '111111',
      };

      const step = {
        invalidate: () => {},
        emptyBucket: () => {},
      };

      const ui = {
        getStep: dest => step,
      };

      const client = {
        showRatingInProgressDialog: () => 'Some Dialog',
        getQuote: () => quote,
        isSaving: () => false,
        once: (event, callback) => {},
        getUi: () => ui,
        program: {},
      };

      const response = {
        content: {
          data: 'Some Data',
          initialRatedDate: initial_rated_date,
          lastRatedDate: last_premium_date,
        },
      };

      const error = null;

      const proxy = {
        get: (url, callback) => callback(response, error),
      };

      const sut = Sut(client, proxy);

      sut.handle(
        '',
        (err, result) => {
          expect(err).to.equal(error);
          expect(result).to.equal(response.content.data);
          expect(test_init_date).to.equal(true);
          expect(test_last_prem_date).to.equal(true);
          expect(test_lock_quote).to.equal(true);
          done();
        },
        {
          indv: indv,
          stepId: stepId,
        }
      );
    });
  });

  describe('Handles rating delay', () => {
    it('uses a number to determine rating delay', done => {
      let set_timeout_called = false;
      let actual_delay = 0;

      const delay = '25';
      const expected_delay = 25000;

      const quote = {
        getExplicitLockStep: () => 0,
        setLastPremiumDate: () => {},
        setInitialRatedDate: () => {},
        getCurrentStepId: () => 1,
        refreshData: () => {},
        isLocked: () => {},
        getId: () => '111111',
      };

      const client = {
        uiDialog: {
          showRatingInProgressDialog: () => {
            return {close: () => {}};
          },
        },
        showRatingInProgressDialog: () => 'Some Dialog',
        getQuote: () => quote,
        isSaving: () => false,
        once: (_, __) => {},
        getUi: () => {
          return {
            getStep: _ => {
              return {invalidate: () => {}};
            },
          };
        },
        getDataByName: name => {
          return ['foo'];
        },
        program: {},
      };

      const proxy = {
        get: (url, callback) =>
          callback(
            {
              content: {
                data: 'Some Data',
                initialRatedDate: 111,
                lastRatedDate: 222,
              },
            },
            null
          ),
      };

      const sut = Sut(client, proxy);

      const old_setTimeout = setTimeout;

      setTimeout = (callback, delay) => {
        set_timeout_called = true;
        actual_delay = delay;

        callback.apply(this, arguments);
      };

      // this is necessary because if something breaks here, setTimeout
      // will not be restored and will yield a false negative on other
      // tests
      try {
        sut.handle('', (_, __) => {}, {
          stepId: 1,
          value: delay,
        });
      } catch (e) {
      } finally {
        setTimeout = old_setTimeout;
      }

      setTimeout = old_setTimeout;

      expect(set_timeout_called).to.equal(true);
      expect(actual_delay).to.equal(expected_delay);
      done();
    });

    it('rating delay defaults to zero', done => {
      let set_timeout_called = false;
      let actual_delay = 0;

      const delay = 'foo';
      const expected_delay = 0;

      const quote = {
        getExplicitLockStep: () => 0,
        setLastPremiumDate: () => {},
        setInitialRatedDate: () => {},
        getCurrentStepId: () => 1,
        refreshData: () => {},
        isLocked: () => {},
        getId: () => '111111',
      };

      const client = {
        uiDialog: {
          showRatingInProgressDialog: () => {
            return {close: () => {}};
          },
        },
        showRatingInProgressDialog: () => 'Some Dialog',
        getQuote: () => quote,
        isSaving: () => false,
        once: (_, __) => {},
        getUi: () => {
          return {
            getStep: _ => {
              return {invalidate: () => {}};
            },
          };
        },
        program: {},
      };

      const proxy = {
        get: (url, callback) =>
          callback(
            {
              content: {
                data: 'Some Data',
                initialRatedDate: 111,
                lastRatedDate: 222,
              },
            },
            null
          ),
      };

      const sut = Sut(client, proxy);

      const old_setTimeout = setTimeout;

      setTimeout = (callback, delay) => {
        set_timeout_called = true;
        actual_delay = delay;

        callback.apply(this, arguments);
      };

      // this is necessary because if something breaks here, setTimeout
      // will not be restored and will yield a false negative on other
      // tests
      try {
        sut.handle('', (_, __) => {}, {
          stepId: 1,
          value: delay,
        });
      } catch (e) {
      } finally {
        setTimeout = old_setTimeout;
      }

      expect(set_timeout_called).to.equal(true);
      expect(actual_delay).to.equal(expected_delay);
      done();
    });
  });

  describe('Determines step id', () => {
    it('if a step id is not passed in, get it from quote', done => {
      const step_expected = 3;
      let step_requested = null;

      const quote = {
        getExplicitLockStep: () => 0,
        setLastPremiumDate: () => {},
        setInitialRatedDate: () => {},
        getCurrentStepId: () => step_expected,
        refreshData: () => {},
        isLocked: () => {},
        getId: () => '111111',
      };

      const client = {
        uiDialog: {
          showRatingInProgressDialog: () => {
            return {close: () => {}};
          },
        },
        showRatingInProgressDialog: () => 'Some Dialog',
        getQuote: () => quote,
        isSaving: () => false,
        once: (_, __) => {},
        getUi: () => {
          return {
            getStep: id => {
              step_requested = id;
              return {invalidate: () => {}};
            },
          };
        },
        program: {},
      };

      const proxy = {
        get: (url, callback) =>
          callback(
            {
              content: {
                data: 'Some Data',
                initialRatedDate: 111,
                lastRatedDate: 222,
              },
            },
            null
          ),
      };

      const sut = Sut(client, proxy);

      const old_setTimeout = setTimeout;

      setTimeout = (callback, delay) => {
        callback.apply(this, arguments);
      };

      // this is necessary because if something breaks here, setTimeout
      // will not be restored and will yield a false negative on other
      // tests
      try {
        sut.handle('', (_, __) => {}, {
          value: 0,
        });
      } catch (e) {
      } finally {
        setTimeout = old_setTimeout;
      }

      expect(step_requested).to.equal(3);
      done();
    });
  });

  describe('Handle Rating Event with locked quote', () => {
    it('calls #handle to do the rating with a locked quote', done => {
      let test_lock_quote = false;

      const stepId = 1;
      const lockStep = 0;
      const indv = 'somerater';
      const error = null;
      const proxy = {
        get: (url, callback) => callback(response, error),
      };

      const quote = {
        getExplicitLockStep: () => lockStep,
        getCurrentStepId: () => stepId,
        isLocked: given => {
          test_lock_quote = true;
          return true;
        },
      };

      const client = {
        getQuote: () => quote,
        isSaving: () => false,
        getUi: () => ui,
        program: {},
      };

      const sut = Sut(client, proxy);

      sut.handle(
        '',
        (err, result) => {
          expect(test_lock_quote).to.equal(true);
          done();
        },
        {
          indv: indv,
          stepId: stepId,
        }
      );
    });
  });

  describe('Only rates on applicable steps', () => {
    [
      {
        label: 'Rates normally if program has no rate steps',
        rate_steps: undefined,
        step_id: 1,
        on_event: 'foo',
        indv: undefined,
        rate_expected: true,
      },
      {
        label: 'No rate when onEvent isnt beforeLoad and step is not rateable',
        rate_steps: [false, false],
        step_id: 1,
        on_event: 'foo',
        indv: undefined,
        rate_expected: false,
      },
      {
        label: 'No rate when onEvent is undefined and step is not rate step',
        rate_steps: [false, false],
        step_id: 1,
        on_event: undefined,
        indv: undefined,
        rate_expected: false,
      },
      {
        label: 'Rates when onEvent is beforeLoad and step is not rate step',
        rate_steps: [false, false],
        step_id: 1,
        on_event: 'beforeLoad',
        indv: undefined,
        rate_expected: true,
      },
      {
        label: 'Rates when onEvent is not beforeLoad and step is rate step',
        rate_steps: [false, true],
        step_id: 1,
        on_event: 'foo',
        indv: undefined,
        rate_expected: true,
      },
      {
        label: 'Rate when indv is present',
        rate_steps: [false, false],
        step_id: 1,
        on_event: undefined,
        indv: 'foo',
        rate_expected: true,
      },
    ].forEach(({label, rate_steps, step_id, on_event, indv, rate_expected}) => {
      it(label, done => {
        let is_saving_called = false;

        const proxy = {get: (_, cb) => cb({content: {data: '123'}}, null)};
        const quote = {
          getId: () => 123,
          getExplicitLockStep: () => 0,
          getCurrentStepId: () => step_id,
          isLocked: _ => false,
          refreshData: () => {},
          setLastPremiumDate: _ => {},
          setInitialRatedDate: _ => {},
        };

        const step = {
          invalidate: () => {},
          emptyBucket: () => {},
        };

        const ui = {
          getStep: _ => step,
        };

        const client = {
          uiDialog: {
            showRatingInProgressDialog: () => {
              return {close: () => {}};
            },
          },
          getQuote: () => quote,
          isSaving: () => {
            is_saving_called = true;
            return false;
          },
          getUi: () => ui,
          program: {
            rateSteps: rate_steps,
          },
        };

        const data = {
          value: 1,
          step_id: step_id,
          onEvent: on_event,
          indv: indv,
        };

        const sut = Sut(client, proxy);

        sut.handle(
          '',
          (err, result) => {
            expect(err).to.equal(null);
            expect(result !== null).to.equal(rate_expected);
            expect(is_saving_called).to.equal(rate_expected);
            done();
          },
          data
        );
      });
    });
  });

  describe('Handle Rating Event during a save event', () => {
    it('calls #handle to do the rating with a saving quote', done => {
      let test_init_date = false;
      let test_last_prem_date = false;
      let test_save_quote = false;

      const stepId = 1;
      const lockStep = 0;
      const indv = 'somerater';
      const initial_rated_date = 111;
      const last_premium_date = 222;

      const quote = {
        getExplicitLockStep: () => lockStep,
        setLastPremiumDate: given => {
          expect(given).to.equal(last_premium_date);
          test_init_date = true;
        },
        setInitialRatedDate: given => {
          expect(given).to.equal(initial_rated_date);
          test_last_prem_date = true;
        },
        getCurrentStepId: () => stepId,
        refreshData: () => {},
        isLocked: () => false,
        getId: () => '111111',
      };

      const step = {
        invalidate: () => {},
        emptyBucket: () => {},
      };

      const ui = {
        getStep: dest => step,
      };

      const client = {
        showRatingInProgressDialog: () => 'Some Dialog',
        getQuote: () => quote,
        isSaving: given => {
          test_save_quote = true;
          return true;
        },
        once: (event, callback) => callback(),
        getUi: () => ui,
        program: {},
      };

      const response = {
        content: {
          data: 'Some Data',
          initialRatedDate: initial_rated_date,
          lastRatedDate: last_premium_date,
        },
      };

      const error = null;

      const proxy = {
        get: (url, callback) => callback(response, error),
      };

      const sut = Sut(client, proxy);

      sut.handle(
        '',
        (err, result) => {
          expect(err).to.equal(error);
          expect(result).to.equal(response.content.data);
          expect(test_init_date).to.equal(true);
          expect(test_last_prem_date).to.equal(true);
          expect(test_save_quote).to.equal(true);
          done();
        },
        {
          indv: indv,
          stepId: stepId,
        }
      );
    });
  });

  describe('Hides waiting dialog ', () => {
    it('when value is set to -1', done => {
      let show_dialog_called = false;

      const quote = {
        getExplicitLockStep: () => 0,
        setLastPremiumDate: () => {},
        setInitialRatedDate: () => {},
        getCurrentStepId: () => 1,
        refreshData: () => {},
        isLocked: () => false,
        getId: () => '111111',
      };

      const step = {
        invalidate: () => {},
        emptyBucket: () => {},
      };

      const ui = {
        getStep: dest => step,
      };

      const client = {
        uiDialog: {
          showRatingInProgressDialog: () => {
            show_dialog_called = true;
            return {close: () => {}};
          },
        },
        getQuote: () => quote,
        isSaving: () => {
          return false;
        },
        once: (event, callback) => callback(),
        getUi: () => ui,
        program: {},
      };

      const response = {
        content: {
          data: 'Some Data',
          initialRatedDate: 111,
          lastRatedDate: 222,
        },
      };

      const error = null;

      const proxy = {
        get: (url, callback) => callback(response, error),
      };

      const sut = Sut(client, proxy);

      const old_setTimeout = setTimeout;

      setTimeout = (callback, delay) => {
        callback.apply(this, arguments);
      };

      // this is necessary because if something breaks here, setTimeout
      // will not be restored and will yield a false negative on other
      // tests
      try {
        sut.handle(
          '',
          (err, _) => {
            expect(err).to.equal(null);
            expect(show_dialog_called).to.be.false;
            done();
          },
          {
            stepId: 1,
            value: -1,
          }
        );
      } catch (e) {
        console.log(e);
      } finally {
        setTimeout = old_setTimeout;
      }
    });
  });
});
