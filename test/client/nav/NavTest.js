/* TODO remove after converting Nav to typescript */
/* eslint no-sparse-arrays: "off", no-global-assign: "off" */
/**
 * Test case for Nav
 *
 *  Copyright (C) 2010-2020 R-T Specialty, LLC.
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

const Sut = require('../../../src/client/nav/Nav'),
  sinon = require('sinon'),
  expect = require('chai').expect;

describe('Nav', () => {
  it('#isLastStep id determined correctly', () => {
    $ = sinon.stub().returns({bind: () => {}});

    let program = getMockProgram(getStepData(), true);
    const sut = new Sut(program);

    const given = 4;

    sut.setStepCount(4);

    expect(sut.isLastStep(given)).to.be.true;

    sut.setStepCount(5);

    expect(sut.isLastStep(given)).to.be.false;
  });

  it('#getFirstStepId Sets/gets first step id', () => {
    $ = sinon.stub().returns({bind: () => {}});

    let program = getMockProgram(getStepData(), true);
    const sut = Sut(program);

    const given = 4;
    const expected = 4;

    sut.setFirstStepId(given);

    expect(sut.getFirstStepId()).to.equal(expected);
  });

  it('#getTopVisitedStepId Sets/gets top visited step id', () => {
    $ = sinon.stub().returns({bind: () => {}});

    let program = getMockProgram(getStepData(), true);
    const sut = Sut(program);

    const given = 4;
    const expected = 4;

    sut.setTopVisitedStepId(given);

    expect(sut.getTopVisitedStepId()).to.equal(expected);
  });

  describe('#navigateToStep', () => {
    it('emits stepChange with the step id', done => {
      $ = sinon.stub().returns({
        bind: () => {},
      });

      let program = getMockProgram(getStepData(), true);
      const sut = Sut(program);
      const expected = 1;

      sut.on('stepChange', step_id => {
        expect(step_id).to.equal(expected);
        done();
      });

      sut.navigateToStep(expected, true);
    });

    it('returns if the step is not valid', () => {
      $ = sinon.stub().returns({
        bind: () => {},
      });

      let program = getMockProgram(getStepData(), true);
      const sut = Sut(program);

      let event_emitted = false;

      sut.on('stepChange', () => {
        event_emitted = true;
      });

      sut.navigateToStep(2);

      expect(event_emitted).to.be.false;
    });

    it('if requested step is hidden, navigate to earlier visible step', done => {
      $ = sinon.stub().returns({
        bind: () => {},
      });

      const next_step = 4;
      const prev_step = 2;
      const cur_step = 3;
      let program = getMockProgram(getStepData(), true, next_step, prev_step);
      const sut = Sut(program);

      // mock that current step is not visible
      let step_is_visible_is_called = false;
      program.isStepVisible = (__, step_id) => {
        expect(step_id).to.be.equal(cur_step);
        step_is_visible_is_called = true;
        return false;
      };
      program.getPreviousVisibleStep = () => prev_step;

      // make sure that we are navigating them back to the previous visible step
      sut.on('stepChange', step_id => {
        expect(step_id).to.equal(prev_step);
        done();
      });

      sut.navigateToStep(cur_step, true);
      expect(step_is_visible_is_called).to.be.true;
    });
  });

  describe('#getQuoteId', () => {
    [
      {
        label: 'returns value set by setQuoteId',
        id: 123,
        clear_step: true,
        expected_id: 123,
        expected_event: true,
        expected_clear_step: true,
      },
      {
        label: 'setting an undefined quote id does nothing',
        id: undefined,
        clear_step: true,
        expected_id: -1, // The default quote id
        expected_event: false,
        expected_clear_step: undefined,
      },
      {
        label: 'clear_step defaults to false if not supplied',
        id: 123,
        clear_step: undefined,
        expected_id: 123,
        expected_event: true,
        expected_clear_step: false,
      },
    ].forEach(
      ({
        label,
        id,
        clear_step,
        expected_id,
        expected_event,
        expected_clear_step,
      }) => {
        it(label, () => {
          $ = sinon.stub().returns({
            bind: () => {},
          });

          let program = getMockProgram(getStepData(), true);
          const sut = Sut(program);

          let event_emitted = false;
          let clear_step_actual = undefined;

          sut.on('quoteIdChange', (_id, clear_step) => {
            event_emitted = true;
            clear_step_actual = clear_step;
          });

          sut.setQuoteId(id, clear_step);

          expect(sut.getQuoteId()).to.equal(expected_id);
          expect(event_emitted).to.equal(expected_event);
          expect(clear_step_actual).to.equal(expected_clear_step);
        });
      }
    );
  });

  describe('#getNextStepId', () => {
    [
      {
        label: 'returns next visible step if available',
        next_visible_step: 4,
        start_step: 2,
        top_visited_step: 2,
        last_step_to_visit: undefined,
        expected_step: 4,
      },
      {
        label: 'returns last visited step there is no next visible step',
        next_visible_step: undefined,
        start_step: 4,
        top_visited_step: 4,
        last_step_to_visit: 4,
        expected_step: 4,
      },
      {
        label: 'returns current step if there is no next visible step',
        next_visible_step: undefined,
        start_step: 4,
        top_visited_step: 4,
        last_step_to_visit: 4,
        expected_step: 4,
      },
      {
        label: 'returns last step + 1 if on the last step',
        next_visible_step: 5,
        start_step: 5,
        top_visited_step: 5,
        last_step_to_visit: 5,
        expected_step: 6,
      },
      {
        label:
          'returns top visited step + 1 if on the last step and there is no current step',
        next_visible_step: 5,
        start_step: 5,
        top_visited_step: 5,
        last_step_to_visit: undefined, // first time init quote we haven't visited anything yet
        expected_step: 6,
      },
    ].forEach(
      ({
        label,
        next_visible_step,
        start_step,
        top_visited_step,
        last_step_to_visit,
        expected_step,
      }) => {
        it(label, () => {
          $ = sinon.stub().returns({bind: () => {}});

          let program = getMockProgram(getStepData(), true);
          const sut = Sut(program);

          program.getNextVisibleStep = () => next_visible_step;
          if (last_step_to_visit !== undefined) {
            sut.navigateToStep(last_step_to_visit, true);
          }

          sut.setTopVisitedStepId(top_visited_step);
          expect(sut.getNextStepId(start_step)).to.equal(expected_step);
        });
      }
    );
  });

  describe('#getPrevStepId', () => {
    [
      {
        label: 'returns previous visible step if available',
        step_to_visit: 4,
        prev_visible_step: 2,
        expected_step: 2,
      },
    ].forEach(({label, step_to_visit, prev_visible_step, expected_step}) => {
      it(label, () => {
        $ = sinon.stub().returns({
          bind: () => {},
        });

        let program = getMockProgram(getStepData(), true);
        const sut = Sut(program);

        // setup last step
        sut.navigateToStep(step_to_visit, true);

        let get_previous_step_is_called = false;
        program.getPreviousVisibleStep = (_, last_step_id) => {
          expect(last_step_id).to.be.equal(step_to_visit);
          get_previous_step_is_called = true;
          return prev_visible_step;
        };

        expect(sut.getPrevStepId()).to.equal(expected_step);
        expect(get_previous_step_is_called).to.be.true;
      });
    });
  });

  describe('#isValidNextStep', () => {
    [
      {
        label: 'if step is allowed and visible it is valid',
        next_step_id: 3,
        step_is_visible: true,
        current_step_id: 1,
        step_id: 2,
        expected: true,
      },
      {
        label: 'if step is not allowed and is visible it is not valid',
        next_step_id: 2,
        step_is_visible: true,
        current_step_id: 2,
        step_id: 3,
        expected: false,
      },
      {
        label: 'if step is allowed but not visible it is not valid',
        next_step_id: 4,
        step_is_visible: false,
        current_step_id: 2,
        step_id: 3,
        expected: false,
      },
      {
        label: 'is valid if on the last step',
        next_step_id: 5,
        step_is_visible: false,
        current_step_id: 5,
        step_id: 6,
        expected: true,
      },
    ].forEach(
      ({
        label,
        next_step_id,
        step_is_visible,
        current_step_id,
        step_id,
        expected,
      }) => {
        it(label, () => {
          $ = sinon.stub().returns({bind: () => {}});

          let program = getMockProgram(getStepData(), true);
          const sut = Sut(program);

          program.getNextVisibleStep = (_, __) => {
            return next_step_id;
          };

          // setup the current step
          sut.navigateToStep(current_step_id, true);

          program.isStepVisible = (_, __) => {
            return step_is_visible;
          };

          expect(sut.isValidNextStep(step_id)).to.equal(expected);
        });
      }
    );
  });

  it('#getCurrentSectionId returns current section', () => {
    $ = sinon.stub().returns({bind: () => {}});

    let program = getMockProgram(getStepData(), true);
    const sut = Sut(program);

    // by default there is no section
    expect(sut.getCurrentSectionId()).to.equal('');

    // our stepData puts step 3 in section 'Two'
    const step_id = 3;
    const expected_section = 'Two';
    sut.navigateToStep(step_id, true);

    expect(sut.getCurrentSectionId()).to.equal(expected_section);
  });

  it('#stepIsVisible is determined by program', () => {
    $ = sinon.stub().returns({bind: () => {}});

    let program = getMockProgram(getStepData(), true);
    const sut = Sut(program);

    const given_step_id = 4;
    const is_visible = true;
    let step_visible_is_called = false;
    program.isStepVisible = (_, step_id) => {
      expect(step_id).to.be.equal(given_step_id);
      step_visible_is_called = true;
      return is_visible;
    };

    expect(sut.stepIsVisible(given_step_id)).to.equal(is_visible);
    expect(step_visible_is_called).to.be.true;
  });

  it('#isQuoteReviewStep id determined correctly by step type', () => {
    $ = sinon.stub().returns({bind: () => {}});

    let program = getMockProgram(getStepData(), true);
    const sut = Sut(program);

    expect(sut.isQuoteReviewStep(3)).to.be.false;
    expect(sut.isQuoteReviewStep(4)).to.be.true;
  });

  it('#isManageQuoteStep is determined correctly by step type', () => {
    $ = sinon.stub().returns({bind: () => {}});

    let program = getMockProgram(getStepData(), true);
    const sut = Sut(program);

    expect(sut.isManageQuoteStep(2)).to.be.false;
    expect(sut.isManageQuoteStep(1)).to.be.true;
  });

  it('#stepWithinSection is determined whether a step is in a section', () => {
    $ = sinon.stub().returns({bind: () => {}});

    let program = getMockProgram(getStepData(), true);
    const sut = Sut(program);

    expect(sut.stepWithinSection(2, 'One')).to.be.false;
    expect(sut.stepWithinSection(1, 'One')).to.be.true;
  });

  it('#getFirstVisibleSectionStep determines the first visible step in the section', () => {
    $ = sinon.stub().returns({bind: () => {}});

    const step_data = getStepData();
    let program = getMockProgram(step_data, true);
    const sut = Sut(program);

    // mock our step visibility
    const step_visible = [false, false, true, true, true];

    let step_visible_is_called = false;
    program.isStepVisible = (_, step_id) => {
      step_visible_is_called = true;
      return step_visible[step_id];
    };

    // manage (not visible) is in section 'One'
    expect(sut.getFirstVisibleSectionStep('One')).to.equal(undefined);
    // steps 2 & 3 are in section 'Two'
    expect(sut.getFirstVisibleSectionStep('Two')).to.equal(2);
    // step 4 is in section 'Three'
    expect(sut.getFirstVisibleSectionStep('Three')).to.equal(4);

    expect(step_visible_is_called).to.be.true;
  });

  describe('#sectionIsVisible', () => {
    [
      // steps 2 & 3 are used in this test (section 'Two')
      {
        label: 'is true when one step in the section is visible',
        step_visibility: [false, false, false, true, false],
        expected: true,
      },
      {
        label: 'is true when all steps in the section is visible',
        step_visibility: [false, false, true, true, false],
        expected: true,
      },
      {
        label: 'is false when no steps in the section are visible',
        step_visibility: [false, false, false, false, false],
        expected: false,
      },
    ].forEach(({label, step_visibility, expected}) => {
      it(label, () => {
        $ = sinon.stub().returns({bind: () => {}});

        let program = getMockProgram(getStepData(), true);
        const sut = Sut(program);

        let step_visible_is_called = false;
        program.isStepVisible = (_, step_id) => {
          step_visible_is_called = true;
          return step_visibility[step_id];
        };

        expect(sut.sectionIsVisible('Two')).to.be.equal(expected);
        expect(step_visible_is_called).to.be.true;
      });
    });
  });

  describe('#hasSubsteps', () => {
    [
      {
        label: 'hasSubsteps returns false if has_substeps is undefined',
        has_substeps: undefined,
        expected: false,
      },
      {
        label: 'hasSubsteps returns true if has_substeps is true',
        has_substeps: true,
        expected: true,
      },
      {
        label: 'hasSubsteps returns false if has_substeps is false',
        has_substeps: false,
        expected: false,
      },
    ].forEach(({label, has_substeps, expected}) => {
      it(label, () => {
        $ = sinon.stub().returns({bind: () => {}});

        let program = getMockProgram(getStepData(), has_substeps);
        const sut = Sut(program);

        expect(sut.hasSubsteps()).to.equal(expected);
      });
    });
  });
});

function getMockProgram(data, sub_steps, next_step, prev_step) {
  return {
    steps: data,
    substeps: sub_steps || false,
    isStepVisible: () => true,
    getNextVisibleStep: () => next_step || 0,
    getPreviousVisibleStep: () => prev_step || 0,
  };
}

function getStepData() {
  return [
    ,
    {
      title: 'Manage Quote',
      id: 'manage',
      type: 'manage',
      groups: ['foo1'],
      section: 'One',
    },
    {
      title: 'General Information',
      id: 'general',
      type: '',
      groups: ['foo2'],
      section: 'Two',
    },
    {
      title: 'Location',
      id: 'location',
      type: '',
      groups: ['foo3'],
      section: 'Two',
    },
    {
      title: 'Coverages',
      id: 'coverages',
      type: 'review',
      groups: ['foo4'],
      section: 'Three',
    },
    {
      title: 'Print',
      id: 'print',
      type: '',
      groups: ['foo1'],
      section: 'Three',
    },
  ];
}
