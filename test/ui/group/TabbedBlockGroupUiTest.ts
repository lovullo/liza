/**
 * Test case for StackedGroupUi
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
//Object.defineProperty(exports, "__esModule", { value: true });
const BaseQuote = require('../../..').quote.BaseQuote,
  ClientQuote = require('../../..').client.quote.ClientQuote,
  chai = require('chai'),
  expect = chai.expect,
  sinon = require('sinon'),
  sinonChai = require('sinon-chai');

chai.use(sinonChai);

import {TabbedBlockGroupUi as Sut} from '../../../src/ui/group/TabbedBlockGroupUi';
import {Group} from '../../../src/group/Group';
import {ElementStyler} from '../../../src/ui/ElementStyler';
import {GroupContext} from '../../../src/ui/context/GroupContext';
import {GroupStateManager} from '../../../src/ui/group/GroupStateManager';
import {FieldStyler} from '../../../src/ui/context/styler/FieldStyler';

describe('ui.group.TabbedGroupUi', () => {
  describe('#visit', function () {
    [
      {
        tabs: [
          {eligible: true},
          {eligible: true},
          {eligible: true, selected: true},
        ],
      },
      {
        tabs: [
          {eligible: true},
          {eligible: true, selected: true},
          {eligible: false},
        ],
      },
      {
        tabs: [
          {eligible: false},
          {eligible: true},
          {eligible: true, selected: true},
        ],
      },
      {
        tabs: [
          {eligible: true},
          {eligible: false},
          {eligible: true, selected: true},
        ],
      },
      {
        tabs: [
          {eligible: true},
          {eligible: true},
          {eligible: false},
          {eligible: false},
          {eligible: true, selected: true},
          {eligible: false},
        ],
      },
    ].forEach(({tabs}) => {
      const jsdom = require('jsdom-global')();
      const quote = createQuote();
      const content = createContent(tabs);
      const sut = createSut(content.content, content.jquery, tabs.length);

      sut.init(quote);
      sut.visit();

      // Assert: 'inactive' class has been removed from the selected tab
      const spies = content.spies;
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].selected) {
          expect(spies.remove[i]).to.have.been.calledOnce;
        } else {
          expect(spies.remove[i]).to.have.callCount(0);
        }
      }

      jsdom();
    });
  });
});

/**
 * Mock elements within the DOM
 *
 * @param tabs - information about how to render the tabs
 */
function createContent(tabs: any[]) {
  // Create spies to monitor method calls
  const spies = <Record<string, any[]>>{
    remove: [],
  };

  // Mock list of individual tabs
  const tabList = [];
  let tab;
  for (let i = 0; i < tabs.length; i++) {
    tab = {
      classList: {
        contains: sinon.stub(),
        add: sinon.stub(),
        remove: function () {},
      },
    };
    tab.classList.contains.withArgs('disabled').returns(!tabs[i].eligible);
    tab.classList.contains.withArgs('inactive').returns(true);
    tabList.push(tab);
    spies.remove.push(sinon.spy(tab.classList, 'remove'));
  }

  // Mock box that contains tabs
  const box = {
    querySelector: sinon.stub(),
    getAttribute: sinon.stub().returns('attribute'),
    appendChild: sinon.stub(),
    classList: {
      contains: sinon.stub().returns(false),
    },
    getElementsByClassName: sinon.stub().returns([]),
    hasClass: sinon.stub().returns(false),
  };
  box.querySelector.withArgs('li').returns({
    parentElement: {
      removeChild: sinon.stub().returns({
        cloneNode: sinon.stub().returns('cloneNode'),
      }),
    },
  });
  box.querySelector.withArgs('.tab-content').returns({
    parentElement: {
      removeChild: sinon.stub().returns({}),
    },
    classList: {
      contains: sinon.stub().returns(false),
    },
  });
  box.querySelector.withArgs('ul.tabs').returns({
    querySelectorAll: sinon.stub().returns(tabList),
    classList: {
      contains: sinon.stub().returns(false),
      add: sinon.stub(),
    },
  });

  const tabbedBlock = {
    0: box,
    hasClass: (_: any) => false,
  };

  // Mock object used to search content
  const $content = {
    find: sinon.stub(),
  };

  $content.find.withArgs('.groupTabbedBlock').returns(tabbedBlock);
  $content.find.withArgs('.action').returns({live: sinon.stub()});
  $content.find.withArgs('.addTab:first').returns({
    click: sinon.stub(),
  });

  // Create stubs for content and jquery
  const content = {
    getAttribute: sinon.stub().returns('attribute'),
    getElementsByClassName: sinon.stub().returns([]),
  };

  const jquery = sinon.stub();
  jquery.withArgs(content).returns($content);

  return {content, jquery, spies};
}

/**
 * Create new SUT
 *
 * @param {Object} content     content to render
 *
 * @return {Sut}
 */
function createSut(content: any, jquery: any, tabCount: number) {
  const group = <Group>{
    getExclusiveFieldNames: sinon.stub().returns([]),
    getExclusiveCmatchFieldNames: sinon.stub().returns([]),
    isInternal: sinon.stub().returns(false),
    getIndexFieldName: sinon.stub().returns('index_field_name'),
    locked: sinon.stub().returns(false),
    minRows: sinon.stub().returns(0),
    maxRows: sinon.stub().returns(1),
    getUserFieldNames: sinon.stub().returns([]),
    getWhenFieldName: sinon.stub().returns(''),
  };

  const context = <GroupContext>(<unknown>{
    init: function () {},
  });

  const styler = <ElementStyler>{apply: sinon.stub()};

  const feature_flag = {
    isEnabled: (_: any) => {
      return false;
    },
  };

  const manager = <GroupStateManager>{
    is: sinon.stub(),
    observes: sinon.stub(),
    processDataAttributes: sinon.stub(),
  };

  const sut = new Sut(
    group,
    content,
    styler,
    jquery,
    context,
    {},
    <FieldStyler>(<unknown>null),
    feature_flag,
    manager
  );

  sut.getCurrentIndexCount = sinon.stub().returns(tabCount);

  return sut;
}

/**
 * Create a quote that can be used for testing purposes
 *
 * @return {ClientQuote}
 */
function createQuote() {
  const bucket = {
    setValues: sinon.stub(),
    on: sinon.stub(),
    getData: sinon.stub().returns([]),
    getDataByName: sinon.stub().returns([]),
    filter: sinon.stub(),
  };

  const staging_callback = sinon.stub().returns(bucket);
  const quote = new BaseQuote(1, bucket, {getFirstStepId: () => 0});

  quote.visitData = (cb: any) => cb(bucket);

  return new ClientQuote(quote, {}, staging_callback);
}
