/**
 * Test case for Ui
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

'use strict';

const chai = require('chai');
const FieldContext = require('../../').ui.context.FieldContext;
const Class = require('easejs').Class;
const expect = chai.expect;
const sinon = require('sinon');
const Sut = require('../../').ui.Ui;

describe('Ui', () => {
  it('isSaving is true while step is being saved', () => {
    const step = createMockStepUi();

    const sut = Sut.extend({
      'override __construct': function (options) {},
      'override hideErrors': function () {},
    })();

    expect(sut.isSaving()).to.be.false;

    let is_saving_calls = 0;

    // set save hook
    sut.saveStep(function () {
      expect(sut.isSaving()).to.be.true;
      is_saving_calls++;
    });

    sut.saveStep(
      step,
      function () {},
      function () {},
      true
    );

    expect(sut.isSaving()).to.be.false;
    expect(is_saving_calls).to.equal(1);
  });

  it('stepSave calls save hooks', () => {
    const step = createMockStepUi();

    const sut = Sut.extend({
      'override __construct': function (options) {},
      'override hideErrors': function () {},
    })();

    let hook_one_called = false;
    let hook_two_called = false;

    // set a save hook
    sut.saveStep(function () {
      hook_one_called = true;
    });
    sut.saveStep(function () {
      hook_two_called = true;
    });

    sut.saveStep(
      step,
      function () {},
      function () {},
      true
    );

    expect(hook_one_called).to.true;
    expect(hook_two_called).to.true;
  });

  [
    {
      label: 'Navigates to section when clicking new section on nav bar',
      current_section_id: 'foo',
      clicked_section_id: 'bar',
      first_section_step_id: 4,
      is_step_visited: true,
      expected_emit_calls: true,
      expected_event: 'stepChange',
      expected_step_id: 4,
    },
    {
      label: 'Does not navigate when clicking current section on nav bar',
      current_section_id: 'foo',
      clicked_section_id: 'foo',
      first_section_step_id: 4,
      is_step_visited: true,
      expected_emit_calls: false,
      expected_event: undefined,
      expected_step_id: undefined,
    },
    {
      label: 'Navigates to numeric step id when step has been visited',
      current_section_id: 'foo',
      clicked_section_id: 2,
      first_section_step_id: 2,
      is_step_visited: true,
      expected_emit_calls: true,
      expected_event: 'stepChange',
      expected_step_id: 2,
    },
    {
      label:
        'Does not navigate to numeric step id when step has not been visited',
      current_section_id: 'foo',
      clicked_section_id: 2,
      first_section_step_id: 2,
      is_step_visited: false,
      expected_emit_calls: false,
      expected_event: undefined,
      expected_step_id: undefined,
    },
    {
      label:
        'Does not navigate to string step id when first step in section has not been visited',
      current_section_id: 'foo',
      clicked_section_id: 'bar',
      first_section_step_id: 2,
      is_step_visited: false,
      expected_emit_calls: false,
      expected_event: undefined,
      expected_step_id: undefined,
    },
  ].forEach(
    ({
      label,
      current_section_id,
      clicked_section_id,
      first_section_step_id,
      is_step_visited,
      expected_emit_calls,
      expected_event,
      expected_step_id,
    }) => {
      it(label, done => {
        const nav = createMockNav();
        const nav_bar = createMockNavBar();
        const options = {
          uiStyler: createMockUiStyler(),
          content: createMockContent(),
          navBar: nav_bar,
          nav: nav,
          sidebar: createMockSidebar(),
        };

        const sut = Sut.extend({
          'override hideErrors': function () {},
          'override createDynamicContext': function (c) {},
        })(options);

        let emit_event_called = false;
        let emitted_event = undefined;
        let emitted_step_id = undefined;
        sut.emit = (event_name, step_id) => {
          emitted_event = event_name;
          emitted_step_id = step_id;
          emit_event_called = true;
        };

        nav.getCurrentSectionId = () => current_section_id;
        nav.getFirstVisibleSectionStep = () => first_section_step_id;
        nav.isStepVisited = () => is_step_visited;

        nav_bar.on = (event_name, cb) => {
          expect(event_name).to.equal('click');

          // for purpose of our test, just call the click event
          cb(clicked_section_id);
        };

        sut.init();
        expect(emit_event_called).to.be.equal(expected_emit_calls);
        expect(emitted_event).to.be.equal(expected_event);
        expect(emitted_step_id).to.be.equal(expected_step_id);
        done();
      });
    }
  );
});

function createMockStepUi() {
  return {
    getFirstInvalidField: () => ['', 1, true],
    scrollTo: () => {
      return;
    },
    isValid: () => true,
  };
}

function createMockUiStyler() {
  const styler = {
    init: () => styler,
    on: () => styler,
  };
  return styler;
}

function createMockContent() {
  return {
    find: () => createMockJquery(),
  };
}

function createMockJquery() {
  return {
    find: () => createMockJquery(),
    extend: () => createMockJquery(),
    expr: () => {},
    live: () => {},
  };
}

function createMockNavBar() {
  return {
    on: () => {},
  };
}

function createMockSidebar() {
  return {
    init: () => {},
  };
}

function createMockNav() {
  return {
    getCurrentSectionId: () => '',
    getFirstVisibleSectionStep: () => 0,
    isStepVisited: () => true,
  };
}
