/**
 *  Testing assets for ui/group
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

const sinon = require('sinon');

export const createContainer = () => {
  const container = {
    querySelectorAll: sinon.stub(),
    querySelector: sinon.stub(),
  };

  const dlist = {
    parentNode: {removeChild: () => {}},
  };

  container.querySelector.withArgs('dl').returns(dlist);

  return container;
};

export const createContent = (visible: boolean = false) => {
  return {
    querySelector: sinon.stub(),
    querySelectorAll: sinon.stub(),
    getAttribute: sinon.stub().returns('foo'),
    classList: createClassList(visible),
    addEventListener: sinon.stub(),
    getElementsByClassName: sinon.stub().returns([]),
  };
};

export const createBoxContent = () => {
  const content = createContent();

  content.querySelector = () => createContent();

  return content;
};

export const createContext = () => {
  return {
    createFieldCache: () => {},
    detachFields: () => {},
    detachStoreContent: () => {},
    hide: () => {},
    init: () => {},
    setOptions: () => {},
    setValueByName: () => {},
    show: () => {},
  };
};

export const createField = () => {
  return {};
};

export const createGroup = (
  field_name: any,
  fields: any[] = [],
  cmatch_fields: any[] = [],
  is_internal: boolean = true,
  when_name: string = ''
) => {
  return {
    getIndexFieldName: sinon.stub().returns(field_name),
    getUserFieldNames: sinon.stub().returns(fields),
    getExclusiveFieldNames: sinon.stub().returns(fields),
    getExclusiveCmatchFieldNames: sinon.stub().returns(cmatch_fields),
    isInternal: sinon.stub().returns(is_internal),
    getWhenFieldName: sinon.stub().returns(when_name),
  };
};

export const createJqueryContent = () => {
  return {
    show: sinon.stub(),
    hide: sinon.stub(),
    find: sinon.stub().returns({live: sinon.stub()}),
    0: getDomElement(),
    attr: sinon.stub(),
  };
};

export const getDomElement = () => {
  return {
    getAttribute: sinon.stub().returns('foo'),
    querySelector: () => {
      return {classList: createClassList()};
    },
    classList: createClassList(),
  };
};

export const createFeatureFlag = () => {
  return {
    isEnabled: (_: any) => {
      return false;
    },
  };
};

export const createClassList = (visible: boolean = false) => {
  return {
    contains: sinon.stub().returns(visible),
    add: sinon.stub(),
    remove: sinon.stub(),
  };
};

export const createQuote = () => {
  return {
    on: sinon.stub(),
    onClassifyAndNow: sinon.stub(),
    visitData: sinon.stub(),
    setData: sinon.stub(),
    getDataByName: sinon.stub(),
  };
};

export const createStateManager = () => {
  return {
    is: sinon.stub(),
    observes: sinon.stub(),
    processDataAttributes: sinon.stub(),
  };
};

export const createRContext = () => {
  return {
    getFieldByName: () => {
      return {
        revokeStyle: () => {},
        applyStyle: () => {},
      };
    },
  };
};

/**
 * Create new SUT
 *
 * @param  Sut   - target Sut
 * @param  input - mock content
 *
 * @return system under test
 */
export const createSut = (Sut: any, input: any = {}) => {
  const $content = input.$content ?? createJqueryContent();
  const field = input.field ?? createField();
  const group = input.group ?? createGroup(field);
  const content = input.content ?? createContent();
  const jquery = sinon.stub().withArgs(content).returns($content);
  const context = input.context ?? createContext();
  const rcontext = input.rcontext ?? createRContext();
  const feature_flag = input.feature_flag ?? createFeatureFlag();
  const styler = input.styler ?? null;
  const state_manager = input.state_manager ?? createStateManager();

  return new Sut(
    group,
    content,
    styler,
    jquery,
    context,
    rcontext,
    null,
    feature_flag,
    state_manager
  );
};
