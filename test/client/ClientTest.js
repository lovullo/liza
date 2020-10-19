/**
 * Tests Client
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
const sinon = require('sinon');
const expect = chai.expect;
const Sut = require('../../src/client/Client');

module.exports = {
  cmatch: (program, client) => {},
};

describe('nav#preStepChange hook', () => {
  [
    {
      label:
        'Allow navigation w/no save when navigating backwards w/autosave on dirty quote',
      step_id: 2,
      current_step_id: 3,
      autosave: true,
      force: false,
      dirty: true,
      expected_clear_failures: true,
      expected_event_to_abort: false,
      expected_to_dosave: false,
      expected_to_show_dialog: false,
    },
    {
      label:
        'Force save (no dialog) dirty quote when navigating forward w/autosave',
      step_id: 3,
      current_step_id: 2,
      autosave: true,
      force: false,
      dirty: true,
      expected_clear_failures: false,
      expected_event_to_abort: true,
      expected_to_dosave: true,
      expected_to_show_dialog: false,
    },
    {
      label:
        'Shows dialog when navigating backwards w/no autosave on dirty quote',
      step_id: 2,
      current_step_id: 3,
      autosave: false,
      force: false,
      dirty: true,
      expected_clear_failures: false,
      expected_event_to_abort: true,
      expected_to_dosave: false,
      expected_to_show_dialog: true,
    },
    {
      label:
        'Shows dialog when navigating forward w/no autosave on dirty quote',
      step_id: 3,
      current_step_id: 2,
      autosave: false,
      force: false,
      dirty: true,
      expected_clear_failures: false,
      expected_event_to_abort: true,
      expected_to_dosave: false,
      expected_to_show_dialog: true,
    },
    {
      label: 'Allow navigation w/no save when quote is not dirty',
      step_id: 3,
      current_step_id: 2,
      autosave: false,
      force: false,
      dirty: false,
      expected_clear_failures: false,
      expected_event_to_abort: false,
      expected_to_dosave: false,
      expected_to_show_dialog: false,
    },
  ].forEach(
    ({
      label,
      step_id,
      current_step_id,
      autosave,
      force,
      dirty,
      expected_clear_failures,
      expected_event_to_abort,
      expected_to_dosave,
      expected_to_show_dialog,
    }) => {
      it(label, done => {
        const {program, nav, ui, ui_dialog, data_validator, quote} = getStubs();

        nav.emit('quoteIdChange');
        program.autosave = autosave;
        quote.isDirty = () => dirty;
        let shows_dialog = false;
        ui_dialog.showDirtyDialog = () => {
          shows_dialog = true;
        };

        let clears_failures = false;
        data_validator.clearFailures = () => {
          clears_failures = true;
        };

        let is_saved = false;
        ui.saveStep = () => {
          is_saved = true;
        };

        program.forward = () => null;

        const event = {
          stepId: step_id,
          currentStepId: current_step_id,
          force: force,
          abort: false,
        };

        nav.on = (_, cb) => {
          cb(event);
          return nav;
        };

        // setup step and make all steps discardable
        ui.getCurrentStep = () => createMockStep(current_step_id);
        program.discardable = Array(current_step_id + 1).fill(true);
        nav.emit('preStepChange', event);

        expect(is_saved).to.deep.equal(expected_to_dosave);
        expect(clears_failures).to.deep.equal(expected_clear_failures);
        expect(event.abort).to.deep.equal(expected_event_to_abort);
        expect(shows_dialog).to.deep.equal(expected_to_show_dialog);
        done();
      });
    }
  );
});

function getStubs() {
  const cmatch = createMockCmatch();
  const dapi_mgr = createMockDapiManager();
  const data_mediator = createMockDataMediator();
  const data_proxy = createMockDataProxy();
  const data_validator = createMockDataValidator();
  const doc = createMockDocument();
  const element_styler = createMockElementStyler();
  const field_monitor = createMockFieldMonitor();
  const hash_nav = createMockHashNav();
  const jquery = createMockJquery();
  const nav = createMockNav();
  const program = createMockProgram();
  const quote = createMockQuote();
  const ui = createMockUi();
  const ui_dialog = createMockUiDialog();
  const ui_styler = createMockUiStyler();
  const win = createMockWindow();

  const factory = {
    createClientEventHandler: () => {},
    createCmatch: () => cmatch,
    createDataApiManager: () => dapi_mgr,
    createDataApiMediator: () => data_mediator,
    createDataProxy: () => data_proxy,
    createDataValidator: () => data_validator,
    createDomFieldFactory: () => {},
    createElementStyler: () => element_styler,
    createFieldValidator: () => field_monitor,
    createFormErrorBox: () => {},
    createHashNav: () => hash_nav,
    createNav: () => nav,
    createNavStyler: () => {},
    createNotifyBar: () => {},
    createProgram: () => program,
    createQuote: () => quote,
    createQuotePreStagingHook: () => {
      return () => {};
    },
    createQuoteStagingHook: () => {
      return () => {};
    },
    createRootDomContext: () => createMockRootContext(),
    createStagingBucketDiscard: () => {},
    createSidebar: () => createMockSidebar(),
    createSidebarErrorStyler: () => {},
    createStepErrorStyler: () => {},
    createUi: () => ui,
    createUiDialog: () => ui_dialog,
    createUiNavBar: () => {},
    createUiStyler: () => ui_styler,
    createValidatorFormatter: () => {},
    createNavStylerManager: () => {},
    createMobileNav: () => {},
  };

  const sut = Sut(jquery, factory, undefined, jquery, doc, win);

  return {
    jquery: jquery,
    cmatch: cmatch,
    dapi_mgr: dapi_mgr,
    data_proxy: data_proxy,
    data_mediator: data_mediator,
    data_validator: data_validator,
    doc: doc,
    element_styler: element_styler,
    factory: factory,
    field_monitor: field_monitor,
    hash_nav: hash_nav,
    nav: nav,
    program: program,
    quote: quote,
    sut: sut,
    ui: ui,
    ui_dialog: ui_dialog,
    ui_styler: ui_styler,
    win: win,
  };
}

function createMockCmatch() {
  return {
    forceCmatchAction: () => {},
    hookClassifier: () => {},
    getMatches: () => {},
  };
}

function createMockStep(step_id) {
  const step = {
    getStep: () => step,
    getId: () => step_id,
    getBucket: () => {},
  };
  return step;
}

function createMockFieldMonitor() {
  const monitor = {
    on: () => monitor,
  };
  return monitor;
}

function createMockDataValidator() {
  const validator = {
    validate: () => {},
    on: () => validator,
    updateFailures: () => {},
  };
  return validator;
}

function createMockDataMediator() {
  return {monitor: () => {}};
}
function createMockUi() {
  const ui = {
    init: () => {},
    getSidebar: () => createMockSidebar(),
    getCurrentStep: () => null,
    setQuote: () => {},
    saveStep: () => ui,
    displayStep: () => {},
    setInternal: () => {},
    hideNotifyBar: () => {},
    on: () => ui,
  };
  return ui;
}

function createMockQuote() {
  return {
    visitData: () => {},
    isLocked: () => false,
    getId: () => '',
    setProgram: () => {},
    setClassifier: () => {},
    forceClassify: () => {},
    getExplicitLockStep: () => {},
  };
}

function createMockUiStyler() {
  return {
    register: () => {},
    attach: () => createMockUiStyler(),
  };
}

function createMockElementStyler() {
  return {
    getWidgetSelector: () => {},
    getWidgetIdSelector: () => {},
    setTypeData: () => createMockElementStyler(),
    setAnswerRefs: () => createMockElementStyler(),
    setHelpData: () => createMockElementStyler(),
    setDefaults: () => createMockElementStyler(),
    setDisplayDefaults: () => createMockElementStyler(),
    setSelectData: () => createMockElementStyler(),
  };
}

function createMockDataProxy() {
  return {
    on: () => {},
    abortAll: () => {},
    get: (_, cb) => {
      cb({
        content: {
          valid: true,
        },
      });
    },
  };
}

function createMockRootContext() {
  return {
    on: () => {},
  };
}

function createMockSidebar() {
  const sidebar = {
    setData: () => {},
    setInternal: () => sidebar,
    setQuote: () => sidebar,
    on: () => sidebar,
  };
  return sidebar;
}

function createMockUiDialog() {
  return {
    showDirtyDialog: () => {},
  };
}

function createMockDapiManager() {
  return {
    on: () => {},
  };
}
function createMockProgram() {
  return {
    autosave: true,
    on: () => {},
    getFirstStepId: () => 1,
    beforeLoadStep: () => {},
    getClassifierKnownFields: () => {},
    meta: {qtypes: ''},
    discardable: [],
    forward: () => {},
  };
}

function createMockHashNav() {
  const hash_nav = {
    init: () => {},
    hashError: () => hash_nav,
  };
  return hash_nav;
}

function createMockJquery() {
  return {
    find: () => createMockJquery(),
    extend: () => createMockJquery(),
    expr: () => {},
  };
}

function createMockDocument() {
  return {
    location: {href: ''},
    childNodes: {length: 0},
    getElementById: sinon.stub(),
  };
}

function createMockWindow() {
  return {
    location: {href: ''},
  };
}

function createMockNav() {
  const callbacks = {};
  const nav = {
    isLastStep: () => {},
    setMinStepId: () => {},
    setFirstStepId: () => {},
    on(name, callback) {
      callbacks[name] = callback;
      return nav;
    },
    emit(name) {
      const data = Array.prototype.slice.call(arguments, 1);
      callbacks[name].apply(null, data);
    },
  };
  return nav;
}
