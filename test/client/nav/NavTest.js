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
  describe('#getNextStepId', () => {
    [
      {
        label: 'returns next visible step if available',
        next_visible_step: 4,
        start_step: 2,
        last_step_to_visit: undefined,
        expected_step: 4,
      },
      {
        label: 'returns last visited step there is no next visible step',
        next_visible_step: undefined,
        start_step: 4,
        last_step_to_visit: 4,
        expected_step: 4,
      },
      {
        label: 'returns current step if there is no next visible step',
        next_visible_step: undefined,
        start_step: 4,
        last_step_to_visit: 4,
        expected_step: 4,
      },
      {
        label: 'returns last step + 1 if on the last step',
        next_visible_step: 5,
        start_step: 5,
        last_step_to_visit: 5,
        expected_step: 6,
      },
    ].forEach(
      ({
        label,
        next_visible_step,
        start_step,
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
          expect(sut.getNextStepId(start_step)).to.equal(expected_step);
        });
      }
    );
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

          let get_previous_step_is_called = false;
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
